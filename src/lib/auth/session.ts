import crypto from "crypto";

// Demo auth model. Roles are never trusted from the client: the responder role
// is granted by an httpOnly cookie whose value is an HMAC the server verifies.
// Citizen access to their own case is via a random tracking token; the server
// stores only its SHA-256 hash. In production this maps to real sessions/SSO.

const SECRET = process.env.SESSION_SECRET || "civora-demo-secret";
export const RESPONDER_COOKIE = "civora_responder_session";

export function responderSessionValue(): string {
  return crypto.createHmac("sha256", SECRET).update("responder-demo-v1").digest("hex");
}

export function isResponder(cookies: { get(name: string): { value: string } | undefined }): boolean {
  const v = cookies.get(RESPONDER_COOKIE)?.value;
  if (!v) return false;
  const expected = responderSessionValue();
  const a = Buffer.from(v);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newTrackingToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(storedHash: string | undefined | null, token: string): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAuthorizedReporter(c: any, token: string | null | undefined): boolean {
  if (!token) return false;
  return c.reports.some((r: any) => tokenMatches(r.trackingTokenHash, token));
}
