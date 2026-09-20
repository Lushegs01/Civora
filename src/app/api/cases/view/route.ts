import type { NextRequest } from "next/server";
import { z } from "zod";
import { findCaseByPublicId } from "@/lib/db/repository";
import { hashToken } from "@/lib/auth/tokens";
import { toPublicCaseView, toReporterCaseView } from "@/lib/dto/case";
import { caseIdSchema, trackingTokenSchema } from "@/lib/validation/schemas";
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

const schema = z.object({
  caseId: caseIdSchema,
  token: trackingTokenSchema.optional()
});

/**
 * Returns the view of a case appropriate to whoever is asking.
 *
 * The reporter view is only built when the supplied token hashes to a report
 * on that case. Without a valid token the caller gets the public view — and
 * only if the case is actually published, so a screened case cannot be read by
 * guessing its id.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.track,
    identity: clientIp(req),
    message: "Too many lookups from this connection. Please wait a moment."
  });
  if (limited) return limited;

  const body = await readJson(req, schema);
  if (!body.ok) return body.response;

  try {
    const record = await findCaseByPublicId(body.data.caseId);
    if (!record) return notFound();

    if (body.data.token) {
      const tokenHash = hashToken(body.data.token);
      const report = record.reports.find((r) => r.trackingTokenHash === tokenHash);
      if (report) {
        return NextResponse.json(
          { view: toReporterCaseView(record, report.id) },
          { headers: NO_STORE_HEADERS }
        );
      }
    }

    if (!record.publicVisible) return notFound();
    return NextResponse.json({ view: toPublicCaseView(record) }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return serverError("case.view_failed", error, "That case couldn't be loaded. Please try again.");
  }
}

/** One answer for "no such case" and "not yours", so ids stay unguessable. */
function notFound() {
  return fail("That case isn't available on this device.", { status: 404, code: "not_found" });
}
