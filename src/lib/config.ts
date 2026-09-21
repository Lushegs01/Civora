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

/**
 * Pooled connection used at runtime.
 *
 * Vercel's Postgres integration injects its own variable names rather than
 * DATABASE_URL, so those are accepted as fallbacks and a Vercel-native
 * deployment needs no database configuration set by hand. POSTGRES_URL is
 * preferred over POSTGRES_PRISMA_URL because the latter carries Prisma-specific
 * query parameters (pgbouncer, connect_timeout) that mean nothing to the
 * node-postgres adapter this app uses.
 */
export function databaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim();
  if (!url) {
    throw new ConfigError(
      "DATABASE_URL",
      "Point it at your PostgreSQL instance, or connect a Vercel Postgres store."
    );
  }
  return url;
}

/** True when a database connection string is available under any known name. */
export function hasDatabaseUrl(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim() ||
      process.env.POSTGRES_URL?.trim() ||
      process.env.POSTGRES_PRISMA_URL?.trim()
  );
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

/**
 * Model providers Civora can reach.
 *
 * Both speak the same wire format: Gemini publishes an OpenAI-compatible
 * endpoint that takes the same request body and returns the same response
 * shape, so one client serves both and there is no second code path to keep
 * honest. What differs is only the address, the key and the default model.
 */
const AI_PROVIDERS = {
  openai: {
    keyVars: ["OPENAI_API_KEY"],
    defaultModel: "gpt-4o-mini",
    defaultBaseUrl: "https://api.openai.com/v1"
  },
  gemini: {
    // GOOGLE_API_KEY is what Google's own tooling exports, so accept it too
    // rather than making someone rename a variable they already have.
    keyVars: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    defaultModel: "gemini-2.5-flash",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai"
  }
} as const;

export type AiProvider = keyof typeof AI_PROVIDERS;

export function isAiProvider(value: string): value is AiProvider {
  return value in AI_PROVIDERS;
}

const aiProvider = (process.env.AI_PROVIDER || "mock").trim().toLowerCase();
const aiSpec = isAiProvider(aiProvider) ? AI_PROVIDERS[aiProvider] : null;

/** The first of the provider's accepted key variables that is actually set. */
function aiApiKey(): string {
  if (!aiSpec) return "";
  for (const name of aiSpec.keyVars) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export const ai = {
  provider: aiProvider,
  apiKey: aiApiKey(),
  // AI_MODEL and AI_BASE_URL are provider-neutral. The OPENAI_-prefixed names
  // still work, so an existing OpenAI deployment keeps its configuration.
  model: process.env.AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || aiSpec?.defaultModel || "",
  baseUrl:
    process.env.AI_BASE_URL?.trim() || process.env.OPENAI_BASE_URL?.trim() || aiSpec?.defaultBaseUrl || "",
  timeoutMs: int(process.env.AI_TIMEOUT_MS, 12_000),
  maxInputChars: int(process.env.AI_MAX_INPUT_CHARS, 6_000),
  /** Daily ceiling on live provider calls across the whole deployment. */
  dailyQuota: int(process.env.AI_DAILY_QUOTA, 500),
  /** Which environment variable to name when the key is the thing missing. */
  keyVars: aiSpec?.keyVars ?? []
};

/** True when a real model can actually be reached. */
export const aiLive = aiSpec !== null && ai.apiKey.length > 0;

/**
 * Evidence storage driver.
 *
 * An explicit OBJECT_STORAGE_DRIVER always wins. Otherwise a Vercel Blob store
 * is detected from the token Vercel injects when one is connected, so that
 * deployment needs no storage configuration by hand either. Development with
 * neither falls back to the local disk, which production refuses.
 */
function resolveStorageDriver(): string {
  const explicit = process.env.OBJECT_STORAGE_DRIVER?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return "vercel-blob";
  return isProduction ? "" : "local";
}

export const storage = {
  driver: resolveStorageDriver(),
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

/**
 * The deployment's own origin, used for metadata and the same-origin check.
 *
 * Vercel injects the deployment host, so this resolves without configuration
 * there. The production domain is preferred over the per-deployment URL, which
 * changes on every push.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured;
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return `https://${productionHost}`;
  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (deploymentHost) return `https://${deploymentHost}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

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
  if (!hasDatabaseUrl()) {
    warnings.push("No database connection string (DATABASE_URL or a Vercel Postgres store).");
  }
  if (!storage.driver) {
    warnings.push("No evidence storage configured; uploads are disabled. Set OBJECT_STORAGE_DRIVER or connect a Vercel Blob store.");
  }
  if (storage.driver === "local") {
    warnings.push("OBJECT_STORAGE_DRIVER=local is not durable in production; use s3 or vercel-blob.");
  }
  if (isDemoMode) warnings.push("CIVORA_DEMO_MODE is enabled in a production build.");
  if (demoToolsEnabled) warnings.push("ENABLE_DEMO_TOOLS is enabled in a production build.");
  if (!redis.url) warnings.push("No REDIS_REST_URL; rate limiting falls back to the database.");
  // An AI provider that silently resolves to "mock" is the hardest kind of
  // misconfiguration to notice: nothing errors, every AI surface just says the
  // feature is not enabled. So say which variable is missing, by name.
  if (ai.provider !== "mock") {
    if (!isAiProvider(ai.provider)) {
      warnings.push(
        `AI_PROVIDER="${ai.provider}" is not a provider Civora knows; expected ${Object.keys(AI_PROVIDERS).join(" or ")}. AI features are disabled.`
      );
    } else if (!ai.apiKey) {
      warnings.push(
        `AI_PROVIDER="${ai.provider}" is set but no key is configured; set ${ai.keyVars.join(" or ")}. AI features are disabled.`
      );
    }
  }
  return warnings;
}
