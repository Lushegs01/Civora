import type { NextRequest } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { findCase, orgName, readDb, writeDb } from "@/lib/db/store";
import { responderActionSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api-helpers";
import { isResponder } from "@/lib/auth/session";
import { VERIFICATION_META } from "@/lib/states";
import type { CaseUpdate, InternalNote, VerificationState } from "@/lib/types";

export const dynamic = "force-dynamic";

const ACTOR = "Response desk";

function evt(dbEvents: Awaited<ReturnType<typeof readDb>>["events"], caseId: string, e: Omit<import("@/lib/types").CaseEvent, "id" | "caseId" | "at">) {
  dbEvents.push({
    id: `evt-${crypto.randomBytes(6).toString("hex")}`,
    at: new Date().toISOString(),
    caseId,
    ...e
  });
}

export async function POST(req: NextRequest) {
  const store = cookies();
  if (!isResponder(store)) {
    return fail("Responder session expired. Please sign in to the workspace again.", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("We couldn't read that action. Please try again.");
  }
  const parsed = responderActionSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "The action details need attention.");
  }
  const { caseId, action, note, publicUpdate, orgId, verification } = parsed.data;

  const db = await readDb();
  const c = findCase(db, caseId);
  if (!c) return fail("That case could not be found.", 404);

  const now = new Date().toISOString();
  const addPublicUpdate = (bodyText: string) => {
    const u: CaseUpdate = {
      id: `u-${crypto.randomBytes(5).toString("hex")}`,
      caseId: c.id,
      at: now,
      authorLabel: orgName(db, c.assignedOrgId) || ACTOR,
      body: bodyText
    };
    db.updates.push(u);
    evt(db.events, c.id, {
      type: "PUBLIC_UPDATE_ADDED",
      actor: u.authorLabel,
      visibility: "public",
      title: "Official update added"
    });
  };

  const requireNote = () => {
    if (!note) throw new Error("A short description is required for this action.");
  };

  try {
    switch (action) {
      case "acknowledge": {
        if (c.response === "closed") throw new Error("This case is already closed.");
        c.response = "acknowledged";
        if (!c.nextUpdateAt) c.nextUpdateAt = new Date(Date.now() + 3 * 3600_000).toISOString();
        evt(db.events, c.id, {
          type: "CASE_ACKNOWLEDGED",
          actor: orgName(db, c.assignedOrgId) || ACTOR,
          visibility: "public",
          title: "Case acknowledged",
          detail: note || "Receipt of this report has been acknowledged."
        });
        if (publicUpdate) addPublicUpdate(publicUpdate);
        break;
      }
      case "assign": {
        const org = db.orgs.find((o) => o.id === orgId);
        if (!org) throw new Error("Choose an organization to assign this case to.");
        c.assignedOrgId = org.id;
        if (c.response === "not_assigned") c.response = "received";
        evt(db.events, c.id, {
          type: "CASE_ASSIGNED",
          actor: ACTOR,
          visibility: "public",
          title: `Assigned to ${org.name}`,
          detail: note || undefined
        });
        break;
      }
      case "start_progress": {
        if (c.response === "closed") throw new Error("This case is already closed.");
        c.response = "in_progress";
        if (!c.nextUpdateAt) c.nextUpdateAt = new Date(Date.now() + 4 * 3600_000).toISOString();
        evt(db.events, c.id, {
          type: "RESPONSE_IN_PROGRESS",
          actor: orgName(db, c.assignedOrgId) || ACTOR,
          visibility: "public",
          title: "Response marked in progress",
          detail: note || undefined
        });
        if (publicUpdate) addPublicUpdate(publicUpdate);
        break;
      }
      case "record_action": {
        requireNote();
        if (c.response === "closed") throw new Error("This case is already closed.");
        c.response = "action_recorded";
        c.nextUpdateAt = new Date(Date.now() + 2 * 3600_000).toISOString();
        evt(db.events, c.id, {
          type: "ACTION_RECORDED",
          actor: orgName(db, c.assignedOrgId) || ACTOR,
          visibility: "public",
          title: "Action recorded",
          detail: note
        });
        if (publicUpdate) addPublicUpdate(publicUpdate);
        break;
      }
      case "request_info": {
        c.awaitingReporter = true;
        evt(db.events, c.id, {
          type: "INFO_REQUESTED",
          actor: orgName(db, c.assignedOrgId) || ACTOR,
          visibility: "public",
          title: "Additional information requested",
          detail: note || "The responding organization requested additional details from the reporter."
        });
        break;
      }
      case "add_update": {
        if (!publicUpdate) throw new Error("Write the public update before posting it.");
        c.awaitingReporter = false;
        addPublicUpdate(publicUpdate);
        break;
      }
      case "set_verification": {
        requireNote();
        if (!verification) throw new Error("Choose the new verification state.");
        c.verification = verification as VerificationState;
        evt(db.events, c.id, {
          type: "VERIFICATION_UPDATED",
          actor: ACTOR,
          visibility: "public",
          title: `Verification set to ${VERIFICATION_META[c.verification].label}`,
          detail: note
        });
        break;
      }
      case "close": {
        requireNote();
        if (!publicUpdate) {
          throw new Error("A public update documenting the resolution is required to close a case.");
        }
        c.response = "closed";
        c.verification = "resolved";
        c.resolvedAt = now;
        c.nextUpdateAt = undefined;
        c.awaitingReporter = false;
        evt(db.events, c.id, {
          type: "CASE_CLOSED",
          actor: orgName(db, c.assignedOrgId) || ACTOR,
          visibility: "public",
          title: "Case closed",
          detail: note
        });
        addPublicUpdate(publicUpdate);
        break;
      }
      case "add_note": {
        requireNote();
        const n: InternalNote = {
          id: `n-${crypto.randomBytes(5).toString("hex")}`,
          caseId: c.id,
          at: now,
          authorLabel: ACTOR,
          body: note as string
        };
        db.notes.push(n);
        break;
      }
      default:
        return fail("Unknown action.");
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "That action could not be completed.");
  }

  c.updatedAt = now;
  await writeDb(db);
  return ok({ ok: true, caseId: c.id });
}
