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

import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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

run("npx", ["next", "build"]);
