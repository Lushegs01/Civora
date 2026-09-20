import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { actorFor, createOrg, createUser, prisma, resetDatabase } from "../helpers/db";
import {
  canAccessWorkspace,
  canActOnCase,
  canAssignToOrg,
  canViewCase,
  viewerRoleFor
} from "@/lib/authz";
import { createReport } from "@/lib/cases/create";
import { findCaseByPublicId } from "@/lib/db/repository";
import { toPublicCaseView, toReporterCaseView, toResponderCaseView } from "@/lib/dto/case";
import { hashToken } from "@/lib/auth/tokens";

let orgA: Awaited<ReturnType<typeof createOrg>>;
let orgB: Awaited<ReturnType<typeof createOrg>>;
let responderA: Awaited<ReturnType<typeof createUser>>;
let responderB: Awaited<ReturnType<typeof createUser>>;
let adminA: Awaited<ReturnType<typeof createUser>>;
let platformAdmin: Awaited<ReturnType<typeof createUser>>;
let citizen: Awaited<ReturnType<typeof createUser>>;

beforeEach(async () => {
  await resetDatabase();
  orgA = await createOrg("org-a", "Organization A");
  orgB = await createOrg("org-b", "Organization B");
  responderA = await createUser({ email: "a@test.example", role: "responder", orgId: orgA.id });
  responderB = await createUser({ email: "b@test.example", role: "responder", orgId: orgB.id });
  adminA = await createUser({ email: "admin-a@test.example", role: "organization_admin", orgId: orgA.id });
  platformAdmin = await createUser({ email: "platform@test.example", role: "platform_admin" });
  citizen = await createUser({ email: "citizen@test.example", role: "citizen" });
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("workspace access", () => {
  it("lets staff in and keeps citizens out", () => {
    expect(canAccessWorkspace(actorFor(responderA))).toBe(true);
    expect(canAccessWorkspace(actorFor(adminA))).toBe(true);
    expect(canAccessWorkspace(actorFor(platformAdmin))).toBe(true);
    expect(canAccessWorkspace(actorFor(citizen))).toBe(false);
    expect(canAccessWorkspace(null)).toBe(false);
  });
});

describe("organization scoping", () => {
  it("lets any responder work the unassigned triage queue", () => {
    expect(canViewCase(actorFor(responderA), { assignedOrgId: null })).toBe(true);
    expect(canViewCase(actorFor(responderB), { assignedOrgId: null })).toBe(true);
  });

  it("keeps one organization out of another's casework", () => {
    expect(canViewCase(actorFor(responderA), { assignedOrgId: orgA.id })).toBe(true);
    expect(canViewCase(actorFor(responderB), { assignedOrgId: orgA.id })).toBe(false);
    expect(canActOnCase(actorFor(responderB), { assignedOrgId: orgA.id })).toBe(false);
  });

  it("gives a platform administrator cross-organization access", () => {
    expect(canViewCase(actorFor(platformAdmin), { assignedOrgId: orgA.id })).toBe(true);
    expect(canViewCase(actorFor(platformAdmin), { assignedOrgId: orgB.id })).toBe(true);
  });

  it("never gives a citizen access, whatever the case", () => {
    expect(canViewCase(actorFor(citizen), { assignedOrgId: null })).toBe(false);
    expect(canViewCase(actorFor(citizen), { assignedOrgId: orgA.id })).toBe(false);
  });
});

describe("assignment permissions", () => {
  const unassigned = { assignedOrgId: null };

  it("lets a responder pull work from the shared queue to their own organization", () => {
    expect(canAssignToOrg(actorFor(responderA), unassigned, orgA.id)).toBe(true);
  });

  // Triage is routing: a case nobody owns yet can go to whoever is
  // responsible, including a central desk with no organization of its own.
  it("lets any responder route an unassigned case to the responsible organization", () => {
    expect(canAssignToOrg(actorFor(responderA), unassigned, orgB.id)).toBe(true);
    const triage = actorFor({ id: "triage", role: "responder", orgId: null });
    expect(canAssignToOrg(triage, unassigned, orgA.id)).toBe(true);
  });

  it("stops a responder moving another organization's assigned case elsewhere", () => {
    // Not their case at all.
    expect(canAssignToOrg(actorFor(responderB), { assignedOrgId: orgA.id }, orgB.id)).toBe(false);
    // Their own case, but they may not hand it to a third party.
    const triage = actorFor({ id: "triage", role: "responder", orgId: null });
    expect(canAssignToOrg(triage, { assignedOrgId: orgA.id }, orgB.id)).toBe(false);
  });

  it("lets an organization admin route outward", () => {
    expect(canAssignToOrg(actorFor(adminA), { assignedOrgId: orgA.id }, orgB.id)).toBe(true);
  });

  it("lets anyone authorized return a case to the unassigned queue", () => {
    expect(canAssignToOrg(actorFor(responderA), { assignedOrgId: orgA.id }, null)).toBe(true);
  });

  it("refuses when the actor cannot act on the case at all", () => {
    expect(canAssignToOrg(actorFor(responderB), { assignedOrgId: orgA.id }, orgB.id)).toBe(false);
  });
});

describe("viewer role resolution", () => {
  it("prefers the strongest role the actor actually holds", () => {
    expect(viewerRoleFor(actorFor(platformAdmin), { assignedOrgId: orgA.id }, false)).toBe("admin");
    expect(viewerRoleFor(actorFor(responderA), { assignedOrgId: orgA.id }, false)).toBe("responder");
    expect(viewerRoleFor(actorFor(responderB), { assignedOrgId: orgA.id }, true)).toBe("reporter");
    expect(viewerRoleFor(null, { assignedOrgId: orgA.id }, false)).toBe("public");
  });
});

describe("evidence visibility by role", () => {
  it("hides restricted evidence from the public and reporter views, shows it to handlers", async () => {
    const report = await createReport({
      category: "infrastructure",
      narrative: "The crossing sign at the market entrance is bent and facing the wrong way.",
      locationGeneral: "Market entrance",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });

    await prisma.evidence.create({
      data: {
        caseId: report.internalCaseId,
        kind: "photo",
        title: "Restricted photo",
        sourceType: "citizen",
        submittedByLabel: "Citizen report (anonymous)",
        relationship: "Reporter upload.",
        storageKey: "evidence/secret-key",
        publicVisible: false
      }
    });
    await prisma.evidence.create({
      data: {
        caseId: report.internalCaseId,
        kind: "official",
        title: "Published notice",
        sourceType: "official",
        submittedByLabel: "Public Works Office",
        relationship: "Official record.",
        publicVisible: true
      }
    });

    const record = await findCaseByPublicId(report.caseId);
    const publicView = toPublicCaseView(record!);
    const reporterView = toReporterCaseView(record!, report.reportId);
    const responderView = toResponderCaseView(record!, "responder");

    expect(publicView.evidence.map((e) => e.title)).toEqual(["Published notice"]);
    expect(reporterView.evidence.map((e) => e.title)).toEqual(["Published notice"]);
    expect(responderView.evidence.map((e) => e.title)).toContain("Restricted photo");

    // The storage key is an internal pointer and must never be serialized.
    for (const view of [publicView, reporterView, responderView]) {
      expect(JSON.stringify(view)).not.toContain("secret-key");
      expect(JSON.stringify(view)).not.toContain("storageKey");
    }
  });
});

describe("restricted timeline events", () => {
  it("keeps internal events out of the public timeline", async () => {
    const report = await createReport({
      category: "safety",
      narrative: "A wall panel on the walkway near the residences is sparking and the cover is missing.",
      locationGeneral: "North walkway",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    await prisma.caseEvent.create({
      data: {
        caseId: report.internalCaseId,
        type: "ACTION_RECORDED",
        actorType: "responder",
        actorLabel: "R. Mensah",
        visibility: "restricted",
        title: "Internal-only action",
        detail: "Contractor's private phone number is 0803 000 0000."
      }
    });

    const record = await findCaseByPublicId(report.caseId);
    const publicView = toPublicCaseView(record!);
    expect(JSON.stringify(publicView)).not.toContain("Internal-only action");
    expect(JSON.stringify(publicView)).not.toContain("0803 000 0000");

    const responderView = toResponderCaseView(record!, "responder");
    expect(JSON.stringify(responderView)).toContain("Internal-only action");
  });

  it("keeps internal notes out of every non-responder view", async () => {
    const report = await createReport({
      category: "community",
      narrative: "The bins behind the community hall have not been emptied for two weeks now.",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    await prisma.internalNote.create({
      data: { caseId: report.internalCaseId, authorLabel: "Triage", body: "Very sensitive internal note." }
    });

    const record = await findCaseByPublicId(report.caseId);
    expect(JSON.stringify(toPublicCaseView(record!))).not.toContain("Very sensitive internal note.");
    expect(JSON.stringify(toReporterCaseView(record!, report.reportId))).not.toContain(
      "Very sensitive internal note."
    );
    expect(JSON.stringify(toResponderCaseView(record!, "responder"))).toContain(
      "Very sensitive internal note."
    );
  });
});

describe("reporter authorization", () => {
  it("only matches the report whose token hash was presented", async () => {
    const first = await createReport({
      category: "service",
      narrative: "There has been no water on this street since early this morning and neighbours report the same.",
      locationGeneral: "Kessler Road",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    const second = await createReport({
      category: "infrastructure",
      narrative: "A street light outside the school has been out for several nights in a row.",
      locationGeneral: "School Lane",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });

    const firstReport = await prisma.report.findUnique({
      where: { trackingTokenHash: hashToken(first.trackingToken) },
      select: { caseId: true }
    });
    expect(firstReport?.caseId).toBe(first.internalCaseId);
    expect(firstReport?.caseId).not.toBe(second.internalCaseId);

    // Another reporter's token resolves to their own case, never to this one.
    const crossed = await prisma.report.findUnique({
      where: { trackingTokenHash: hashToken(second.trackingToken) },
      select: { caseId: true }
    });
    expect(crossed?.caseId).toBe(second.internalCaseId);

    // A token nobody issued matches nothing.
    expect(
      await prisma.report.findUnique({ where: { trackingTokenHash: hashToken("made-up-token") } })
    ).toBeNull();
  });
});
