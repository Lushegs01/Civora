import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashRecoveryCode, randomToken, hashToken } from "@/lib/auth/tokens";
import { trackRecoverSchema } from "@/lib/validation/schemas";
import { normalizeCaseId } from "@/lib/db/repository";
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
 * Recovers access to a case from a one-time recovery code.
 *
 * Device-local tracking is the default because it leaks nothing, but a lost
 * phone should not mean a lost case. The code is stored only as a hash, is
 * single use, and exchanging it rotates the tracking token so the old device
 * (or anyone who saw the old link) loses access.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.trackRecover,
    identity: clientIp(req),
    message: "Too many recovery attempts. Please wait an hour before trying again."
  });
  if (limited) return limited;

  const body = await readJson(req, trackRecoverSchema);
  if (!body.ok) return body.response;

  const caseId = normalizeCaseId(body.data.caseId);
  if (!caseId) return denied();

  try {
    const report = await prisma.report.findFirst({
      where: {
        recoveryCodeHash: hashRecoveryCode(body.data.recoveryCode),
        case: { publicCaseId: caseId }
      },
      select: { id: true }
    });
    if (!report) {
      log.warn("track.recovery_failed", { caseId });
      return denied();
    }

    // Rotate: the recovered device gets a fresh token and the code is spent.
    const token = randomToken(32);
    await prisma.report.update({
      where: { id: report.id },
      data: { trackingTokenHash: hashToken(token), recoveryCodeHash: null }
    });
    log.info("track.recovery_succeeded", { caseId });

    return NextResponse.json({ caseId, token }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return serverError("track.recovery_error", error, "We couldn't restore access to that case. Please try again.");
  }
}

/** One message for every failure, so a wrong code and a wrong case look alike. */
function denied() {
  return fail("That case ID and recovery code don't match. Check both and try again.", {
    status: 403,
    code: "not_authorized"
  });
}
