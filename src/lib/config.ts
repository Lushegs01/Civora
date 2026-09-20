// Server-side only. Never import this from a "use client" module.

// Central runtime configuration.
//
// Two rules:
//   1. Production never silently falls back to a development default. If a
//      required secret is missing the process fails loudly at first use rather
//      than serving requests with a guessable key.
//   2. Demo behaviour is opt-in through an explicit flag, never implied by the
//      absence of configuration.

export type AppMode = "demo" | "production";

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const isProduction = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";

/** Demo mode is explicit. In production it must be switched on deliberately. */
export const appMode: AppMode = bool(process.env.CIVORA_DEMO_MODE, !isProduction)
  ? "demo"
  : "production";

export const isDemoMode = appMode === "demo";

/** Destructive demo tooling (dataset reset) needs its own second flag. */
export const demoToolsEnabled = isDemoMode && bool(process.env.ENABLE_DEMO_TOOLS, !isProduction);

/** The shared responder access code only works while demo mode is on. */
export const demoResponderCode = process.env.DEMO_RESPONDER_CODE || (isProduction ? "" : "civora-demo");

class ConfigError extends Error {
  constructor(key: string, hint: string) {
    super(`Missing required configuration: ${key}. ${hint}`);
    this.name = "ConfigError";
  }
}

let cachedSessionSecret: string | undefined;

/**
 * Secret used to derive the session-cookie binding. Required in production —
 * a shared default would let anyone mint a responder session.
 */
export function sessionSecret(): string {
  if (cachedSessionSecret) return cachedSessionSecret;
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 32) {
    cachedSessionSecret = configured;
    return cachedSessionSecret;
  }
  if (isProduction) {
    throw new ConfigError(
      "SESSION_SECRET",
      "Set a random value of at least 32 characters (openssl rand -hex 32)."
    );
  }
  if (configured) {
    cachedSessionSecret = configured;
    return cachedSessionSecret;
  }
  // Development only: random per process, so restarting invalidates sessions
  // instead of trusting a well-known constant.
  cachedSessionSecret = `dev-only-${Math.random().toString(36).slice(2)}${Date.now()}`;
  return cachedSessionSecret;
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new ConfigError("DATABASE_URL", "Point it at your PostgreSQL instance.");
  }
  return url;
}

export const uploads = {
  maxBytes: int(process.env.UPLOAD_MAX_MB, 8) * 1024 * 1024,
  maxPerReport: int(process.env.UPLOAD_MAX_FILES, 6)
};

export const session = {
  cookieName: "civora_session",
  /** Idle timeout — refreshed on use. */
  idleMs: int(process.env.SESSION_IDLE_MINUTES, 60) * 60_000,
  /** Hard ceiling regardless of activity. */
  absoluteMs: int(process.env.SESSION_MAX_HOURS, 8) * 3_600_000
};

export const retention = {
  /** Evidence retention horizon applied when a case is closed. */
  evidenceDays: int(process.env.RETENTION_EVIDENCE_DAYS, 365),
  /** How long a closed case keeps reporter contact details. */
  contactDays: int(process.env.RETENTION_CONTACT_DAYS, 180)
};

export const ai = {
  provider: (process.env.AI_PROVIDER || "mock").trim().toLowerCase(),
  apiKey: process.env.OPENAI_API_KEY?.trim() || "",
  model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
  timeoutMs: int(process.env.AI_TIMEOUT_MS, 12_000),
  maxInputChars: int(process.env.AI_MAX_INPUT_CHARS, 6_000),
  /** Daily ceiling on live provider calls across the whole deployment. */
  dailyQuota: int(process.env.AI_DAILY_QUOTA, 500)
};

/** True when a real model can actually be reached. */
export const aiLive = ai.provider === "openai" && ai.apiKey.length > 0;

export const storage = {
  driver: (process.env.OBJECT_STORAGE_DRIVER || (isProduction ? "" : "local")).trim().toLowerCase(),
  localDir: process.env.OBJECT_STORAGE_LOCAL_DIR || ".data/evidence",
  bucket: process.env.OBJECT_STORAGE_BUCKET?.trim() || "",
  region: process.env.OBJECT_STORAGE_REGION?.trim() || "auto",
  endpoint: process.env.OBJECT_STORAGE_ENDPOINT?.trim() || "",
  accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID?.trim() || "",
  secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY?.trim() || "",
  forcePathStyle: bool(process.env.OBJECT_STORAGE_FORCE_PATH_STYLE, true),
  prefix: process.env.OBJECT_STORAGE_PREFIX?.trim() || "evidence"
};

export const redis = {
  url: process.env.REDIS_REST_URL?.trim() || "",
  token: process.env.REDIS_REST_TOKEN?.trim() || ""
};

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export interface EmergencyContact {
  name: string;
  detail?: string;
  phone?: string;
}

/**
 * Emergency contacts are configuration, never code. Civora ships with none so
 * a deployment can't accidentally show a fictional number as a real one.
 */
export function emergencyContacts(): EmergencyContact[] {
  const raw = process.env.EMERGENCY_CONTACTS?.trim();
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c): c is EmergencyContact => Boolean(c) && typeof (c as EmergencyContact).name === "string")
      .map((c) => ({
        name: String(c.name).slice(0, 120),
        detail: c.detail ? String(c.detail).slice(0, 200) : undefined,
        phone: c.phone ? String(c.phone).slice(0, 40) : undefined
      }))
      .slice(0, 12);
  } catch {
    return [];
  }
}

/**
 * Configuration problems that should stop a production deployment from
 * claiming guarantees it cannot keep. Surfaced by /api/health.
 */
export function configurationWarnings(): string[] {
  const warnings: string[] = [];
  if (!isProduction) return warnings;
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    warnings.push("SESSION_SECRET is missing or shorter than 32 characters.");
  }
  if (!process.env.DATABASE_URL) warnings.push("DATABASE_URL is not set.");
  if (!storage.driver) warnings.push("OBJECT_STORAGE_DRIVER is not set; evidence uploads are disabled.");
  if (storage.driver === "local") {
    warnings.push("OBJECT_STORAGE_DRIVER=local is not durable in production; use s3 or vercel-blob.");
  }
  if (isDemoMode) warnings.push("CIVORA_DEMO_MODE is enabled in a production build.");
  if (demoToolsEnabled) warnings.push("ENABLE_DEMO_TOOLS is enabled in a production build.");
  if (!redis.url) warnings.push("No REDIS_REST_URL; rate limiting falls back to the database.");
  return warnings;
}
