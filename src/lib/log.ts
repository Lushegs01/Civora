// Structured server logging with redaction.
//
// Civora logs enough to operate the system and nothing that would betray a
// reporter: tracking tokens, session tokens, access codes, contact details and
// report narratives are stripped before anything is written.

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN = LEVELS[(process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug")] ?? 20;

/** Field names whose values must never reach a log sink. */
const REDACTED_KEYS = new Set([
  "token",
  "tokens",
  "trackingtoken",
  "trackingtokenhash",
  "recoverycode",
  "recoverycodehash",
  "sessiontoken",
  "tokenhash",
  "code",
  "accesscode",
  "password",
  "passwordhash",
  "authorization",
  "cookie",
  "apikey",
  "secret",
  "databaseurl",
  "contact",
  "contactname",
  "reportercontact",
  "email",
  "phone",
  "name",
  "displayname",
  "description",
  "privatedescription",
  "narrative",
  "note",
  "body",
  "excerpt",
  "database64",
  "lat",
  "lng"
]);

const MAX_DEPTH = 4;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (typeof value === "string") return value.length > 300 ? `${value.slice(0, 300)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACTED_KEYS.has(k.toLowerCase()) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return "[unloggable]";
}

function emit(level: LogLevel, event: string, context?: Record<string, unknown>) {
  if (LEVELS[level] < MIN) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(context ? (redact(context) as Record<string, unknown>) : {})
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const log = {
  debug: (event: string, context?: Record<string, unknown>) => emit("debug", event, context),
  info: (event: string, context?: Record<string, unknown>) => emit("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => emit("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => emit("error", event, context)
};

/** Exported for tests: proves the redaction list is actually applied. */
export const __redactForTests = redact;
