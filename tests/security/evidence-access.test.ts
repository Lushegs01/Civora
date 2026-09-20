import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createOrg, createUser, prisma, resetDatabase } from "../helpers/db";
import { createReport } from "@/lib/cases/create";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { addFileEvidence } from "@/lib/cases/evidence";
import { GET as getEvidenceFile } from "@/app/api/evidence-file/[id]/route";

// The evidence file route is the only way bytes leave Civora. These tests are
// the boundary: if any of them fail, a restricted photograph is readable by
// someone who should not have it.

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name)
  }),
  headers: () => new Headers({ "user-agent": "vitest" })
}));

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(64).fill(0x41), 0xff, 0xd9]);

let caseId: string;
let internalCaseId: string;
let trackingToken: string;
let restrictedId: string;
let publicId: string;
let otherToken: string;

async function fetchEvidence(id: string, options: { token?: string } = {}) {
  const headers: Record<string, string> = { host: "localhost:3000" };
  if (options.token) headers["x-civora-tracking-token"] = options.token;
  const request = new NextRequest(`http://localhost:3000/api/evidence-file/${id}`, { headers });
  return getEvidenceFile(request, { params: { id } });
}

beforeEach(async () => {
  await resetDatabase();
  cookieJar.clear();

  const report = await createReport({
    category: "safety",
    narrative: "A wall panel on the north walkway is sparking and the cover is missing entirely.",
    locationGeneral: "North walkway",
    incidentAt: new Date(),
    privacyMode: "anonymous"
  });
  caseId = report.caseId;
  internalCaseId = report.internalCaseId;
  trackingToken = report.trackingToken;

  const restricted = await addFileEvidence({
    caseId: internalCaseId,
    bytes: JPEG_BYTES,
    declaredMimeType: "image/jpeg",
    declaredFileName: "panel.jpg",
    privacyMode: "anonymous",
    relationship: "Reporter upload.",
    publicVisible: false
  });
  if (!restricted.ok) throw new Error(restricted.reason);
  restrictedId = restricted.evidenceId;

  const published = await addFileEvidence({
    caseId: internalCaseId,
    bytes: JPEG_BYTES,
    declaredMimeType: "image/jpeg",
    declaredFileName: "notice.jpg",
    privacyMode: "anonymous",
    relationship: "Published notice.",
    publicVisible: true
  });
  if (!published.ok) throw new Error(published.reason);
  publicId = published.evidenceId;

  const other = await createReport({
    category: "infrastructure",
    narrative: "A street light outside the school has been out for several nights in a row now.",
    locationGeneral: "School Lane",
    incidentAt: new Date(),
    privacyMode: "anonymous"
  });
  otherToken = other.trackingToken;
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("public evidence", () => {
  it("is served to anyone", async () => {
    const response = await fetchEvidence(publicId);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });
});

describe("restricted evidence", () => {
  it("is refused to an anonymous visitor", async () => {
    const response = await fetchEvidence(restrictedId);
    expect(response.status).toBe(403);
  });

  it("is refused to a reporter holding a different case's token", async () => {
    const response = await fetchEvidence(restrictedId, { token: otherToken });
    expect(response.status).toBe(403);
  });

  it("is refused for a made-up token", async () => {
    const response = await fetchEvidence(restrictedId, { token: "x".repeat(40) });
    expect(response.status).toBe(403);
  });

  it("is served to the reporter who filed the case", async () => {
    const response = await fetchEvidence(restrictedId, { token: trackingToken });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(JPEG_BYTES);
  });

  it("is served to an authorized responder", async () => {
    const org = await createOrg("org-a", "Organization A");
    await prisma.case.update({ where: { id: internalCaseId }, data: { assignedOrgId: org.id } });
    const responder = await createUser({ email: "r@test.example", role: "responder", orgId: org.id });
    await createSession(responder, {
      set: (name, value) => cookieJar.set(name, String(value)),
      delete: (name) => cookieJar.delete(name)
    }, { ip: "127.0.0.1", userAgent: "vitest" });

    const response = await fetchEvidence(restrictedId);
    expect(response.status).toBe(200);
  });

  it("is refused to a responder from another organization", async () => {
    const orgA = await createOrg("org-a", "Organization A");
    const orgB = await createOrg("org-b", "Organization B");
    await prisma.case.update({ where: { id: internalCaseId }, data: { assignedOrgId: orgA.id } });
    const outsider = await createUser({ email: "b@test.example", role: "responder", orgId: orgB.id });
    await createSession(outsider, {
      set: (name, value) => cookieJar.set(name, String(value)),
      delete: (name) => cookieJar.delete(name)
    }, { ip: "127.0.0.1", userAgent: "vitest" });

    const response = await fetchEvidence(restrictedId);
    expect(response.status).toBe(403);
    expect(cookieJar.has(SESSION_COOKIE)).toBe(true);
  });
});

describe("response hardening", () => {
  it("never allows a stored file to execute in our origin", async () => {
    const response = await fetchEvidence(publicId);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not leak a filename into a response header unescaped", async () => {
    const evidence = await prisma.evidence.update({
      where: { id: publicId },
      data: { fileName: 'bad"name\r\nX-Injected: 1.jpg' }
    });
    const response = await fetchEvidence(evidence.id);
    const disposition = response.headers.get("content-disposition") ?? "";
    // No CR/LF (header injection) and no stray quote (breaking out of the
    // filename parameter).
    expect(disposition).not.toMatch(/[\r\n]/);
    expect(disposition.slice('inline; filename="'.length, -1)).not.toContain('"');
    expect(response.headers.get("x-injected")).toBeNull();
  });

  it("returns 404 for evidence that does not exist", async () => {
    const response = await fetchEvidence("does-not-exist");
    expect(response.status).toBe(404);
  });
});

describe("what gets stored", () => {
  it("records a checksum and keeps the storage key server-side", async () => {
    const evidence = await prisma.evidence.findUnique({ where: { id: restrictedId } });
    expect(evidence!.checksum).toHaveLength(64);
    expect(evidence!.storageKey).toBeTruthy();
    expect(evidence!.storageDriver).toBe("local");
    // Reporter uploads are restricted by default.
    expect(evidence!.publicVisible).toBe(false);
  });

  it("labels the source by privacy mode, never by name", async () => {
    const evidence = await prisma.evidence.findUnique({ where: { id: restrictedId } });
    expect(evidence!.submittedByLabel).toBe("Citizen report (anonymous)");
  });

  it("refuses a file whose bytes contradict its declared type", async () => {
    const result = await addFileEvidence({
      caseId: internalCaseId,
      bytes: new TextEncoder().encode("<html><script>alert(1)</script></html>"),
      declaredMimeType: "image/jpeg",
      declaredFileName: "evil.jpg",
      privacyMode: "anonymous",
      relationship: "Attack payload."
    });
    expect(result.ok).toBe(false);
  });
});
