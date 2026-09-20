import { prisma } from "./db/prisma";
import { redis } from "./config";
import { log } from "./log";
import { sha256 } from "./auth/tokens";

// Shared rate limiting.
//
// A Map in module scope only limits one instance. On any platform that runs
// more than one (every serverless host, every autoscaled container) it is
// close to no limit at all. Counters therefore live in Redis when one is
// configured, and otherwise in PostgreSQL — which every deployment has.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitRule {
  /** Distinct name so different endpoints never share a bucket. */
  name: string;
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  reportCreate: { name: "report:create", limit: 5, windowMs: 15 * 60_000 },
  evidenceUpload: { name: "evidence:upload", limit: 20, windowMs: 15 * 60_000 },
  track: { name: "track", limit: 60, windowMs: 5 * 60_000 },
  trackRecover: { name: "track:recover", limit: 5, windowMs: 60 * 60_000 },
  login: { name: "auth:login", limit: 8, windowMs: 15 * 60_000 },
  requestUpdate: { name: "case:request-update", limit: 6, windowMs: 60 * 60_000 },
  infoResponse: { name: "case:info-response", limit: 10, windowMs: 60 * 60_000 },
  aiExplain: { name: "ai:explain", limit: 10, windowMs: 10 * 60_000 },
  aiTranslate: { name: "ai:translate", limit: 10, windowMs: 10 * 60_000 },
  aiSummary: { name: "ai:summary", limit: 15, windowMs: 10 * 60_000 },
  civicSearch: { name: "civic:search", limit: 120, windowMs: 5 * 60_000 },
  responderAction: { name: "responder:action", limit: 120, windowMs: 5 * 60_000 },
  demoReset: { name: "demo:reset", limit: 3, windowMs: 60 * 60_000 }
} satisfies Record<string, RateLimitRule>;

/** Keys are hashed so a raw IP never lands in the database or a log line. */
function bucketKey(rule: RateLimitRule, identity: string): string {
  return `${rule.name}:${sha256(identity).slice(0, 32)}`;
}

export async function rateLimit(rule: RateLimitRule, identity: string): Promise<RateLimitResult> {
  const key = bucketKey(rule, identity);
  if (redis.url && redis.token) {
    const result = await redisLimit(key, rule);
    if (result) return result;
  }
  return databaseLimit(key, rule);
}

/**
 * Upstash-compatible REST protocol: INCR then EXPIRE on first hit.
 * Returns null on any transport problem so the caller falls back to the
 * database rather than failing open.
 */
async function redisLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${redis.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(rule.windowMs), "NX"],
        ["PTTL", key]
      ]),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const payload = (await res.json()) as Array<{ result?: number | string }>;
    const count = Number(payload[0]?.result ?? 0);
    const ttl = Number(payload[2]?.result ?? rule.windowMs);
    if (!Number.isFinite(count)) return null;
    const allowed = count <= rule.limit;
    return {
      allowed,
      remaining: Math.max(0, rule.limit - count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((ttl > 0 ? ttl : rule.windowMs) / 1000))
    };
  } catch (error) {
    log.warn("ratelimit.redis_unavailable", { rule: rule.name, error });
    return null;
  }
}

/**
 * Fixed-window counter in PostgreSQL.
 *
 * A single upsert per request; the window resets by comparing windowStart
 * inside the same statement, so two concurrent requests cannot both reset it.
 */
async function databaseLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime());
  const expiresAt = new Date(now.getTime() + rule.windowMs);
  const cutoff = new Date(now.getTime() - rule.windowMs);

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; window_start: Date }>>`
      INSERT INTO "RateLimitCounter" ("key", "count", "windowStart", "expiresAt")
      VALUES (${key}, 1, ${windowStart}, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitCounter"."windowStart" < ${cutoff} THEN 1
          ELSE "RateLimitCounter"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimitCounter"."windowStart" < ${cutoff} THEN ${windowStart}
          ELSE "RateLimitCounter"."windowStart"
        END,
        "expiresAt" = ${expiresAt}
      RETURNING "count", "windowStart" AS window_start
    `;
    const count = Number(rows[0]?.count ?? 1);
    const start = rows[0]?.window_start ?? windowStart;
    const allowed = count <= rule.limit;
    const elapsed = now.getTime() - new Date(start).getTime();
    return {
      allowed,
      remaining: Math.max(0, rule.limit - count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((rule.windowMs - elapsed) / 1000))
    };
  } catch (error) {
    // A limiter outage must not take the product down, but it must be visible.
    log.error("ratelimit.store_unavailable", { rule: rule.name, error });
    return { allowed: true, remaining: 0, retryAfterSeconds: 0 };
  }
}

/** Daily quota counter — used to cap live AI provider spend. */
export async function consumeDailyQuota(name: string, limit: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const result = await rateLimit({ name: `quota:${name}:${day}`, limit, windowMs: 24 * 3_600_000 }, "global");
  return result.allowed;
}

/** Housekeeping for the database-backed limiter. */
export async function pruneRateLimitCounters(): Promise<number> {
  const { count } = await prisma.rateLimitCounter.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return count;
}
