import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// What the Vercel build is allowed to do to the database.
//
// `vercel-build.mjs` can seed and import, which means it can delete. The guard
// that matters is the environment check: a connected Vercel store hands
// preview builds the *production* connection string, so a variable added in
// the dashboard without scoping it — the default — would have every pull
// request wipe the live demo. That guard had no test, so this runs the real
// script with `npx` replaced by a recorder and asserts what it tried to run.

const RUNNABLE = process.platform !== "win32";
const root = process.cwd();
let bin: string;
let log: string;

beforeAll(() => {
  if (!RUNNABLE) return;
  bin = fs.mkdtempSync(path.join(os.tmpdir(), "civora-build-"));
  log = path.join(bin, "calls.log");
  const fake = path.join(bin, "npx");
  fs.writeFileSync(fake, `#!/bin/sh\necho "$@" >> "${log}"\nexit 0\n`);
  fs.chmodSync(fake, 0o755);
});

afterAll(() => {
  if (RUNNABLE) fs.rmSync(bin, { recursive: true, force: true });
});

/** Runs the build script and returns the `npx` invocations it made. */
function build(env: Record<string, string>): { calls: string[]; stderr: string; status: number | null } {
  fs.writeFileSync(log, "");
  const result = spawnSync(process.execPath, ["scripts/vercel-build.mjs"], {
    cwd: root,
    encoding: "utf-8",
    // A deliberately minimal environment: the script must not pick up a
    // connection string from the developer's own shell and write to it.
    env: {
      NODE_ENV: "production",
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
      HOME: os.homedir(),
      ...env
    } as NodeJS.ProcessEnv
  });
  const calls = fs.readFileSync(log, "utf-8").split("\n").filter(Boolean);
  return { calls, stderr: `${result.stderr}`, status: result.status };
}

const DB = { DATABASE_URL: "postgres://u:p@db.example.com/civora" };

describe.skipIf(!RUNNABLE)("vercel-build", () => {
  it("builds, and touches no data, when nothing asks it to", () => {
    const { calls } = build(DB);
    expect(calls).toEqual(["prisma generate", "prisma migrate deploy", "next build"]);
  });

  it("still builds with no database, rather than failing the deploy", () => {
    const { calls, status } = build({});
    expect(status).toBe(0);
    expect(calls).toEqual(["prisma generate", "next build"]);
  });

  it("seeds on a production deployment, and passes the seed's own --yes", () => {
    // Without --yes the seed script refuses a non-local database, which would
    // turn this escape hatch into a red build. Setting the variable in the
    // dashboard is the confirmation; there is no terminal here to give another.
    const { calls } = build({ ...DB, VERCEL_ENV: "production", CIVORA_SEED_ON_BUILD: "true" });
    expect(calls).toContain("tsx prisma/seed.ts --yes");
  });

  it("refuses to seed a preview, which holds production's connection string", () => {
    const { calls, stderr, status } = build({ ...DB, VERCEL_ENV: "preview", CIVORA_SEED_ON_BUILD: "true" });
    expect(calls.some((c) => c.includes("seed"))).toBe(false);
    expect(stderr).toContain("refusing to write");
    // Skipped, not fatal: the preview build itself is sound.
    expect(status).toBe(0);
    expect(calls).toContain("next build");
  });

  it("refuses to import on a preview for the same reason", () => {
    const { calls, stderr } = build({
      ...DB,
      VERCEL_ENV: "preview",
      CIVORA_IMPORT_ON_BUILD: "examples/civic-ghana.json"
    });
    expect(calls.some((c) => c.includes("import-civic"))).toBe(false);
    expect(stderr).toContain("refusing to write");
  });

  it("imports after seeding, because the seed deletes every civic item first", () => {
    const { calls } = build({
      ...DB,
      VERCEL_ENV: "production",
      CIVORA_SEED_ON_BUILD: "true",
      CIVORA_IMPORT_ON_BUILD: "examples/civic-ghana.json"
    });
    const seed = calls.findIndex((c) => c.includes("seed.ts"));
    const importAt = calls.findIndex((c) => c.includes("import-civic.ts"));
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(importAt).toBeGreaterThan(seed);
    expect(calls[calls.length - 1]).toBe("next build");
  });

  it("imports several files, in the order given", () => {
    const { calls } = build({
      ...DB,
      VERCEL_ENV: "production",
      CIVORA_IMPORT_ON_BUILD: " examples/civic-ghana.json , examples/other.json "
    });
    expect(calls).toContain("tsx scripts/import-civic.ts examples/civic-ghana.json");
    expect(calls).toContain("tsx scripts/import-civic.ts examples/other.json");
  });

  it("fails the build when asked to write with no database, rather than deploying without the data", () => {
    const { status, stderr } = build({ VERCEL_ENV: "production", CIVORA_SEED_ON_BUILD: "true" });
    expect(status).toBe(1);
    expect(stderr).toContain("no database connection string");
  });
});
