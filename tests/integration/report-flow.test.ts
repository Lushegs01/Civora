import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase } from "../helpers/db";
import { createReport } from "@/lib/cases/create";
import { hashToken, hashRecoveryCode } from "@/lib/auth/tokens";
import { toPublicCaseView, toReporterCaseView, toResponderCaseView, FORBIDDEN_PUBLIC_KEYS } from "@/lib/dto/case";
import { findCaseByPublicId } from "@/lib/db/repository";

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

const anonymousSafetyReport = {
  category: "safety" as const,
  narrative:
    "Exposed wiring and a scorched wall panel on the north walkway by the Halls B entrance. Sparks were visible this evening.",
  locationGeneral: "North walkway, Halls B entrance",
  incidentAt: new Date(),
  privacyMode: "anonymous" as const
};

describe("Scenario A — anonymous safety report", () => {
  it("creates the case, report and opening event in one transaction", async () => {
    const result = await createReport(anonymousSafetyReport);

    const record = await findCaseByPublicId(result.caseId);
    expect(record).not.toBeNull();
    expect(record!.reports).toHaveLength(1);
    expect(record!.events.some((e) => e.type === "REPORT_SUBMITTED")).toBe(true);
    expect(record!.privateDescription).toBe(anonymousSafetyReport.narrative);
  });

  it("stores only the hash of the tracking token", async () => {
    const result = await createReport(anonymousSafetyReport);
    const report = await prisma.report.findFirst({ where: { caseId: result.internalCaseId } });
    expect(report!.trackingTokenHash).toBe(hashToken(result.trackingToken));
    expect(report!.trackingTokenHash).not.toContain(result.trackingToken);
  });

  it("stores no identifying information at all for an anonymous report", async () => {
    const result = await createReport({
      ...anonymousSafetyReport,
      // Even if a client sends contact details with privacyMode anonymous,
      // createReport must not store them.
      contact: { name: "Should Not Be Stored", email: "nope@example.com" }
    });
    const contacts = await prisma.reporterContact.findMany({
      where: { report: { caseId: result.internalCaseId } }
    });
    expect(contacts).toHaveLength(0);
  });

  it("does not publish a safety report on submission", async () => {
    const result = await createReport(anonymousSafetyReport);
    expect(result.publicVisible).toBe(false);
    expect(result.publicationState).toBe("screening");
  });

  it("issues a recovery code only when asked, and stores only its hash", async () => {
    const without = await createReport(anonymousSafetyReport);
    expect(without.recoveryCode).toBeUndefined();

    const withCode = await createReport({ ...anonymousSafetyReport, withRecoveryCode: true });
    expect(withCode.recoveryCode).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    const report = await prisma.report.findFirst({ where: { caseId: withCode.internalCaseId } });
    expect(report!.recoveryCodeHash).toBe(hashRecoveryCode(withCode.recoveryCode!));
  });

  it("gives every case a distinct public id, even under concurrency", async () => {
    // Twelve simultaneous submissions: a read-increment-write counter would
    // hand at least two of them the same number.
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        createReport({
          ...anonymousSafetyReport,
          narrative: `${anonymousSafetyReport.narrative} Report variant ${i}.`
        })
      )
    );
    const ids = new Set(results.map((r) => r.caseId));
    expect(ids.size).toBe(12);
    for (const id of ids) expect(id).toMatch(/^CS-\d+$/);
  });
});

