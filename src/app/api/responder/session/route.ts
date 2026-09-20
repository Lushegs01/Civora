import type { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { responderLoginSchema } from "@/lib/validation/schemas";
import { createSession, revokeSession } from "@/lib/auth/session";
import { secretEquals, verifyPassword } from "@/lib/auth/password";
import { demoResponderCode, isDemoMode } from "@/lib/config";
import { canAccessWorkspace } from "@/lib/authz";
import {
  clientIp,
  enforceRateLimit,
  fail,
  NO_STORE_HEADERS,
  readJson,
  requireSameOrigin,
  serverError
} from "@/lib/api/respond";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { log } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Account the shared demo code signs in as.
 *
 * Deliberately the platform administrator: an evaluator needs to reach every
 * surface, including cases routed to an organization they are not a member of.
 * Organization scoping is demonstrated by signing in with one of the seeded
 * organization accounts instead. The code path is refused outright whenever
 * demo mode is off, so this grants nothing in production.
 */
const DEMO_ACCOUNT = "admin@civora-demo.example";
const GENERIC_FAILURE = "Those sign-in details weren't recognized.";

/**
 * Responder sign-in.
 *
 * Two paths, and the demo one is fenced off from production:
 *   - email + password, against a per-person account (the production path)
 *   - the shared demo access code, accepted only while CIVORA_DEMO_MODE=true
 *     and only for accounts flagged isDemo
 *
 * Either way the result is a session row bound to a specific person, so every
 * action they take is attributable to them rather than to "Response desk".
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.login,
    identity: clientIp(req),
    message: "Too many sign-in attempts. Please wait a few minutes and try again."
  });
  if (limited) return limited;

  const body = await readJson(req, responderLoginSchema);
  if (!body.ok) return body.response;

  const userAgent = headers().get("user-agent");
  const client = { ip: clientIp(req), userAgent };

  try {
    if (body.data.email && body.data.password) {
      const user = await prisma.user.findUnique({ where: { email: body.data.email.toLowerCase() } });
      // Run the verification even when no account matched, so timing doesn't
      // reveal which addresses exist.
      const passwordOk = await verifyPassword(body.data.password, user?.passwordHash ?? null);
      if (!user || !passwordOk || user.status !== "active") {
        log.warn("auth.login_failed", { reason: "credentials" });
        return fail(GENERIC_FAILURE, { status: 401, code: "invalid_credentials" });
      }
      if (!canAccessWorkspace({ ...user, userId: user.id, sessionId: "", orgId: user.orgId })) {
        return fail("This account doesn't have responder access.", { status: 403, code: "forbidden" });
      }
      await createSession(user, cookies(), client);
      return NextResponse.json(
        { ok: true, displayName: user.displayName, role: user.role },
        { headers: NO_STORE_HEADERS }
      );
    }

    // ---- demo access code path
    if (!isDemoMode) {
      return fail("Demo access is disabled on this deployment. Sign in with your work account.", {
        status: 403,
        code: "demo_disabled"
      });
    }
    if (!demoResponderCode) {
      return fail("Demo access is not configured on this deployment.", { status: 503, code: "demo_unconfigured" });
    }
    if (!body.data.code || !secretEquals(body.data.code.trim().toLowerCase(), demoResponderCode.toLowerCase())) {
      log.warn("auth.login_failed", { reason: "demo_code" });
      return fail("That access code isn't recognized. Check the demo instructions and try again.", {
        status: 401,
        code: "invalid_credentials"
      });
    }

    const demoUser = await prisma.user.findFirst({
      where: { email: DEMO_ACCOUNT, isDemo: true, status: "active" }
    });
    if (!demoUser) {
      return fail("The demo dataset hasn't been seeded on this deployment.", { status: 503, code: "demo_unseeded" });
    }
    await createSession(demoUser, cookies(), client);
    return NextResponse.json(
      { ok: true, displayName: demoUser.displayName, role: demoUser.role, demo: true },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return serverError("auth.login_error", error, "We couldn't sign you in. Please try again.");
  }
}

export async function DELETE() {
  await revokeSession(cookies());
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
