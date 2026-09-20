import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/tokens";
import { findReportByTokenHash } from "@/lib/db/repository";
import { infoResponseSchema } from "@/lib/validation/schemas";
import { PUBLIC_EVIDENCE_LABEL } from "@/lib/privacy";
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
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The reporter's side of the request-information flow.
 *
 * The previous build set `awaitingReporter = true` and gave the reporter no
 * way to answer. An answer now closes the specific request, is stored as
 * restricted evidence, and clears the flag that was blocking the case.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.infoResponse,
    identity: clientIp(req),
    message: "Too many replies in a short time. Please try again shortly."
  });
  if (limited) return limited;

  const body = await readJson(req, infoResponseSchema);
  if (!body.ok) return body.response;
  const { caseId, token, requestId, body: answer } = body.data;

  const report = await findReportByTokenHash(hashToken(token));
  if (!report || report.case.publicCaseId !== caseId) {
    return fail("This case couldn't be verified for your device.", { status: 403, code: "not_authorized" });
  }

  try {
    const request = await prisma.infoRequest.findFirst({
      where: { id: requestId, caseId: report.caseId, status: "open" },
      select: { id: true, case: { select: { id: true, privacyMode: true } } }
    });
    if (!request) {
      return fail("That request is no longer open.", { status: 409, code: "request_closed" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.infoRequest.update({
        where: { id: request.id },
        data: { status: "answered", answeredAt: new Date(), answerBody: answer }
      });
      await tx.evidence.create({
        data: {
          caseId: request.case.id,
          kind: "report",
          title: "Reporter's response to an information request",
          sourceType: "citizen",
          submittedByLabel: PUBLIC_EVIDENCE_LABEL[request.case.privacyMode],
          relationship: "Answers a question the responding organization asked.",
          excerpt: answer,
          // The answer is between the reporter and the handlers.
          publicVisible: false
        }
      });
      await tx.caseEvent.create({
        data: {
          caseId: request.case.id,
          type: "INFO_PROVIDED",
          actorType: "reporter",
          actorLabel: PUBLIC_EVIDENCE_LABEL[request.case.privacyMode],
          visibility: "public",
          title: "Reporter responded to the information request",
          detail: "The requested information has been provided to the responding organization."
        }
      });
      // Only stop waiting once nothing else is outstanding.
      const stillOpen = await tx.infoRequest.count({
        where: { caseId: request.case.id, status: "open" }
      });
      await tx.case.update({
        where: { id: request.case.id },
        data: { awaitingReporter: stillOpen > 0, updatedAt: new Date() }
      });
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return serverError("case.info_response_failed", error, "We couldn't send your reply. Please try again.");
  }
}
