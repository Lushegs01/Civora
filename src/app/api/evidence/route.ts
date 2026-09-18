import type { NextRequest } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  findCase,
  readDb,
  sha256,
  uploadDir,
  writeDb
} from "@/lib/db/store";
import { addEvidenceSchema } from "@/lib/validation/schemas";
import { fail, extFor, kindFor, ok } from "@/lib/api-helpers";
import { isAuthorizedReporter } from "@/lib/auth/session";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("We couldn't read your submission. Please try again.");
  }
  const parsed = addEvidenceSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "The evidence details need attention. Please review and try again.");
  }
  const { caseId, token, note, file } = parsed.data;

  const db = await readDb();
  const c = findCase(db, caseId);
  if (!c || !isAuthorizedReporter(c, token)) {
    return fail("This case couldn't be verified for your device. Please check the case ID and tracking link.", 403);
  }

  const now = new Date().toISOString();
  const submittedByLabel =
    c.privacyMode === "anonymous"
      ? "Reporter (anonymous)"
      : c.privacyMode === "confidential"
        ? "Reporter (confidential)"
        : "Reporter (identified)";

  if (file) {
    let buf: Buffer;
    try {
      buf = Buffer.from(file.dataBase64, "base64");
    } catch {
      return fail("The attached file could not be read. Please remove it and try again.");
    }
    if (buf.length === 0 || buf.length > 8 * 1024 * 1024) {
      return fail("The attached file is too large or empty. Maximum size is 8 MB per file.");
    }
    const id = `ev-${crypto.randomBytes(6).toString("hex")}`;
    const storageKey = `${id}${extFor(file.mimeType, file.fileName)}`;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(`uploads/${storageKey}`, buf, { access: 'public', addRandomSuffix: false });
    } else {
      fs.writeFileSync(path.join(uploadDir(), storageKey), buf);
    }
    db.evidence.push({
      id,
      caseId: c.id,
      kind: kindFor(file.mimeType),
      title: (file.fileName.replace(/\.[a-z0-9]{1,8}$/i, "") || "Additional evidence").slice(0, 80),
      sourceType: "citizen",
      submittedByLabel,
      relationship: "Additional evidence added by the reporter after submission.",
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: buf.length,
      checksum: sha256(buf),
      storageKey,
      publicVisible: false,
      submittedAt: now
    });
    db.events.push({
      id: `evt-${crypto.randomBytes(6).toString("hex")}`,
      at: now,
      caseId: c.id,
      type: "EVIDENCE_ADDED",
      actor: submittedByLabel,
      visibility: "public",
      title: `Evidence added (${kindFor(file.mimeType)})`,
      detail: file.fileName
    });
  }

  if (note) {
    db.evidence.push({
      id: `ev-${crypto.randomBytes(6).toString("hex")}`,
      caseId: c.id,
      kind: "report",
      title: "Additional information from the reporter",
      sourceType: "citizen",
      submittedByLabel,
      relationship: "Clarifying information added by the reporter.",
      excerpt: note,
      publicVisible: false,
      submittedAt: now
    });
    db.events.push({
      id: `evt-${crypto.randomBytes(6).toString("hex")}`,
      at: now,
      caseId: c.id,
      type: "EVIDENCE_ADDED",
      actor: submittedByLabel,
      visibility: "public",
      title: "Additional information added",
      detail: note.slice(0, 120)
    });
  }

  c.updatedAt = now;
  await writeDb(db);
  return ok({ ok: true });
}
