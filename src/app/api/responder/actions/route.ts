import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requestActor } from "@/lib/auth/actor";
import { canAssignToOrg, canActOnCase, canChangePublication, canDecideCaseLink } from "@/lib/authz";
import { responderActionSchema } from "@/lib/validation/schemas";
import { canClose, canTransitionResponse, canTransitionVerification, verificationAfterClosure, VERIFICATION_LABEL } from "@/lib/case-state";
import { publicVisibleFor, PUBLICATION_LABEL } from "@/lib/publication";
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
import { log } from "@/lib/log";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Tx = Prisma.TransactionClient;

/** A refusal the responder should see, as opposed to a server fault. */
class ActionError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * Every responder action.
 *
 * Three invariants hold for all of them:
 *   1. Authorization is re-derived from the session and the case's assignment;
 *      nothing is read from the request except which case and which action.
 *   2. State changes go through the transition rules in case-state.ts.
 *   3. Each action writes one audit event naming the person who acted, inside
 *      the same transaction as the change itself.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const actor = await requestActor();
  if (!actor) {
    return fail("Your session has expired. Please sign in to the workspace again.", {
      status: 401,
      code: "session_expired"
    });
  }

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.responderAction,
    identity: `${actor.userId}:${clientIp(req)}`,
    message: "Too many actions in a short time. Please slow down."
  });
  if (limited) return limited;

  const body = await readJson(req, responderActionSchema);
  if (!body.ok) return body.response;
  const input = body.data;

  const caseRecord = await prisma.case.findUnique({
    where: { publicCaseId: input.caseId },
    select: {
      id: true,
      publicCaseId: true,
      assignedOrgId: true,
      response: true,
      verification: true,
      preClosureVerification: true,
      publicationState: true,
      publicSummary: true,
      awaitingReporter: true
    }
  });
  if (!caseRecord) {
    return fail("That case could not be found.", { status: 404 });
  }

  const scope = { assignedOrgId: caseRecord.assignedOrgId };
  if (!canActOnCase(actor, scope)) {
    log.warn("responder.action_denied", {
      userId: actor.userId,
      caseId: caseRecord.publicCaseId,
      action: input.action
    });
    return fail("This case belongs to another organization's queue.", { status: 403, code: "forbidden" });
  }

  // Display name of the person acting — attributable, and safe to publish
  // because it is a professional identity the organization chose.
  const actorLabel = actor.displayName;
  const orgId = actor.orgId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      switch (input.action) {
        case "acknowledge":
          return acknowledge(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "assign":
          return assign(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "start_progress":
          return startProgress(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "record_action":
          return recordAction(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "request_info":
          return requestInfo(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "add_update":
          return addUpdateAction(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "set_verification":
          return setVerification(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "close":
          return closeCase(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "reopen":
          return reopenCase(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "add_note":
          return addNote(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "set_publication":
          return setPublication(tx, caseRecord, { actor, actorLabel, orgId, input });
        case "confirm_link":
        case "reject_link":
          return decideLink(tx, caseRecord, { actor, actorLabel, orgId, input });
        default:
          throw new ActionError("Unknown action.");
      }
    });

    log.info("responder.action", {
      userId: actor.userId,
      role: actor.role,
      caseId: caseRecord.publicCaseId,
      action: input.action
    });
    return NextResponse.json({ ok: true, caseId: caseRecord.publicCaseId, ...result }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof ActionError) {
      return fail(error.message, { status: error.status });
    }
    return serverError("responder.action_failed", error, "That action could not be completed.");
  }
}

// ---------------------------------------------------------------- actions

interface Ctx {
  actor: NonNullable<Awaited<ReturnType<typeof requestActor>>>;
  actorLabel: string;
  orgId: string | null;
  input: Awaited<ReturnType<typeof responderActionSchema.parse>>;
}

type CaseRow = {
  id: string;
  publicCaseId: string;
  assignedOrgId: string | null;
  response: Prisma.CaseGetPayload<object>["response"];
  verification: Prisma.CaseGetPayload<object>["verification"];
  publicationState: Prisma.CaseGetPayload<object>["publicationState"];
  publicSummary: string;
  awaitingReporter: boolean;
  preClosureVerification: Prisma.CaseGetPayload<object>["verification"] | null;
};

function requireNote(ctx: Ctx, minLength = 10): string {
  const note = ctx.input.note?.trim();
  if (!note || note.length < minLength) {
    throw new ActionError(`Record what happened in at least ${minLength} characters — it becomes part of the case record.`);
  }
  return note;
}

async function touch(tx: Tx, caseId: string, data: Prisma.CaseUpdateInput) {
  await tx.case.update({ where: { id: caseId }, data: { ...data, updatedAt: new Date() } });
}

async function event(
  tx: Tx,
  caseId: string,
  ctx: Ctx,
  data: {
    type: Prisma.CaseEventCreateManyInput["type"];
    visibility: "public" | "restricted";
    title: string;
    detail?: string;
    actorType?: "responder" | "organization" | "system";
  }
) {
  await tx.caseEvent.create({
    data: {
      caseId,
      type: data.type,
      actorType: data.actorType ?? "responder",
      actorId: ctx.actor.userId,
      actorLabel: ctx.actorLabel,
      organizationId: ctx.orgId,
      visibility: data.visibility,
      title: data.title,
      detail: data.detail
    }
  });
}

/** Writes a public update and its timeline entry together. */
async function publishUpdate(tx: Tx, caseId: string, ctx: Ctx, bodyText: string, orgName?: string | null) {
  await tx.caseUpdate.create({
    data: {
      caseId,
      authorLabel: orgName || ctx.actorLabel,
      authorId: ctx.actor.userId,
      organizationId: ctx.orgId,
      body: bodyText
    }
  });
  await event(tx, caseId, ctx, {
    type: "PUBLIC_UPDATE_ADDED",
    visibility: "public",
    title: "Official update added"
  });
}

async function orgNameFor(tx: Tx, orgId: string | null): Promise<string | null> {
  if (!orgId) return null;
  const org = await tx.organization.findUnique({ where: { id: orgId }, select: { name: true } });
  return org?.name ?? null;
}

async function acknowledge(tx: Tx, c: CaseRow, ctx: Ctx) {
  const transition = canTransitionResponse(c.response, "acknowledged");
  if (!transition.ok) throw new ActionError(transition.reason);

  const orgName = await orgNameFor(tx, c.assignedOrgId);
  await touch(tx, c.id, {
    response: "acknowledged",
    nextUpdateAt: new Date(Date.now() + 3 * 3_600_000)
  });
  await event(tx, c.id, ctx, {
    type: "CASE_ACKNOWLEDGED",
    visibility: "public",
    title: "Case acknowledged",
    detail: ctx.input.note?.trim() || "Receipt of this report has been acknowledged."
  });
  if (ctx.input.publicUpdate?.trim()) {
    await publishUpdate(tx, c.id, ctx, ctx.input.publicUpdate.trim(), orgName);
  }
  return { response: "acknowledged" };
}

async function assign(tx: Tx, c: CaseRow, ctx: Ctx) {
  const targetOrgId = ctx.input.orgId ?? null;
  if (!canAssignToOrg(ctx.actor, { assignedOrgId: c.assignedOrgId }, targetOrgId)) {
    throw new ActionError("You can only route cases to your own organization.", 403);
  }

  let orgName: string | null = null;
  if (targetOrgId) {
    const org = await tx.organization.findFirst({
      where: { id: targetOrgId, active: true },
      select: { id: true, name: true }
    });
    if (!org) throw new ActionError("Choose an organization to assign this case to.");
    orgName = org.name;
  }

  await tx.caseAssignment.updateMany({
    where: { caseId: c.id, active: true },
    data: { active: false, unassignedAt: new Date() }
  });
  if (targetOrgId) {
    await tx.caseAssignment.create({
      data: { caseId: c.id, orgId: targetOrgId, assignedById: ctx.actor.userId, active: true }
    });
  }
  await touch(tx, c.id, {
    assignedOrg: targetOrgId ? { connect: { id: targetOrgId } } : { disconnect: true },
    response: c.response === "not_assigned" && targetOrgId ? "received" : c.response
  });
  await event(tx, c.id, ctx, {
    type: "CASE_ASSIGNED",
    visibility: "public",
    title: targetOrgId ? `Assigned to ${orgName}` : "Returned to the unassigned queue",
    detail: ctx.input.note?.trim() || undefined
  });
  return { assignedOrgId: targetOrgId };
}

async function startProgress(tx: Tx, c: CaseRow, ctx: Ctx) {
  const transition = canTransitionResponse(c.response, "in_progress");
  if (!transition.ok) throw new ActionError(transition.reason);
  if (!c.assignedOrgId) {
    throw new ActionError("Assign this case to an organization before marking it in progress.");
  }

  const orgName = await orgNameFor(tx, c.assignedOrgId);
  await touch(tx, c.id, {
    response: "in_progress",
    nextUpdateAt: new Date(Date.now() + 4 * 3_600_000)
  });
  await event(tx, c.id, ctx, {
    type: "RESPONSE_IN_PROGRESS",
    visibility: "public",
    title: "Response marked in progress",
    detail: ctx.input.note?.trim() || undefined
  });
  if (ctx.input.publicUpdate?.trim()) {
    await publishUpdate(tx, c.id, ctx, ctx.input.publicUpdate.trim(), orgName);
  }
  return { response: "in_progress" };
}

async function recordAction(tx: Tx, c: CaseRow, ctx: Ctx) {
  const note = requireNote(ctx);
  const transition = canTransitionResponse(c.response, "action_recorded");
  if (!transition.ok) throw new ActionError(transition.reason);

  const orgName = await orgNameFor(tx, c.assignedOrgId);
  await touch(tx, c.id, {
    response: "action_recorded",
    nextUpdateAt: new Date(Date.now() + 2 * 3_600_000)
  });
  await event(tx, c.id, ctx, {
    type: "ACTION_RECORDED",
    visibility: "public",
    title: "Action recorded",
    detail: note
  });
  if (ctx.input.publicUpdate?.trim()) {
    await publishUpdate(tx, c.id, ctx, ctx.input.publicUpdate.trim(), orgName);
  }
  return { response: "action_recorded" };
}

async function requestInfo(tx: Tx, c: CaseRow, ctx: Ctx) {
  const message = ctx.input.publicUpdate?.trim() || ctx.input.note?.trim();
  if (!message || message.length < 10) {
    throw new ActionError("Write the question you want to ask the reporter — they see this text.");
  }
  const orgName = await orgNameFor(tx, c.assignedOrgId);

  await tx.infoRequest.create({
    data: {
      caseId: c.id,
      requestedById: ctx.actor.userId,
      requestedByLabel: orgName || ctx.actorLabel,
      message,
      status: "open"
    }
  });
  await touch(tx, c.id, { awaitingReporter: true });
  await event(tx, c.id, ctx, {
    type: "INFO_REQUESTED",
    visibility: "public",
    title: "Additional information requested",
    detail: "The responding organization asked the reporter for more detail."
  });
  return { awaitingReporter: true };
}

async function addUpdateAction(tx: Tx, c: CaseRow, ctx: Ctx) {
  const update = ctx.input.publicUpdate?.trim();
  if (!update || update.length < 10) {
    throw new ActionError("Write the public update before posting it.");
  }
  const orgName = await orgNameFor(tx, c.assignedOrgId);
  await publishUpdate(tx, c.id, ctx, update, orgName);
  await touch(tx, c.id, {});
  return { updated: true };
}

async function setVerification(tx: Tx, c: CaseRow, ctx: Ctx) {
  if (!ctx.input.verification) throw new ActionError("Choose the new verification state.");
  const reason = ctx.input.note?.trim();
  const transition = canTransitionVerification(c.verification, ctx.input.verification, reason);
  if (!transition.ok) throw new ActionError(transition.reason);

  await touch(tx, c.id, {
    verification: ctx.input.verification,
    verificationReason: reason
  });
  await event(tx, c.id, ctx, {
    type: "VERIFICATION_UPDATED",
    visibility: "public",
    title: `Verification set to ${VERIFICATION_LABEL[ctx.input.verification]}`,
    detail: reason
  });
  return { verification: ctx.input.verification };
}

async function closeCase(tx: Tx, c: CaseRow, ctx: Ctx) {
  const note = requireNote(ctx);
  const outcome = ctx.input.publicUpdate?.trim();
  const hasRecordedAction =
    c.response === "action_recorded" ||
    (await tx.caseEvent.count({ where: { caseId: c.id, type: "ACTION_RECORDED" } })) > 0;

  const check = canClose(c.response, {
    hasRecordedAction,
    hasOutcomeUpdate: Boolean(outcome && outcome.length >= 10)
  });
  if (!check.ok) throw new ActionError(check.reason);

  const orgName = await orgNameFor(tx, c.assignedOrgId);
  const now = new Date();
  // Closing documents the response. It only moves verification to "resolved"
  // when the claim itself was already established — a case closed while still
  // unverified stays unverified.
  const nextVerification = verificationAfterClosure(c.verification);

  await touch(tx, c.id, {
    response: "closed",
    verification: nextVerification,
    // Remember what was actually established, so reopening restores it rather
    // than guessing at a state nobody recorded.
    preClosureVerification: c.verification,
    closedAt: now,
    resolvedAt: nextVerification === "resolved" ? now : null,
    nextUpdateAt: null,
    awaitingReporter: false
  });
  await tx.infoRequest.updateMany({
    where: { caseId: c.id, status: "open" },
    data: { status: "cancelled" }
  });
  await event(tx, c.id, ctx, {
    type: "CASE_CLOSED",
    visibility: "public",
    title: "Case closed",
    detail: note
  });
  if (nextVerification !== c.verification) {
    await event(tx, c.id, ctx, {
      type: "VERIFICATION_UPDATED",
      visibility: "public",
      title: `Verification set to ${VERIFICATION_LABEL[nextVerification]}`,
      detail: "The case was closed with a documented outcome."
    });
  }
  await publishUpdate(tx, c.id, ctx, outcome!, orgName);
  return { response: "closed", verification: nextVerification };
}

async function reopenCase(tx: Tx, c: CaseRow, ctx: Ctx) {
  const note = requireNote(ctx);
  const transition = canTransitionResponse(c.response, "in_progress");
  if (!transition.ok) throw new ActionError(transition.reason);

  // Reopening withdraws the "resolved" claim and restores the verification the
  // case genuinely held before it was closed. It never invents a stronger one.
  const restored =
    c.verification === "resolved" ? c.preClosureVerification ?? "partially_verified" : c.verification;

  await touch(tx, c.id, {
    response: "in_progress",
    closedAt: null,
    verification: restored,
    preClosureVerification: null,
    resolvedAt: null
  });
  await event(tx, c.id, ctx, {
    type: "RESPONSE_IN_PROGRESS",
    visibility: "public",
    title: "Case reopened",
    detail: note
  });
  return { response: "in_progress" };
}

async function addNote(tx: Tx, c: CaseRow, ctx: Ctx) {
  const note = requireNote(ctx, 3);
  await tx.internalNote.create({
    data: { caseId: c.id, authorId: ctx.actor.userId, authorLabel: ctx.actorLabel, body: note }
  });
  // No public event: an internal note must not announce itself on the public
  // timeline, and its text never leaves the responder view.
  return { noted: true };
}

async function setPublication(tx: Tx, c: CaseRow, ctx: Ctx) {
  if (!ctx.input.publicationState) throw new ActionError("Choose a publication state.");
  if (!canChangePublication(ctx.actor, { assignedOrgId: c.assignedOrgId })) {
    throw new ActionError("You aren't authorized to change publication for this case.", 403);
  }
  const target = ctx.input.publicationState;
  const summary = ctx.input.publicSummary?.trim();

  if (target === "public_case") {
    // Publishing requires text written for publication. The raw report is
    // never what goes on the board.
    const finalSummary = summary || c.publicSummary;
    if (!finalSummary || finalSummary.length < 20) {
      throw new ActionError("Write a public summary before publishing this case.");
    }
    await touch(tx, c.id, {
      publicationState: target,
      publicVisible: true,
      publicSummary: finalSummary
    });
  } else {
    await touch(tx, c.id, {
      publicationState: target,
      publicVisible: publicVisibleFor(target),
      ...(summary ? { publicSummary: summary } : {})
    });
  }

  await event(tx, c.id, ctx, {
    type: "PUBLICATION_CHANGED",
    visibility: target === "public_case" ? "public" : "restricted",
    title: `Publication set to ${PUBLICATION_LABEL[target]}`,
    detail: ctx.input.note?.trim() || undefined
  });
  return { publicationState: target, publicVisible: publicVisibleFor(target) };
}

async function decideLink(tx: Tx, c: CaseRow, ctx: Ctx) {
  if (!ctx.input.linkId) throw new ActionError("Choose which proposed link to decide.");
  if (!canDecideCaseLink(ctx.actor, { assignedOrgId: c.assignedOrgId })) {
    throw new ActionError("You aren't authorized to decide links on this case.", 403);
  }

  const link = await tx.caseLink.findFirst({
    where: {
      id: ctx.input.linkId,
      status: "proposed",
      OR: [{ sourceCaseId: c.id }, { targetCaseId: c.id }]
    },
    include: {
      sourceCase: { select: { id: true, publicCaseId: true } },
      targetCase: { select: { id: true, publicCaseId: true } }
    }
  });
  if (!link) throw new ActionError("That proposed link is no longer open for a decision.");

  const confirm = ctx.input.action === "confirm_link";
  const note = ctx.input.note?.trim();
  if (!note || note.length < 10) {
    throw new ActionError("Record why you are confirming or rejecting this link.");
  }

  await tx.caseLink.update({
    where: { id: link.id },
    data: {
      status: confirm ? "confirmed" : "rejected",
      decidedById: ctx.actor.userId,
      decidedAt: new Date(),
      decisionNote: note
    }
  });

  // Both cases get the event: corroboration is a relationship, not a property
  // of one side.
  for (const target of [link.sourceCase, link.targetCase]) {
    const other = target.id === link.sourceCase.id ? link.targetCase : link.sourceCase;
    await event(tx, target.id, ctx, {
      type: confirm ? "CORROBORATION_CONFIRMED" : "CORROBORATION_REJECTED",
      visibility: confirm ? "public" : "restricted",
      title: confirm ? "Corroborating report confirmed" : "Proposed link rejected",
      detail: confirm
        ? `A case handler confirmed that ${other.publicCaseId} describes the same incident. Confirming a link does not by itself change the verification state.`
        : `A case handler reviewed the possible link to ${other.publicCaseId} and rejected it.`
    });
    await tx.case.update({ where: { id: target.id }, data: { updatedAt: new Date() } });
  }

  return { linkStatus: confirm ? "confirmed" : "rejected" };
}

