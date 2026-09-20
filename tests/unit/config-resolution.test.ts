import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Vercel injects its own variable names for a connected Postgres or Blob
// store. These tests pin the resolution order, because getting it wrong shows
// up as a deployment that builds fine and then fails on its first request.

const KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "OBJECT_STORAGE_DRIVER",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL"
];
const saved: Record<string, string | undefined> = {};

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

describe("database URL resolution", () => {
  it("prefers an explicit DATABASE_URL", async () => {
    process.env.DATABASE_URL = "postgres://explicit/db";
    process.env.POSTGRES_URL = "postgres://vercel/db";
    const { databaseUrl } = await import("@/lib/config");
    expect(databaseUrl()).toBe("postgres://explicit/db");
  });

  it("accepts a connected Vercel Postgres store with nothing set by hand", async () => {
    process.env.POSTGRES_URL = "postgres://vercel/db";
    const { databaseUrl, hasDatabaseUrl } = await import("@/lib/config");
    expect(hasDatabaseUrl()).toBe(true);
    expect(databaseUrl()).toBe("postgres://vercel/db");
  });

  it("prefers POSTGRES_URL over POSTGRES_PRISMA_URL", async () => {
    // POSTGRES_PRISMA_URL carries pgbouncer/connect_timeout parameters meant
    // for Prisma's own pooling, not for the node-postgres adapter.
    process.env.POSTGRES_URL = "postgres://plain/db";
    process.env.POSTGRES_PRISMA_URL = "postgres://prisma/db?pgbouncer=true&connect_timeout=15";
    const { databaseUrl } = await import("@/lib/config");
    expect(databaseUrl()).toBe("postgres://plain/db");
  });

  it("falls back to POSTGRES_PRISMA_URL when it is all there is", async () => {
    process.env.POSTGRES_PRISMA_URL = "postgres://prisma/db?pgbouncer=true";
    const { databaseUrl } = await import("@/lib/config");
    expect(databaseUrl()).toBe("postgres://prisma/db?pgbouncer=true");
  });

  it("reports the absence rather than guessing", async () => {
    const { databaseUrl, hasDatabaseUrl } = await import("@/lib/config");
    expect(hasDatabaseUrl()).toBe(false);
    expect(() => databaseUrl()).toThrow(/DATABASE_URL/);
  });
});

describe("storage driver resolution", () => {
  it("honours an explicit driver over anything detected", async () => {
    process.env.OBJECT_STORAGE_DRIVER = "s3";
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    const { storage } = await import("@/lib/config");
    expect(storage.driver).toBe("s3");
  });

  it("detects a connected Vercel Blob store from its token", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    const { storage } = await import("@/lib/config");
    expect(storage.driver).toBe("vercel-blob");
  });

  it("falls back to local disk only outside production", async () => {
    const { storage } = await import("@/lib/config");
    // NODE_ENV is "test" here, which is not production.
    expect(storage.driver).toBe("local");
  });
});

describe("site URL resolution", () => {
  it("prefers an explicit NEXT_PUBLIC_SITE_URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://civora.example";
    process.env.VERCEL_URL = "deployment-abc.vercel.app";
    const { siteUrl } = await import("@/lib/config");
    expect(siteUrl).toBe("https://civora.example");
  });

  it("prefers the stable production domain over a per-deployment URL", async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "civora.vercel.app";
    process.env.VERCEL_URL = "civora-git-branch-abc.vercel.app";
    const { siteUrl } = await import("@/lib/config");
    expect(siteUrl).toBe("https://civora.vercel.app");
  });

  it("uses the deployment URL on a preview", async () => {
    process.env.VERCEL_URL = "civora-git-branch-abc.vercel.app";
    const { siteUrl } = await import("@/lib/config");
    expect(siteUrl).toBe("https://civora-git-branch-abc.vercel.app");
  });

  it("falls back to localhost for development", async () => {
    const { siteUrl } = await import("@/lib/config");
    expect(siteUrl).toBe("http://localhost:3000");
  });
});

describe("health warnings", () => {
  it("names what is missing without leaking any value", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { configurationWarnings } = await import("@/lib/config");
    const warnings = configurationWarnings().join(" ");
    expect(warnings).toMatch(/database connection string/i);
    expect(warnings).toMatch(/evidence storage/i);
    vi.unstubAllEnvs();
  });

  it("stops warning once a Vercel store is connected", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.POSTGRES_URL = "postgres://vercel/db";
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    process.env.SESSION_SECRET = "a".repeat(40);
    const { configurationWarnings } = await import("@/lib/config");
    const warnings = configurationWarnings().join(" ");
    expect(warnings).not.toMatch(/database connection string/i);
    expect(warnings).not.toMatch(/evidence storage/i);
    vi.unstubAllEnvs();
  });
});
