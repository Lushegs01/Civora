import type { NextRequest } from "next/server";
import crypto from "crypto";
import { findCase, readDb, writeDb } from "@/lib/db/store";
import { requestUpdateSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api-helpers";
import { tokenMatches } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("We couldn't read your request. Please try again.");
  }
  const parsed = requestUpdateSchema.safeParse(body);
  if (!parsed.success) return fail("The request details need attention. Please try again.");

  const { caseId, token } = parsed.data;
  const db = readDb();
  const c = findCase(db, caseId);
  if (!c || !tokenMatches(c.trackingTokenHash, token)) {
    return fail("This case couldn't be verified for your device.", 403);
  }
  if (c.response === "closed") {
    return fail("This case is closed, so an update can no longer be requested.");
  }

  const now = new Date().toISOString();
  if (!c.awaitingReporter) {
    c.awaitingReporter = true;
    c.updatedAt = now;
    db.events.push({
      id: `evt-${crypto.randomBytes(6).toString("hex")}`,
      at: now,
      caseId: c.id,
      type: "UPDATE_REQUESTED",
      actor: "Reporter (via tracking link)",
      visibility: "public",
      title: "Update requested by the reporter",
      detail: "The reporter asked for a status update through their secure tracking link."
    });
    writeDb(db);
  }
  return ok({ ok: true });
}
