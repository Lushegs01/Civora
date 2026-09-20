import type { NextRequest } from "next/server";
import { createReport } from "@/lib/cases/create";
import { reportSubmissionSchema } from "@/lib/validation/schemas";
import {
  clientIp,
  enforceRateLimit,
  fail,
  NO_STORE_HEADERS,
  ok,
  readJson,
  requireSameOrigin,
  serverError
} from "@/lib/api/respond";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { pseudonymize } from "@/lib/auth/tokens";
import { sessionSecret, uploads } from "@/lib/config";
import { storageDriver } from "@/lib/storage";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Creates a case from a citizen report.
 *
 * The body is JSON metadata only — evidence files are uploaded separately as
 * binary to /api/evidence, so a report with six photos is six bounded requests
 * rather than one 60 MB base64 blob that a low-bandwidth connection will drop.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.reportCreate,
    identity: clientIp(req),
    message: "You've submitted several reports recently. Please try again a little later."
  });
  if (limited) return limited;

  const body = await readJson(req, reportSubmissionSchema);
  if (!body.ok) return body.response;
  const input = body.data;

  // Anonymous means anonymous: contact details are discarded before they
  // reach the database, whatever the client sent.
  const contact = input.privacyMode === "anonymous" ? undefined : input.contact;

  const incidentAt = input.incidentAt ? new Date(input.incidentAt) : new Date();
  if (Number.isNaN(incidentAt.getTime()) || incidentAt.getTime() > Date.now() + 60_000) {
    return fail("The time of the incident can't be in the future.");
  }

  try {
    const result = await createReport({
      category: input.category,
      narrative: input.description,
      locationGeneral: input.locationGeneral,
      coordinates: input.coordinates,
      incidentAt,
      privacyMode: input.privacyMode,
      contact,
      withRecoveryCode: input.withRecoveryCode,
      // Salted hash, so abuse can be correlated without retaining an IP.
      submitterHash: pseudonymize(clientIp(req), sessionSecret())
    });

    const uploadsAvailable = Boolean(storageDriver());

    return NextResponse.json(
      {
        caseId: result.caseId,
        // Returned once. The client stores it on the device; the server only
        // ever holds its hash.
        token: result.trackingToken,
        recoveryCode: result.recoveryCode,
        publicVisible: result.publicVisible,
        publicationState: result.publicationState,
        // Possible corroboration, explicitly not a confirmed relationship.
        possibleMatches: result.possibleMatches,
        evidenceUpload: {
          available: uploadsAvailable,
          endpoint: "/api/evidence",
          maxBytes: uploads.maxBytes,
          maxFiles: uploads.maxPerReport
        }
      },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return serverError("report.create_failed", error, "We couldn't record your report. Please try again.");
  }
}

export async function GET() {
  return ok({ error: "Method not allowed" }, 405);
}
