import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { addFileEvidence } from "@/lib/cases/evidence";
import { PUBLIC_EVIDENCE_LABEL } from "@/lib/privacy";
import { hashToken } from "@/lib/auth/tokens";
import { findReportByTokenHash } from "@/lib/db/repository";
import { caseIdSchema, evidenceNoteSchema, trackingTokenSchema } from "@/lib/validation/schemas";
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
import { uploads } from "@/lib/config";
import { log } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Attaches evidence to a case the caller can prove they reported.
 *
 * Two shapes:
 *   multipart/form-data — a file, streamed as binary, validated from its bytes
 *   application/json    — a short written note
 *
 * Authorization is always the tracking token, matched against the stored hash.
 * The caseId in the request is only ever used to confirm the token belongs to
 * the case the client thinks it does.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.evidenceUpload,
    identity: clientIp(req),
    message: "That's a lot of uploads in a short time. Please try again shortly."
  });
  if (limited) return limited;

  const contentType = req.headers.get("content-type") || "";
  return contentType.includes("multipart/form-data") ? handleFile(req) : handleNote(req);
}

async function handleNote(req: NextRequest) {
  const body = await readJson(req, evidenceNoteSchema);
  if (!body.ok) return body.response;
  const { caseId, token, note } = body.data;

  const authorized = await authorize(caseId, token);
  if (!authorized.ok) return authorized.response;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.evidence.create({
        data: {
          caseId: authorized.caseRecordId,
          kind: "report",
          title: "Additional information from the reporter",
          sourceType: "citizen",
          submittedByLabel: PUBLIC_EVIDENCE_LABEL[authorized.privacyMode],
          relationship: "Clarifying information added by the reporter.",
          excerpt: note,
          publicVisible: false
        }
      });
      await tx.caseEvent.create({
        data: {
          caseId: authorized.caseRecordId,
          type: "EVIDENCE_ADDED",
          actorType: "reporter",
          actorLabel: PUBLIC_EVIDENCE_LABEL[authorized.privacyMode],
          visibility: "public",
          title: "Additional information added",
          // The note itself stays restricted; the public timeline records that
          // something was added, not what it said.
          detail: "The reporter added further information to this case."
        }
      });
      await tx.case.update({ where: { id: authorized.caseRecordId }, data: { updatedAt: new Date() } });
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return serverError("evidence.note_failed", error, "We couldn't add that information. Please try again.");
  }
}

async function handleFile(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("We couldn't read that upload. Please try again.");
  }

  const caseIdRaw = form.get("caseId");
  const tokenRaw = form.get("token");
  const file = form.get("file");

  const caseIdParsed = caseIdSchema.safeParse(typeof caseIdRaw === "string" ? caseIdRaw : "");
  const tokenParsed = trackingTokenSchema.safeParse(typeof tokenRaw === "string" ? tokenRaw : "");
  if (!caseIdParsed.success || !tokenParsed.success) {
    return fail("This case couldn't be verified for your device.", { status: 403, code: "not_authorized" });
  }
  if (!(file instanceof File)) {
    return fail("No file was attached.");
  }
  if (file.size > uploads.maxBytes) {
    return fail(`Files must be ${Math.round(uploads.maxBytes / (1024 * 1024))} MB or smaller.`, {
      status: 413,
      code: "payload_too_large"
    });
  }

  const authorized = await authorize(caseIdParsed.data, tokenParsed.data);
  if (!authorized.ok) return authorized.response;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await addFileEvidence({
    caseId: authorized.caseRecordId,
    bytes,
    declaredMimeType: file.type,
    declaredFileName: file.name,
    privacyMode: authorized.privacyMode,
    relationship: "Supporting evidence attached by the reporter.",
    // Reporter uploads are restricted by default. A handler decides whether a
    // photo is safe to publish.
    publicVisible: false
  });

  if (!result.ok) {
    return fail(result.reason, { status: result.status });
  }

  try {
    await prisma.$transaction([
      prisma.caseEvent.create({
        data: {
          caseId: authorized.caseRecordId,
          type: "EVIDENCE_ADDED",
          actorType: "reporter",
          actorLabel: PUBLIC_EVIDENCE_LABEL[authorized.privacyMode],
          visibility: "public",
          title: `Evidence added (${result.kind})`,
          // Filenames can identify a person or a place; the public record
          // notes the kind, not the name.
          detail: "A supporting file was added to this case."
        }
      }),
      prisma.case.update({ where: { id: authorized.caseRecordId }, data: { updatedAt: new Date() } })
    ]);
  } catch (error) {
    log.error("evidence.event_failed", { error });
  }

  return NextResponse.json({ ok: true, evidenceId: result.evidenceId }, { headers: NO_STORE_HEADERS });
}

type Authorization =
  | { ok: true; caseRecordId: string; privacyMode: "anonymous" | "confidential" | "identified" }
  | { ok: false; response: ReturnType<typeof fail> };

/**
 * Resolves the token to its report, then checks the case matches.
 *
 * Both failure modes return the same message, so the endpoint cannot be used
 * to learn whether a case id exists.
 */
async function authorize(caseId: string, token: string): Promise<Authorization> {
  const denied = fail("This case couldn't be verified for your device. Please check the case ID and tracking link.", {
    status: 403,
    code: "not_authorized"
  });

  const report = await findReportByTokenHash(hashToken(token));
  if (!report || report.case.publicCaseId !== caseId) {
    return { ok: false, response: denied };
  }
  const caseRecord = await prisma.case.findUnique({
    where: { id: report.caseId },
    select: { id: true, privacyMode: true, response: true }
  });
  if (!caseRecord) return { ok: false, response: denied };
  if (caseRecord.response === "closed") {
    return {
      ok: false,
      response: fail("This case is closed, so new evidence can no longer be added.", { status: 409 })
    };
  }
  return { ok: true, caseRecordId: caseRecord.id, privacyMode: caseRecord.privacyMode };
}

