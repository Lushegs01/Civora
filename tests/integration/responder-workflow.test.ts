import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createOrg, createUser, prisma, resetDatabase } from "../helpers/db";
import { createReport } from "@/lib/cases/create";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { POST as responderAction } from "@/app/api/responder/actions/route";
import { NextRequest } from "next/server";
import { findCaseByPublicId } from "@/lib/db/repository";
import { toPublicCaseView } from "@/lib/dto/case";

// Scenario E, driven through the real route handler so authorization, the
// state machine, the audit trail and the database writes are all exercised
// together rather than in isolation.

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name)
  }),
  headers: () => new Headers({ "user-agent": "vitest" })
}));

import { vi } from "vitest";

let org: Awaited<ReturnType<typeof createOrg>>;
let otherOrg: Awaited<ReturnType<typeof createOrg>>;
let responder: Awaited<ReturnType<typeof createUser>>;
let caseId: string;

async function act(body: Record<string, unknown>) {
  const request = new NextRequest("http://localhost:3000/api/responder/actions", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", host: "localhost:3000" },
    body: JSON.stringify({ caseId, ...body })
  });
  const response = await responderAction(request);
  return { status: response.status, body: await response.json() };
}

beforeEach(async () => {
  await resetDatabase();
  cookieJar.clear();
  org = await createOrg("org-facilities", "Facilities Department");
  otherOrg = await createOrg("org-water", "Municipal Water Services");
  responder = await createUser({
    email: "r@test.example",
    role: "responder",
    orgId: org.id,
    displayName: "R. Mensah (Facilities)"
  });
  await createSession(responder, {
    set: (name, value) => cookieJar.set(name, String(value)),
    delete: (name) => cookieJar.delete(name)
  }, { ip: "127.0.0.1", userAgent: "vitest" });

  const report = await createReport({
    category: "safety",
    narrative: "A wall panel on the north walkway is sparking and its cover is missing entirely.",
    locationGeneral: "North walkway",
    incidentAt: new Date(),
    privacyMode: "anonymous"
  });
  caseId = report.caseId;
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("Scenario E — a responder works a case end to end", () => {
  it("requires a session", async () => {
    cookieJar.delete(SESSION_COOKIE);
    const result = await act({ action: "acknowledge" });
    expect(result.status).toBe(401);
  });

  it("records an internal note attributed to the person, with no public event", async () => {
    const result = await act({ action: "add_note", note: "Contractor booked for tomorrow morning." });
    expect(result.status).toBe(200);

    const notes = await prisma.internalNote.findMany();
    expect(notes[0].authorId).toBe(responder.id);
    expect(notes[0].authorLabel).toBe("R. Mensah (Facilities)");

    const record = await findCaseByPublicId(caseId);
    expect(record!.events.some((e) => e.detail?.includes("Contractor booked"))).toBe(false);
  });

  it("assigns, acknowledges and records actions with attribution", async () => {
    expect((await act({ action: "assign", orgId: org.id })).status).toBe(200);
    expect((await act({ action: "acknowledge", note: "Inspection requested." })).status).toBe(200);
    expect((await act({ action: "start_progress" })).status).toBe(200);
    expect(
      (await act({ action: "record_action", note: "Contractor isolated the panel and made the area safe." }))
        .status
    ).toBe(200);

    const record = await findCaseByPublicId(caseId);
    expect(record!.assignedOrgId).toBe(org.id);
    expect(record!.response).toBe("action_recorded");

    // Every state change names a person, not a generic desk.
    const actioned = record!.events.filter((e) =>
      ["CASE_ASSIGNED", "CASE_ACKNOWLEDGED", "RESPONSE_IN_PROGRESS", "ACTION_RECORDED"].includes(e.type)
    );
    expect(actioned).toHaveLength(4);
    for (const event of actioned) {
      expect(event.actorId).toBe(responder.id);
      expect(event.actorLabel).toBe("R. Mensah (Facilities)");
    }
  });

  it("routes an unassigned case to whichever organization is responsible", async () => {
    const result = await act({ action: "assign", orgId: otherOrg.id, note: "Water, not facilities." });
    expect(result.status).toBe(200);
  });

  it("refuses to move another organization's assigned case elsewhere", async () => {
    await act({ action: "assign", orgId: otherOrg.id, note: "Water, not facilities." });
    // The case now belongs to the water service; this responder is facilities.
    const result = await act({ action: "assign", orgId: org.id });
    expect(result.status).toBe(403);
  });

  it("restores the verification a case held before closure when it is reopened", async () => {
    await act({ action: "assign", orgId: org.id });
    await act({
      action: "set_verification",
      verification: "partially_verified",
      note: "Two consistent reports describe the same panel."
    });
    await act({ action: "acknowledge" });
    await act({ action: "start_progress" });
    await act({ action: "record_action", note: "Panel isolated and made safe by the contractor." });
    await act({
      action: "close",
      note: "Work complete and signed off.",
      publicUpdate: "The panel has been isolated and the walkway is safe to use again."
    });
    expect((await findCaseByPublicId(caseId))!.verification).toBe("resolved");

    const reopened = await act({ action: "reopen", note: "The fault has recurred at the same panel." });
    expect(reopened.status).toBe(200);

    const record = await findCaseByPublicId(caseId);
    expect(record!.response).toBe("in_progress");
    // Back to what was actually established — not a state nobody recorded.
    expect(record!.verification).toBe("partially_verified");
    expect(record!.resolvedAt).toBeNull();
  });

  it("enforces the response state machine", async () => {
    // received → closed is not a legal jump.
    const result = await act({
      action: "close",
      note: "Everything is fine now.",
      publicUpdate: "The issue has been dealt with."
    });
    expect(result.status).toBe(400);
  });

  it("refuses to close without a recorded action or a public outcome", async () => {
    await act({ action: "assign", orgId: org.id });
    await act({ action: "acknowledge" });
    await act({ action: "start_progress" });

    const noAction = await act({ action: "close", note: "Closing this one.", publicUpdate: "All resolved now." });
    expect(noAction.status).toBe(400);
    expect(noAction.body.error).toMatch(/record the action/i);

    await act({ action: "record_action", note: "Panel isolated and made safe by the contractor." });

    const noOutcome = await act({ action: "close", note: "Closing this one." });
    expect(noOutcome.status).toBe(400);
    expect(noOutcome.body.error).toMatch(/public update/i);
  });

  it("does not mark an unverified case resolved when it is closed", async () => {
    await act({ action: "assign", orgId: org.id });
    await act({ action: "acknowledge" });
    await act({ action: "start_progress" });
    await act({ action: "record_action", note: "Panel isolated and made safe by the contractor." });
    const closed = await act({
      action: "close",
      note: "Work complete and signed off.",
      publicUpdate: "The panel has been isolated and the walkway is safe to use again."
    });
    expect(closed.status).toBe(200);

    const record = await findCaseByPublicId(caseId);
    expect(record!.response).toBe("closed");
    // RESPONDED is not VERIFIED: nothing corroborated this claim.
    expect(record!.verification).toBe("unverified");
    expect(record!.resolvedAt).toBeNull();
  });

  it("does mark a documented case resolved on closure", async () => {
    await act({ action: "assign", orgId: org.id });
    await act({
      action: "set_verification",
      verification: "documented",
      note: "The contractor's inspection report documents the fault."
    });
    await act({ action: "acknowledge" });
    await act({ action: "start_progress" });
    await act({ action: "record_action", note: "Panel isolated and made safe by the contractor." });
    await act({
      action: "close",
      note: "Work complete and signed off.",
      publicUpdate: "The panel has been isolated and the walkway is safe to use again."
    });

    const record = await findCaseByPublicId(caseId);
    expect(record!.verification).toBe("resolved");
    expect(record!.resolvedAt).not.toBeNull();
  });

  it("requires a reason for a verification change", async () => {
    const result = await act({ action: "set_verification", verification: "documented" });
    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(/why/i);
  });

  it("publishes a public update that citizens can read", async () => {
    await act({ action: "assign", orgId: org.id });
    const result = await act({
      action: "add_update",
      publicUpdate: "An electrical contractor will inspect the panel tomorrow morning."
    });
    expect(result.status).toBe(200);

    const record = await findCaseByPublicId(caseId);
    const update = record!.updates[0];
    expect(update.body).toContain("electrical contractor");
    expect(update.authorLabel).toBe("Facilities Department");
    expect(update.authorId).toBe(responder.id);
  });

  it("creates a real information request the reporter can answer", async () => {
    await act({ action: "assign", orgId: org.id });
    const result = await act({
      action: "request_info",
      publicUpdate: "Could you tell us which end of the walkway the panel is on?"
    });
    expect(result.status).toBe(200);

    const requests = await prisma.infoRequest.findMany();
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe("open");
    expect(requests[0].message).toContain("which end of the walkway");

    const record = await findCaseByPublicId(caseId);
    expect(record!.awaitingReporter).toBe(true);
  });

  it("controls publication, and requires publishable text", async () => {
    const record = await findCaseByPublicId(caseId);
    expect(record!.publicVisible).toBe(false);

    const published = await act({
      action: "set_publication",
      publicationState: "public_case",
      publicSummary: "An exposed electrical panel beside the north walkway has been reported and is being inspected.",
      note: "Reviewed; no personal detail in the summary."
    });
    expect(published.status).toBe(200);

    const after = await findCaseByPublicId(caseId);
    expect(after!.publicVisible).toBe(true);
    expect(after!.publicationState).toBe("public_case");
    expect(toPublicCaseView(after!).summary).toContain("north walkway");
  });
});

describe("corroboration decisions", () => {
  it("records a confirmation on both cases without changing verification", async () => {
    const second = await createReport({
      category: "safety",
      narrative: "Sparking again from the wall panel on the north walkway tonight, cover still missing entirely.",
      locationGeneral: "North walkway",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    expect(second.possibleMatches.length).toBeGreaterThan(0);

    const link = await prisma.caseLink.findFirst();
    const result = await act({
      action: "confirm_link",
      linkId: link!.id,
      note: "Same panel, same walkway, one day apart."
    });
    expect(result.status).toBe(200);

    const updated = await prisma.caseLink.findUnique({ where: { id: link!.id } });
    expect(updated!.status).toBe("confirmed");
    expect(updated!.decidedById).toBe(responder.id);

    const record = await findCaseByPublicId(caseId);
    // Confirming corroboration is not the same as verifying the claim.
    expect(record!.verification).toBe("unverified");
    const confirmed = record!.events.find((e) => e.type === "CORROBORATION_CONFIRMED");
    expect(confirmed!.visibility).toBe("public");
    expect(confirmed!.detail).toMatch(/does not by itself change the verification state/i);
  });

  it("requires a reason for a link decision", async () => {
    await createReport({
      category: "safety",
      narrative: "Sparking again from the wall panel on the north walkway tonight, cover still missing entirely.",
      locationGeneral: "North walkway",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    const link = await prisma.caseLink.findFirst();
    const result = await act({ action: "reject_link", linkId: link!.id, note: "no" });
    expect(result.status).toBe(400);
  });
});
