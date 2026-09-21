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
// and CIVORA_IMPORT_ON_BUILD loads civic information files on top of it, for
// a hosted demo whose database cannot be reached from a laptop. Both are
// deliberate, temporary switches: see the blocks guarded by them below.

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
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

/** Host only — a connection string carries the password. */
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "an unparseable connection string";
  }
}

run("npx", ["prisma", "generate"]);

if (databaseUrl) {
  // Named because the failure this most often hits — P1002, a timeout
  // acquiring pg_advisory_lock — is diagnosed from the host: a pooled
  // endpoint cannot hold the session lock that `migrate deploy` needs.
  // prisma.config.ts picks the connection; this is what it picked.
  console.log(`Applying database migrations against ${hostOf(databaseUrl)}.`);
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn(
    "No database connection string found — skipping migrations. " +
      "Connect a Postgres store, or set DATABASE_URL, then redeploy. " +
      "The deployed app will report this at /api/health."
  );
}

// Seeding and importing from the build are the escape hatch for a deployment
// whose database is not reachable from a developer's machine — which, between
// IP allow-lists, corporate proxies and a laptop that has never had `vercel`
// installed, is common enough to be worth a supported path rather than a
// workaround. Both stay off unless asked for.
//
// A failure here stops the build deliberately. Vercel keeps the previous
// deployment serving, so the visible result is a red build rather than a site
// that quietly went up without the data it was redeployed to load.

/**
 * Whether a build-time write to the database should be refused here.
 *
 * A connected Vercel store injects the same connection string into preview
 * builds as into production, so a preview that writes to "its own" database in
 * fact writes to production's. Adding a variable in the dashboard applies it to
 * every environment unless told otherwise, which makes that the easy mistake
 * rather than an unlikely one — so the environment is checked here instead of
 * trusting the variable to have been scoped correctly.
 *
 * Skipped rather than fatal: the preview build itself is sound, only the write
 * was misdirected, and failing it would redden every pull request.
 */
function refuseBuildWrite(variable) {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    console.warn(
      `${variable} is set on a ${vercelEnv} deployment — refusing to write. ` +
        "Preview and development builds usually receive the production " +
        "database's connection string, so writing here would change production " +
        "data. Scope the variable to the production environment only."
    );
    return true;
  }
  if (!databaseUrl) {
    console.error(
      `${variable} is set but no database connection string was found. ` +
        "Connect a Postgres store, or unset the variable."
    );
    process.exit(1);
  }
  return false;
}

if (bool(process.env.CIVORA_SEED_ON_BUILD) && !refuseBuildWrite("CIVORA_SEED_ON_BUILD")) {
  console.warn(
    "CIVORA_SEED_ON_BUILD is set: replacing the database contents with the " +
      "fictional demo corpus. Every existing case, report and evidence record " +
      "is deleted first. Remove this variable once the seed has run — while it " +
      "is set, every redeploy repeats the wipe."
  );
  // `--yes` is the seed script's own guard against wiping a database that is
  // not local. Setting the variable in the dashboard *is* the confirmation;
  // there is no terminal here to give a second one at.
  run("npx", ["tsx", "prisma/seed.ts", "--yes"]);
}

// Loads civic corpora after the seed, because the seed deletes every civic
// item before it writes: the order matters and is not the operator's to
// remember. Takes a comma-separated list of JSON files, relative to the
// repository root.
//
// Unlike the seed this is an upsert — it adds and corrects the items the files
// name and touches nothing else — so leaving the variable set is not
// destructive, only repetitive. It would, though, restore an item somebody
// deliberately deleted, so it is still better removed once it has run.
const importOnBuild = (process.env.CIVORA_IMPORT_ON_BUILD ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0);

if (importOnBuild.length > 0 && !refuseBuildWrite("CIVORA_IMPORT_ON_BUILD")) {
  for (const file of importOnBuild) {
    console.warn(`CIVORA_IMPORT_ON_BUILD is set: importing civic items from ${file}.`);
    run("npx", ["tsx", "scripts/import-civic.ts", file]);
  }
}

run("npx", ["next", "build"]);
