import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/tokens";
import { findReportByTokenHash } from "@/lib/db/repository";
import { requestUpdateSchema } from "@/lib/validation/schemas";
import { SYSTEM_LABELS } from "@/lib/privacy";
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

/** The reporter asks the responding organization for a status update. */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.requestUpdate,
    identity: clientIp(req),
    message: "You've already asked for an update recently. Please give the team a little time."
  });
  if (limited) return limited;

  const body = await readJson(req, requestUpdateSchema);
  if (!body.ok) return body.response;

  const report = await findReportByTokenHash(hashToken(body.data.token));
  if (!report || report.case.publicCaseId !== body.data.caseId) {
    return fail("Not authorized to request updates for this case.", { status: 403, code: "not_authorized" });
  }

  try {
    const caseRecord = await prisma.case.findUnique({
      where: { id: report.caseId },
      select: { id: true, response: true, events: { where: { type: "UPDATE_REQUESTED" }, orderBy: { at: "desc" }, take: 1 } }
    });
    if (!caseRecord) return fail("That case could not be found.", { status: 404 });
    if (caseRecord.response === "closed") {
      return fail("This case is closed, so an update can no longer be requested.", { status: 409 });
    }

    // Don't stack duplicate requests on the timeline within the same day.
    const lastRequest = caseRecord.events[0];
    if (lastRequest && Date.now() - lastRequest.at.getTime() < 12 * 3_600_000) {
      return NextResponse.json(
        { ok: true, alreadyRequested: true },
        { headers: NO_STORE_HEADERS }
      );
    }

    await prisma.$transaction([
      prisma.caseEvent.create({
        data: {
          caseId: caseRecord.id,
          type: "UPDATE_REQUESTED",
          actorType: "reporter",
          actorLabel: SYSTEM_LABELS.reporterViaTracking,
          visibility: "public",
          title: "Update requested by the reporter",
          detail: "The reporter asked for a status update through their tracking link."
        }
      }),
      prisma.case.update({ where: { id: caseRecord.id }, data: { updatedAt: new Date() } })
    ]);

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return serverError("case.request_update_failed", error, "We couldn't send that request. Please try again.");
  }
}