describe("public, reporter and responder views", () => {
  it("keeps the reporter's own words out of the public view", async () => {
    const result = await createReport(anonymousSafetyReport);
    const record = await findCaseByPublicId(result.caseId);
    const view = toPublicCaseView(record!);

    expect(view.summary).not.toContain("scorched");
    expect(JSON.stringify(view)).not.toContain(anonymousSafetyReport.narrative);
  });

  it("shows the reporter their own report back", async () => {
    const result = await createReport(anonymousSafetyReport);
    const record = await findCaseByPublicId(result.caseId);
    const view = toReporterCaseView(record!, result.reportId);
    expect(view.yourReport).toBe(anonymousSafetyReport.narrative);
    expect(view.role).toBe("reporter");
  });

  it("never puts a forbidden field in a public or reporter payload", async () => {
    const result = await createReport({
      ...anonymousSafetyReport,
      privacyMode: "identified",
      coordinates: { lat: 12.0022, lng: 8.5919 },
      contact: { name: "Jane Doe", email: "jane@example.com", phone: "+10000000000" }
    });
    const record = await findCaseByPublicId(result.caseId);

    for (const view of [toPublicCaseView(record!), toReporterCaseView(record!, result.reportId)]) {
      const serialized = JSON.stringify(view);
      expect(serialized).not.toContain("Jane Doe");
      expect(serialized).not.toContain("jane@example.com");
      expect(serialized).not.toContain("+10000000000");
      expect(serialized).not.toContain("8.5919");
      for (const key of FORBIDDEN_PUBLIC_KEYS) {
        if (key === "coordinates" && view.role === "reporter") continue;
        expect(serialized).not.toContain(`"${key}"`);
      }
    }
  });

  it("gives an authorized handler the contact details and the private text", async () => {
    const result = await createReport({
      ...anonymousSafetyReport,
      privacyMode: "confidential",
      contact: { name: "Jane Doe", phone: "+10000000000", preferredChannel: "phone" }
    });
    const record = await findCaseByPublicId(result.caseId);
    const view = toResponderCaseView(record!, "responder");

    expect(view.reporterContact?.name).toBe("Jane Doe");
    expect(view.privateDescription).toBe(anonymousSafetyReport.narrative);
    expect(view.screeningFlags.length).toBeGreaterThan(0);
  });

  it("has no contact to show a handler when the report was anonymous", async () => {
    const result = await createReport(anonymousSafetyReport);
    const record = await findCaseByPublicId(result.caseId);
    const view = toResponderCaseView(record!, "responder");
    expect(view.reporterContact).toBeUndefined();
  });
});

describe("Scenario B — corroboration", () => {
  it("proposes a link instead of silently merging or verifying", async () => {
    const first = await createReport(anonymousSafetyReport);
    const second = await createReport({
      ...anonymousSafetyReport,
      narrative:
        "Sparking again from the wall panel on the walkway by Halls B tonight. The cover is still off and the wall is scorched.",
      locationGeneral: "North walkway, Halls B entrance, student residences"
    });

    expect(second.possibleMatches.map((m) => m.caseId)).toContain(first.caseId);

    const links = await prisma.caseLink.findMany();
    expect(links).toHaveLength(1);
    expect(links[0].status).toBe("proposed");

    // The crucial part: nothing about the original case has been upgraded.
    const original = await findCaseByPublicId(first.caseId);
    expect(original!.verification).toBe("unverified");

    // And the public timeline says nothing about corroboration.
    const publicEvents = original!.events.filter((e) => e.visibility === "public");
    expect(publicEvents.some((e) => e.type === "POSSIBLE_MATCH_FOUND")).toBe(false);
    expect(publicEvents.some((e) => /corroborat/i.test(e.title))).toBe(false);
  });

  it("does not claim a response desk confirmed anything", async () => {
    await createReport(anonymousSafetyReport);
    const second = await createReport({
      ...anonymousSafetyReport,
      narrative:
        "Sparking again from the wall panel on the walkway by Halls B tonight. The cover is still off and the wall is scorched.",
      locationGeneral: "North walkway, Halls B entrance, student residences"
    });
    expect(second.possibleMatches.length).toBeGreaterThan(0);

    const events = await prisma.caseEvent.findMany({ where: { type: "POSSIBLE_MATCH_FOUND" } });
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.actorType).toBe("matching_rule");
      expect(event.visibility).toBe("restricted");
      expect(event.detail).toMatch(/awaiting review/i);
      expect(event.detail).not.toMatch(/confirmed by/i);
    }
  });

  it("does not link two unrelated reports that share only a generic place", async () => {
    await createReport({
      category: "community",
      narrative: "Rubbish has been piling up behind the stalls for a week and nobody has collected any of it.",
      locationGeneral: "Market road",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    const second = await createReport({
      category: "community",
      narrative: "A group plays very loud music late into the night, keeping residents awake until morning.",
      locationGeneral: "Market road",
      incidentAt: new Date(),
      privacyMode: "anonymous"
    });
    expect(second.possibleMatches).toHaveLength(0);
    expect(await prisma.caseLink.count()).toBe(0);
  });
});
