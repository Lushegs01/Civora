import type { NextRequest } from "next/server";
import {
  findCase,
  nextCaseId,
  rateLimit,
  readDb,
  sha256,
  uploadDir,
  writeDb
} from "@/lib/db/store";
import { reportSubmissionSchema } from "@/lib/validation/schemas";
import { fail, clientIp, extFor, kindFor, ok } from "@/lib/api-helpers";
import { hashToken, newTrackingToken } from "@/lib/auth/session";
import { put } from "@vercel/blob";
import { similarity, tokenOverlap } from "@/lib/utils";
import type { CaseEvent, CaseRecord, EvidenceRecord, ReportEntry } from "@/lib/types";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const URGENT_WORDS =
  /(fire|weapon|blood|injur|unconscious|attack|gas leak|live wire|electrocut|trapped|collapse)/i;

export async function POST(req: NextRequest) {
  if (!rateLimit(`report:${clientIp(req)}`)) {
    return fail("You've submitted several reports recently. Please try again a little later.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("We couldn't read your report. Please try submitting again.");
  }

  const parsed = reportSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(first?.message || "Some details in your report need attention. Please review and try again.");
  }
  const p = parsed.data;
  const now = new Date().toISOString();

  const db = await readDb();

  // ---- duplicate / corroboration matching (Rule: humans & rules confirm links)
  // Deterministic demo rule: same category + strong overlap in area or text.
  let match: CaseRecord | undefined;
  let best = 0;
  for (const c of db.cases) {
    if (c.response === "closed" || c.verification === "resolved") continue;
    if (c.category !== p.category) continue;
    const updatedAgo = Date.now() - +new Date(c.updatedAt);
    if (updatedAgo > 48 * 3600_000) continue;
    const locScore = tokenOverlap(p.locationGeneral || "", c.locationGeneral || "");
    const textScore = similarity(p.description, c.description);
    const score = Math.max(locScore, textScore);
    if (score > best) {
      best = score;
      match = c;
    }
  }
  const linked = match && best >= 0.34 ? match : undefined;

  // ---- persist evidence files
  const savedEvidence: EvidenceRecord[] = [];
  const submittedByLabel =
    p.privacyMode === "anonymous"
      ? "Citizen report (anonymous)"
      : p.privacyMode === "confidential"
        ? "Citizen report (confidential)"
        : p.contactName
          ? `Citizen report (${p.contactName})`
          : "Citizen report (identified)";

  const dir = uploadDir();
  const files: Array<{ rec: Omit<EvidenceRecord, "caseId" | "submittedAt">; data: Buffer }> = [];
  for (const f of p.evidence || []) {
    let buf: Buffer;
    try {
      buf = Buffer.from(f.dataBase64, "base64");
    } catch {
      return fail("One of the attached files could not be read. Please remove it and try again.");
    }
    if (buf.length === 0 || buf.length > 8 * 1024 * 1024) {
      return fail(`Attached file "${f.fileName}" is too large or empty. Maximum size is 8 MB per file.`);
    }
    const id = `ev-${crypto.randomBytes(6).toString("hex")}`;
    const storageKey = `${id}${extFor(f.mimeType, f.fileName)}`;
    files.push({
      data: buf,
      rec: {
        id,
        kind: kindFor(f.mimeType),
        title: f.fileName.replace(/\.[a-z0-9]{1,8}$/i, "").slice(0, 80) || "Attached file",
        sourceType: "citizen",
        submittedByLabel,
        relationship: "Supporting evidence attached to this report.",
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeBytes: buf.length,
        checksum: sha256(buf),
        storageKey,
        publicVisible: false
      }
    });
  }

  const token = newTrackingToken();

  if (linked) {
    // Corroborating report → strengthen the existing case.
    const entry: ReportEntry = {
      id: `r-${crypto.randomBytes(4).toString("hex")}`,
      at: now,
      role: "corroborating",
      privacyMode: p.privacyMode,
      trackingTokenHash: hashToken(token),
      areaNote: p.locationGeneral || undefined
    };
    linked.reports.push(entry);
    if (p.locationGeneral && !linked.locationGeneral) linked.locationGeneral = p.locationGeneral;
    const assignedToken = token;
    const previousVerification = linked.verification;
    if (previousVerification === "unverified") {
      linked.verification = "partially_verified";
    }
    linked.updatedAt = now;

    const evt = (e: Omit<CaseEvent, "id" | "caseId" | "at">) => {
      db.events.push({ id: `evt-${crypto.randomBytes(6).toString("hex")}`, at: now, caseId: linked.id, ...e });
    };
    evt({
      type: "CORROBORATION_RECEIVED",
      actor: "Matching rule + response desk",
      visibility: "public",
      title: "Independent corroborating report received",
      detail: "A new report was matched to this case by category, area and time window, and confirmed by the response desk."
    });
    if (previousVerification === "unverified") {
      evt({
        type: "VERIFICATION_UPDATED",
        actor: "Response desk",
        visibility: "public",
        title: "Verification set to Partially verified",
        detail: "Multiple consistent reports now refer to the same case."
      });
    }

    for (const f of files) {
      const storageKey = f.rec.storageKey!;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(`uploads/${storageKey}`, f.data, { access: 'public', addRandomSuffix: false });
    } else {
      fs.writeFileSync(path.join(dir, storageKey), f.data);
    }
      db.evidence.push({ ...f.rec, caseId: linked.id, submittedAt: now });
      db.events.push({
        id: `evt-${crypto.randomBytes(6).toString("hex")}`,
        at: now,
        caseId: linked.id,
        type: "EVIDENCE_ADDED",
        actor: submittedByLabel,
        visibility: "public",
        title: `Evidence added (${f.rec.kind})`,
        detail: f.rec.title
      });
    }
    await writeDb(db);
    return ok({
      linkedTo: linked.id,
      caseId: linked.id,
      token: assignedToken,
      message: "Your report was matched to an existing case and recorded as an independent corroborating report."
    });
  }

  // ---- new case
  const caseId = nextCaseId(db);
  const incidentAt = p.incidentAt || now;
  const priority = p.category === "safety" ? (URGENT_WORDS.test(p.description) ? "urgent" : "elevated") : "standard";

  const c: CaseRecord = {
    id: caseId,
    title: deriveTitle(p.category, p.description),
    description: p.description,
    category: p.category,
    locationGeneral: p.locationGeneral,
    coordinates: p.coordinates,
    incidentAt,
    privacyMode: p.privacyMode,
    verification: "unverified",
    response: "received",
    priority,
    createdAt: now,
    updatedAt: now,
    reporterContact: p.privacyMode === "identified" && p.contactName ? p.contactName : undefined,
    publicVisible: true,
    known: ["A single initial report has been received."],
    uncertain: [
      "No corroborating reports or supporting evidence exist yet.",
      "No organization has taken ownership of the case yet."
    ],
    reports: [
      {
        id: `r-${crypto.randomBytes(4).toString("hex")}`,
        at: now,
        role: "initial",
        privacyMode: p.privacyMode,
        trackingTokenHash: hashToken(token),
        areaNote: p.locationGeneral
      }
    ]
  };
  db.cases.push(c);

  db.events.push({
    id: `evt-${crypto.randomBytes(6).toString("hex")}`,
    at: now,
    caseId,
    type: "REPORT_SUBMITTED",
    actor: submittedByLabel,
    visibility: "public",
    title: "Case reported",
    detail: `Initial report received. Verification state: Unverified. Reporter privacy: ${p.privacyMode}.`
  });

  for (const f of files) {
    const storageKey = f.rec.storageKey!;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(`uploads/${storageKey}`, f.data, { access: 'public', addRandomSuffix: false });
    } else {
      fs.writeFileSync(path.join(dir, storageKey), f.data);
    }
    db.evidence.push({ ...f.rec, caseId, submittedAt: now });
    db.events.push({
      id: `evt-${crypto.randomBytes(6).toString("hex")}`,
      at: now,
      caseId,
      type: "EVIDENCE_ADDED",
      actor: submittedByLabel,
      visibility: "public",
      title: `Evidence added (${f.rec.kind})`,
      detail: f.rec.title
    });
  }

  await writeDb(db);
  return ok({ caseId, token, linkedTo: null });
}

function deriveTitle(category: string, description: string): string {
  const first = description.split(/[.!?]/)[0]?.trim() || "Community report";
  const words = first.split(/\s+/).slice(0, 9).join(" ");
  const cleaned = words.charAt(0).toUpperCase() + words.slice(1);
  return cleaned.length > 4 ? cleaned : "Community report";
}
