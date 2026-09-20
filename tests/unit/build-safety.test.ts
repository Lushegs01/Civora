import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `next build` imports every route module to collect page data. If any of them
// needs a live database URL at import time, the build fails — which is exactly
// how the first preview deployment broke. These tests import the modules with
// the configuration removed and assert that nothing throws until a query is
// actually attempted.

const saved: Record<string, string | undefined> = {};
const KEYS = ["DATABASE_URL", "DIRECT_URL", "SESSION_SECRET", "OBJECT_STORAGE_DRIVER"];

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  vi.resetModules();
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  vi.resetModules();
});

describe("importing server modules without configuration", () => {
  it("does not build a Prisma client on import", async () => {
    const module = await import("@/lib/db/prisma");
    expect(module.prisma).toBeDefined();
  });

  it("does not throw when the repository layer is imported", async () => {
    await expect(import("@/lib/db/repository")).resolves.toBeDefined();
  });

  it("does not throw when case creation is imported", async () => {
    await expect(import("@/lib/cases/create")).resolves.toBeDefined();
  });

  it("does not throw when the session layer is imported", async () => {
    await expect(import("@/lib/auth/session")).resolves.toBeDefined();
  });

  it("does not throw when the rate limiter is imported", async () => {
    await expect(import("@/lib/rate-limit")).resolves.toBeDefined();
  });
});

describe("configuration still fails loudly at first use", () => {
  it("reports the missing variable by name when a query is attempted", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    // Deferred, not skipped: the first property access builds the client and
    // raises the configuration error, naming what is missing.
    expect(() => prisma.case.count()).toThrow(/DATABASE_URL/);
  });
});
