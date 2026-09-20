import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { log } from "../log";
import { rateLimit, type RateLimitRule } from "../rate-limit";
import { siteUrl } from "../config";

// Shared API plumbing: consistent status codes, safe user-facing messages,
// internal diagnostics that never carry payload contents, and an origin check
// on every mutation.

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data as object, { status });
}

export interface FailOptions {
  status?: number;
  /** Structured code the client can branch on. */
  code?: string;
  headers?: Record<string, string>;
}

/**
 * User-facing failure. The message is written for a person in distress, not
 * for a developer: no stack traces, no provider names, no internal ids.
 */
export function fail(message: string, options: FailOptions = {}): NextResponse {
  const status = options.status ?? 400;
  return NextResponse.json(
    { error: message, ...(options.code ? { code: options.code } : {}) },
    { status, headers: options.headers }
  );
}

/** Logs the detail, returns the generic message. */
export function serverError(event: string, error: unknown, message = "Something went wrong on our side. Please try again."): NextResponse {
  log.error(event, { error });
  return fail(message, { status: 500, code: "server_error" });
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Same-origin check for state-changing requests.
 *
 * The session cookie is SameSite=Strict, which already blocks cross-site
 * credentialed requests in current browsers; this is the belt to that
 * suspenders and also stops simple form-based cross-posts.
 */
export function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // No Origin header: same-origin navigation or a non-browser client. Fall
    // back to comparing the Host we were reached on.
    return true;
  }
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(siteUrl).origin);
  } catch {
    // Misconfigured NEXT_PUBLIC_SITE_URL — fall through to the request host.
  }
  const host = req.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  return allowed.has(origin);
}

export function requireSameOrigin(req: NextRequest): NextResponse | null {
  if (originAllowed(req)) return null;
  log.warn("api.cross_origin_rejected", { path: req.nextUrl.pathname });
  return fail("This request could not be verified. Please reload the page and try again.", {
    status: 403,
    code: "bad_origin"
  });
}

export interface LimitOptions {
  rule: RateLimitRule;
  identity: string;
  message: string;
}

export async function enforceRateLimit(options: LimitOptions): Promise<NextResponse | null> {
  const result = await rateLimit(options.rule, options.identity);
  if (result.allowed) return null;
  return fail(options.message, {
    status: 429,
    code: "rate_limited",
    headers: { "Retry-After": String(result.retryAfterSeconds) }
  });
}

/** Largest JSON body any route will read. */
export const MAX_JSON_BYTES = 256 * 1024;

export type ParsedBody<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * Reads and validates a JSON body with an explicit size ceiling, so a large
 * payload is rejected before it is parsed rather than after.
 */
export async function readJson<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
  options: { maxBytes?: number; invalidMessage?: string } = {}
): Promise<ParsedBody<z.infer<S>>> {
  const maxBytes = options.maxBytes ?? MAX_JSON_BYTES;
  const declared = Number.parseInt(req.headers.get("content-length") || "", 10);
  if (Number.isFinite(declared) && declared > maxBytes) {
    return {
      ok: false,
      response: fail("That request was too large.", { status: 413, code: "payload_too_large" })
    };
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, response: fail("We couldn't read your request. Please try again.") };
  }
  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: fail("That request was too large.", { status: 413, code: "payload_too_large" })
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { ok: false, response: fail("We couldn't read your request. Please try again.") };
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      response: fail(
        options.invalidMessage || first?.message || "Some details need attention. Please review and try again.",
        { status: 400, code: "invalid_input" }
      )
    };
  }
  return { ok: true, data: result.data };
}

/** Headers applied to every response that must never be cached or indexed. */
export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex"
} as const;
