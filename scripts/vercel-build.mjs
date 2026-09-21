// Build entrypoint for Vercel.
//
// Vercel runs `vercel-build` in preference to `build`, which lets the hosted
// build apply migrations while leaving the plain `build` script — used locally
// and in CI — free of any database dependency.
//
// Migrations run only when a connection string is actually present. A preview
// from a fork, or a project whose database is not connected yet, still builds
// and deploys; it just reports its missing configuration through /api/health
// instead of failing the build with a connection error.
//
// Setting CIVORA_SEED_ON_BUILD additionally loads the fictional demo corpus,
// for a hosted demo whose database cannot be reached from a laptop. It is a
// deliberate, temporary switch: see the block guarded by it below.

import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function bool(value, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

const databaseUrl =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

run("npx", ["prisma", "generate"]);

if (databaseUrl) {
  console.log("Applying database migrations.");
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn(
    "No database connection string found — skipping migrations. " +
      "Connect a Postgres store, or set DATABASE_URL, then redeploy. " +
      "The deployed app will report this at /api/health."
  );
}

// Seeding from the build is the escape hatch for a deployment whose database
// is not reachable from a developer's machine. It stays off unless asked for,
// because the seed deletes every case before it writes: leave the variable set
// and the next deploy discards whatever has been reported in the meantime.
//
// A failure here stops the build deliberately. Vercel keeps the previous
// deployment serving, so the visible result is a red build rather than a site
// that quietly went up without the data it was redeployed to load.
if (bool(process.env.CIVORA_SEED_ON_BUILD)) {
  if (!databaseUrl) {
    console.error(
      "CIVORA_SEED_ON_BUILD is set but no database connection string was found. " +
        "Connect a Postgres store, or unset the variable."
    );
    process.exit(1);
  }
  console.warn(
    "CIVORA_SEED_ON_BUILD is set: replacing the database contents with the " +
      "fictional demo corpus. Every existing case, report and evidence record " +
      "is deleted first. Remove this variable once the seed has run — while it " +
      "is set, every redeploy repeats the wipe."
  );
  run("npx", ["tsx", "prisma/seed.ts"]);
}

run("npx", ["next", "build"]);
