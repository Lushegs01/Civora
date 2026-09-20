import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma, resetDatabase } from "../helpers/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { __redactForTests } from "@/lib/log";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name)
  }),
  headers: () => new Headers({ "user-agent": "vitest" })
}));

beforeEach(async () => {
  await resetDatabase();
  cookieJar.clear();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("shared rate limiting", () => {
  it("counts in the database, so every instance shares the budget", async () => {
    const rule = { name: "test:shared", limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i += 1) {
      expect((await rateLimit(rule, "1.2.3.4")).allowed).toBe(true);
    }
    const blocked = await rateLimit(rule, "1.2.3.4");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // The counter is a durable row, not a value in one process's memory.
    expect(await prisma.rateLimitCounter.count()).toBeGreaterThan(0);
  });

  it("keeps separate budgets per caller and per endpoint", async () => {
    const rule = { name: "test:isolation", limit: 1, windowMs: 60_000 };
    expect((await rateLimit(rule, "a")).allowed).toBe(true);
    expect((await rateLimit(rule, "a")).allowed).toBe(false);
    expect((await rateLimit(rule, "b")).allowed).toBe(true);
    expect((await rateLimit({ ...rule, name: "test:other" }, "a")).allowed).toBe(true);
  });

  it("never stores a raw client identifier", async () => {
    await rateLimit({ name: "test:privacy", limit: 5, windowMs: 60_000 }, "198.51.100.23");
    const rows = await prisma.rateLimitCounter.findMany();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.key).not.toContain("198.51.100.23");
  });

  it("covers every endpoint that can be abused or cost money", () => {
    const names = Object.values(RATE_LIMITS).map((r) => r.name);
    for (const required of [
      "report:create",
      "evidence:upload",
      "track",
      "track:recover",
      "auth:login",
      "ai:explain",
      "ai:translate",
      "ai:summary",
      "civic:search",
      "demo:reset"
    ]) {
      expect(names).toContain(required);
    }
  });
});

describe("demo reset gating", () => {
  it("is invisible unless demo mode and demo tools are both switched on", async () => {
    vi.resetModules();
    process.env.CIVORA_DEMO_MODE = "false";
    process.env.ENABLE_DEMO_TOOLS = "false";

    const { POST } = await import("@/app/api/demo/reset/route");
    const request = new NextRequest("http://localhost:3000/api/demo/reset", {
      method: "POST",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" }
    });
    const response = await POST(request);
    expect(response.status).toBe(404);

    process.env.CIVORA_DEMO_MODE = "true";
    process.env.ENABLE_DEMO_TOOLS = "true";
    vi.resetModules();
  });

  it("still requires a platform administrator when the flags are on", async () => {
    vi.resetModules();
    process.env.CIVORA_DEMO_MODE = "true";
    process.env.ENABLE_DEMO_TOOLS = "true";

    const { POST } = await import("@/app/api/demo/reset/route");
    const request = new NextRequest("http://localhost:3000/api/demo/reset", {
      method: "POST",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" }
    });
    const response = await POST(request);
    // No session in the jar, so no actor: refused.
    expect(response.status).toBe(403);
  });
});

describe("log redaction", () => {
  it("strips anything that identifies a reporter or unlocks a case", () => {
    const redacted = __redactForTests({
      caseId: "CS-1042",
      token: "super-secret-tracking-token",
      trackingTokenHash: "abcdef",
      contactName: "Jane Doe",
      email: "jane@example.com",
      phone: "+10000000000",
      description: "The full text of a sensitive report.",
      note: "An internal note.",
      password: "hunter2",
      lat: 12.0022,
      lng: 8.5919,
      nested: { secret: "value", ok: "kept" }
    }) as Record<string, unknown>;

    expect(redacted.caseId).toBe("CS-1042");
    for (const key of [
      "token",
      "trackingTokenHash",
      "contactName",
      "email",
      "phone",
      "description",
      "note",
      "password",
      "lat",
      "lng"
    ]) {
      expect(redacted[key]).toBe("[redacted]");
    }
    expect((redacted.nested as Record<string, unknown>).secret).toBe("[redacted]");
    expect((redacted.nested as Record<string, unknown>).ok).toBe("kept");
  });

  it("truncates long values rather than writing an entire report body", () => {
    const redacted = __redactForTests({ detail: "x".repeat(1000) }) as Record<string, string>;
    expect(redacted.detail.length).toBeLessThan(400);
  });
});
