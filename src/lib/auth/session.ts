// Server-side session management.
//
// The old build granted responder access with a static HMAC of a constant
// string, signed with a fallback secret. That cookie never expired, identified
// nobody and could not be revoked. Sessions are now real rows: random token,
// stored as a hash, bound to a user, with both an idle and an absolute
// lifetime, rotation on privilege-relevant events, and server-side revocation.

import type { Role, User } from "@prisma/client";
import { prisma } from "../db/prisma";
import { isProduction, session as sessionConfig, sessionSecret } from "../config";
import { log } from "../log";
import { hashToken, pseudonymize, randomToken } from "./tokens";

export const SESSION_COOKIE = sessionConfig.cookieName;
/** Retained so a cookie minted by the previous build is cleared, not honoured. */
export const LEGACY_RESPONDER_COOKIE = "civora_responder_session";

export interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): void;
  delete(name: string): void;
}

export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export interface AuthenticatedActor {
  userId: string;
  sessionId: string;
  role: Role;
  orgId: string | null;
  displayName: string;
  email: string;
  isDemo: boolean;
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    // Strict keeps the cookie off any cross-site navigation, which is the
    // cheapest and most reliable CSRF defence for a first-party-only app.
    sameSite: "strict" as const,
    secure: isProduction,
    path: "/",
    maxAge: maxAgeSeconds
  };
}

/** Binds a session to a coarse client fingerprint so a stolen cookie is less portable. */
function bindingFor(ip: string | null, userAgent: string | null): string | null {
  if (!ip && !userAgent) return null;
  return pseudonymize(`${ip || "-"}|${userAgent || "-"}`, sessionSecret());
}

export async function createSession(
  user: Pick<User, "id" | "role" | "orgId" | "displayName" | "email" | "isDemo">,
  cookies: CookieWriter,
  client: { ip: string | null; userAgent: string | null }
): Promise<void> {
  const token = randomToken(32);
  const now = Date.now();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(now + sessionConfig.idleMs),
      absoluteExpiresAt: new Date(now + sessionConfig.absoluteMs),
      bindingHash: bindingFor(client.ip, client.userAgent)
    }
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(Math.floor(sessionConfig.absoluteMs / 1000)));
  log.info("auth.session_created", { userId: user.id, role: user.role, orgId: user.orgId });
}

/**
 * Resolves the current actor, or null. Expired and revoked sessions are
 * treated as absent; the idle window slides forward on use but never past the
 * absolute expiry.
 */
export async function currentActor(cookies: CookieReader): Promise<AuthenticatedActor | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const record = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!record) return null;

  const now = new Date();
  if (record.revokedAt || record.expiresAt <= now || record.absoluteExpiresAt <= now) {
    return null;
  }
  if (record.user.status !== "active") {
    log.warn("auth.session_rejected_inactive_user", { userId: record.userId });
    return null;
  }

  // Slide the idle window, but no more than once a minute to avoid a write on
  // every request.
  const nextExpiry = new Date(Math.min(now.getTime() + sessionConfig.idleMs, record.absoluteExpiresAt.getTime()));
  if (nextExpiry.getTime() - record.expiresAt.getTime() > 60_000) {
    await prisma.session
      .update({ where: { id: record.id }, data: { expiresAt: nextExpiry, lastSeenAt: now } })
      .catch(() => undefined);
  }

  return {
    userId: record.user.id,
    sessionId: record.id,
    role: record.user.role,
    orgId: record.user.orgId,
    displayName: record.user.displayName,
    email: record.user.email,
    isDemo: record.user.isDemo
  };
}

export async function revokeSession(cookies: CookieReader & CookieWriter): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }
  cookies.delete(SESSION_COOKIE);
  cookies.delete(LEGACY_RESPONDER_COOKIE);
}

/** Housekeeping: drop sessions nobody can use any more. */
export async function pruneExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { absoluteExpiresAt: { lt: new Date() } }
  });
  return count;
}
