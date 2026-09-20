import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma, resetDatabase } from "../helpers/db";
import { createReport } from "@/lib/cases/create";
import { POST as track } from "@/app/api/track/route";
import { POST as recover } from "@/app/api/track/recover/route";
import { POST as caseView } from "@/app/api/cases/view/route";
import { hashToken } from "@/lib/auth/tokens";

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: () => new Headers()
}));

function post(handler: (req: NextRequest) => Promise<Response>, path: string, body: unknown, ip = "10.0.0.1") {
  const request = new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "x-forwarded-for": ip
    },
    body: JSON.stringify(body)
  });
  return handler(request);
}

let publicCase: Awaited<ReturnType<typeof createReport>>;
let privateCase: Awaited<ReturnType<typeof createReport>>;

beforeEach(async () => {
  await resetDatabase();

  publicCase = await createReport({
    category: "infrastructure",
    narrative: "The crossing sign at the market entrance is bent and facing the wrong way entirely.",
    locationGeneral: "Market entrance",
    incidentAt: new Date(),
    privacyMode: "anonymous"
  });
  privateCase = await createReport({
    category: "safety",
    narrative: "A wall panel on the north walkway is sparking and the cover is missing entirely.",
    locationGeneral: "North walkway",
    incidentAt: new Date(),
    privacyMode: "anonymous",
    withRecoveryCode: true
  });
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("tracked case lookup", () => {
  it("marks a case as the caller's only when the token hash matches", async () => {
    const response = await post(track, "/api/track", {
      pairs: [{ caseId: publicCase.caseId, token: publicCase.trackingToken }]
    });
    const body = await response.json();
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].reporter).toBe(true);
    expect(body.rows[0].href).toBe(`/cases/${publicCase.caseId}`);
  });

  it("ignores a client that simply claims to be the reporter", async () => {
    const response = await post(track, "/api/track", {
      // No token at all, but the case is public, so a public row is returned.
      pairs: [{ caseId: publicCase.caseId }]
    });
    const body = await response.json();
    expect(body.rows[0].reporter).toBe(false);
    expect(body.rows[0].href).toBe(`/community/${publicCase.caseId}`);
  });

  it("will not reveal a case that is neither public nor the caller's", async () => {
    const response = await post(track, "/api/track", { pairs: [{ caseId: privateCase.caseId }] });
    const body = await response.json();
    expect(body.rows).toHaveLength(0);
  });

  it("returns nothing at all for a made-up case id", async () => {
    const response = await post(track, "/api/track", { pairs: [{ caseId: "CS-999999" }] });
    expect((await response.json()).rows).toHaveLength(0);
  });

  it("rejects a malformed case id rather than querying with it", async () => {
    const response = await post(track, "/api/track", { pairs: [{ caseId: "'; DROP TABLE \"Case\"; --" }] });
    expect(response.status).toBe(400);
    expect(await prisma.case.count()).toBeGreaterThan(0);
  });

  it("caps how many cases one request can ask about", async () => {
    const pairs = Array.from({ length: 50 }, () => ({ caseId: publicCase.caseId }));
    const response = await post(track, "/api/track", { pairs });
    expect(response.status).toBe(400);
  });

  it("rate limits enumeration attempts", async () => {
    const ip = "203.0.113.9";
    let blocked = false;
    for (let i = 0; i < 70; i += 1) {
      const response = await post(track, "/api/track", { pairs: [{ caseId: publicCase.caseId }] }, ip);
      if (response.status === 429) {
        blocked = true;
        expect(response.headers.get("retry-after")).toBeTruthy();
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});

describe("case view authorization", () => {
  it("returns the reporter view for a valid token", async () => {
    const response = await post(caseView, "/api/cases/view", {
      caseId: privateCase.caseId,
      token: privateCase.trackingToken
    });
    const body = await response.json();
    expect(body.view.role).toBe("reporter");
    expect(body.view.yourReport).toContain("sparking");
  });

  it("hides a screened case from a caller with the wrong token", async () => {
    const response = await post(caseView, "/api/cases/view", {
      caseId: privateCase.caseId,
      token: publicCase.trackingToken
    });
    expect(response.status).toBe(404);
  });

  it("gives the same answer for a wrong token and a nonexistent case", async () => {
    const wrongToken = await post(caseView, "/api/cases/view", {
      caseId: privateCase.caseId,
      token: "z".repeat(40)
    });
    const noSuchCase = await post(caseView, "/api/cases/view", { caseId: "CS-999999" });
    expect(wrongToken.status).toBe(noSuchCase.status);
    expect(await wrongToken.json()).toEqual(await noSuchCase.json());
  });
});

describe("recovery codes", () => {
  it("exchanges a valid code for a fresh token and burns the code", async () => {
    const originalHash = hashToken(privateCase.trackingToken);

    const response = await post(recover, "/api/track/recover", {
      caseId: privateCase.caseId,
      recoveryCode: privateCase.recoveryCode
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy();
    expect(body.token).not.toBe(privateCase.trackingToken);

    const report = await prisma.report.findFirst({ where: { caseId: privateCase.internalCaseId } });
    // Rotated, so the old device (or an old link) no longer works…
    expect(report!.trackingTokenHash).not.toBe(originalHash);
    expect(report!.trackingTokenHash).toBe(hashToken(body.token));
    // …and the code cannot be used a second time.
    expect(report!.recoveryCodeHash).toBeNull();

    const replay = await post(recover, "/api/track/recover", {
      caseId: privateCase.caseId,
      recoveryCode: privateCase.recoveryCode
    });
    expect(replay.status).toBe(403);
  });

  it("refuses a code for the wrong case", async () => {
    const response = await post(recover, "/api/track/recover", {
      caseId: publicCase.caseId,
      recoveryCode: privateCase.recoveryCode
    });
    expect(response.status).toBe(403);
  });

  it("rate limits brute-force attempts", async () => {
    const ip = "203.0.113.44";
    let blocked = false;
    for (let i = 0; i < 12; i += 1) {
      const response = await post(
        recover,
        "/api/track/recover",
        { caseId: privateCase.caseId, recoveryCode: "AAAA-BBBB-CCCC" },
        ip
      );
      if (response.status === 429) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});

describe("cross-origin protection", () => {
  it("refuses a state-changing request from another site", async () => {
    const request = new NextRequest("http://localhost:3000/api/track/recover", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
        host: "localhost:3000"
      },
      body: JSON.stringify({ caseId: privateCase.caseId, recoveryCode: privateCase.recoveryCode })
    });
    const response = await recover(request);
    expect(response.status).toBe(403);
  });
});
