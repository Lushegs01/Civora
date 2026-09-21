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

describe("migration connection selection", () => {
  // `migrate deploy` takes a session-scoped advisory lock that a transaction
  // pooler cannot hold, so a pooled URL fails with P1002 after a ten-second
  // timeout. A deployment whose only database variable is the pooled one
  // builds, deploys and then cannot migrate — this pins the choice.
  const POOLED = "postgresql://u:p@ep-x-pooler.c-6.us-east-2.aws.neon.tech/neondb";
  const DIRECT = "postgresql://u:p@ep-x.c-6.us-east-2.aws.neon.tech/neondb";

  it("prefers the direct endpoint over the pooled one", async () => {
    const { selectMigrationUrl } = await import("../../prisma.config");
    expect(selectMigrationUrl({ DATABASE_URL: POOLED, DATABASE_URL_UNPOOLED: DIRECT })).toBe(DIRECT);
  });

  it("reads the unpooled name each provider uses", async () => {
    const { selectMigrationUrl } = await import("../../prisma.config");
    // Neon injects DATABASE_URL_UNPOOLED; Vercel Postgres POSTGRES_URL_NON_POOLING.
    expect(selectMigrationUrl({ DATABASE_URL_UNPOOLED: DIRECT })).toBe(DIRECT);
    expect(selectMigrationUrl({ POSTGRES_URL_NON_POOLING: DIRECT })).toBe(DIRECT);
  });

  it("ignores a DIRECT_URL that was set to the pooled string", async () => {
    // The mistake that looks correct: the variable is named for a direct
    // connection but holds the pooled endpoint, and it fails identically.
    const { selectMigrationUrl } = await import("../../prisma.config");
    expect(selectMigrationUrl({ DIRECT_URL: POOLED, DATABASE_URL_UNPOOLED: DIRECT })).toBe(DIRECT);
  });

  it("treats a pgbouncer query flag as pooled", async () => {
    const { selectMigrationUrl } = await import("../../prisma.config");
    const flagged = `${DIRECT}?pgbouncer=true`;
    expect(selectMigrationUrl({ DIRECT_URL: flagged, DATABASE_URL: DIRECT })).toBe(DIRECT);
  });

  it("returns empty when no connection string is configured", async () => {
    const { selectMigrationUrl } = await import("../../prisma.config");
    expect(selectMigrationUrl({})).toBe("");
  });

  it("derives Neon's direct endpoint when only the pooled URL is injected", async () => {
    // The deployment this was written for: Neon's integration injected
    // DATABASE_URL alone, so no variable held a direct endpoint and migrate
    // timed out on the advisory lock with nothing in the environment to fix.
    const { selectMigrationUrl } = await import("../../prisma.config");
    const chosen = selectMigrationUrl({
      DATABASE_URL:
        "postgresql://u:p@ep-twilight-flower-b4gup7z0-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
    });
    expect(chosen).toContain("ep-twilight-flower-b4gup7z0.c-6.us-east-2.aws.neon.tech");
    expect(chosen).not.toContain("-pooler.");
    expect(chosen).not.toContain("pgbouncer=true");
    expect(chosen).toContain("sslmode=require");
  });

  it("keeps a configured direct endpoint rather than deriving one", async () => {
    const { selectMigrationUrl } = await import("../../prisma.config");
    expect(
      selectMigrationUrl({ DATABASE_URL: POOLED, POSTGRES_URL_NON_POOLING: DIRECT })
    ).toBe(DIRECT);
  });

  it("hands back a pooler it cannot derive from, rather than nothing", async () => {
    // Supabase's direct endpoint is a different hostname, not the same one
    // with an infix removed, so guessing would point at nothing. Returning
    // the pooled URL lets migrate fail loudly, which beats skipping
    // migrations and serving an unmigrated database.
    const { selectMigrationUrl } = await import("../../prisma.config");
    const supabase = "postgresql://u:p@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
    expect(selectMigrationUrl({ DATABASE_URL: supabase })).toBe(supabase);
  });

  it("preserves credentials when deriving", async () => {
    const { selectMigrationUrl } = await import("../../prisma.config");
    const chosen = selectMigrationUrl({
      DATABASE_URL: "postgresql://civora:pa%24s@ep-x-pooler.c-6.aws.neon.tech/neondb"
    });
    expect(chosen).toContain("civora:pa%24s@");
  });
});
