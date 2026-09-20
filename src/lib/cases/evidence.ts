import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { evidenceStorageKey, requireStorage } from "../storage";
import { sanitizeFileName, validateUpload } from "../files/validate";
import { PUBLIC_EVIDENCE_LABEL } from "../privacy";
import { sha256 } from "../auth/tokens";
import { log } from "../log";

// Adding evidence to a case.
//
// Bytes go to private object storage; only metadata and a checksum go to the
// database. The evidence row and the stored object are written together so a
// failure cannot leave a row pointing at nothing (or an orphaned object the
// system has forgotten about).

export interface AddFileEvidenceInput {
  caseId: string;
  bytes: Uint8Array;
  declaredMimeType?: string;
  declaredFileName?: string;
  privacyMode: "anonymous" | "confidential" | "identified";
  relationship: string;
  /** Reporter uploads default to restricted: the reporter, not the crowd,
   *  decides what a photo of their street shows. */
  publicVisible?: boolean;
}

export type AddEvidenceResult =
  | { ok: true; evidenceId: string; kind: string }
  | { ok: false; reason: string; status: number };

export async function addFileEvidence(input: AddFileEvidenceInput): Promise<AddEvidenceResult> {
  const validation = validateUpload(input.bytes, input.declaredMimeType);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason, status: 400 };
  }

  let storage;
  try {
    storage = requireStorage();
  } catch {
    log.error("evidence.storage_unavailable");
    return {
      ok: false,
      reason: "Evidence uploads are temporarily unavailable. Your report has been recorded — please try attaching the file again shortly.",
      status: 503
    };
  }

  const detected = validation.file;
  const fileName = sanitizeFileName(input.declaredFileName, detected.extension);
  const checksum = sha256(input.bytes);
  const evidenceId = cuidish();
  const storageKey = evidenceStorageKey(evidenceId, detected.extension);

  await storage.put(storageKey, input.bytes, detected.mimeType);

  try {
    const created = await prisma.evidence.create({
      data: {
        caseId: input.caseId,
        kind: detected.kind,
        title: fileName.replace(/\.[a-z0-9]{1,8}$/i, "").slice(0, 80) || "Attached file",
        sourceType: "citizen",
        submittedByLabel: PUBLIC_EVIDENCE_LABEL[input.privacyMode],
        relationship: input.relationship,
        fileName,
        mimeType: detected.mimeType,
        sizeBytes: input.bytes.byteLength,
        checksum,
        storageKey,
        storageDriver: storage.name,
        publicVisible: input.publicVisible ?? false
      }
    });
    return { ok: true, evidenceId: created.id, kind: detected.kind };
  } catch (error) {
    // The row failed, so nothing references the object: remove it rather than
    // leaving a reporter's file in storage with no way to reach or delete it.
    await storage.delete(storageKey).catch(() => undefined);
    log.error("evidence.persist_failed", { error });
    return { ok: false, reason: "We couldn't attach that file. Please try again.", status: 500 };
  }
}

export interface AddNoteEvidenceInput {
  caseId: string;
  note: string;
  privacyMode: "anonymous" | "confidential" | "identified";
  relationship: string;
}

export async function addNoteEvidence(input: AddNoteEvidenceInput): Promise<{ evidenceId: string }> {
  const created = await prisma.evidence.create({
    data: {
      caseId: input.caseId,
      kind: "report",
      title: "Additional information from the reporter",
      sourceType: "citizen",
      submittedByLabel: PUBLIC_EVIDENCE_LABEL[input.privacyMode],
      relationship: input.relationship,
      excerpt: input.note,
      publicVisible: false
    }
  });
  return { evidenceId: created.id };
}

export function evidenceEventData(
  caseId: string,
  privacyMode: "anonymous" | "confidential" | "identified",
  title: string,
  detail?: string
): Prisma.CaseEventCreateInput {
  return {
    case: { connect: { id: caseId } },
    type: "EVIDENCE_ADDED",
    actorType: "reporter",
    // Fixed vocabulary — never a reporter's name.
    actorLabel: PUBLIC_EVIDENCE_LABEL[privacyMode],
    visibility: "public",
    title,
    detail
  };
}

function cuidish(): string {
  return `ev${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
