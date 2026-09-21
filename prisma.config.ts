import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 reads connection URLs from here rather than from schema.prisma.
//
// `migrate deploy` takes a session-scoped PostgreSQL advisory lock, and a
// transaction pooler cannot hold one: the lock never lands, and the migration
// fails with P1002 after timing out on pg_advisory_lock. So migrations need a
// direct connection even though the running app should keep using the pooled
// one. Each provider names its direct URL differently, and picking by name
// alone is fragile — a DIRECT_URL set by hand to the pooled string looks
// right and fails the same way. So the host decides, and the names only
// order the search.

/** A pooled endpoint, whichever variable it arrived in. */
function isPooled(url: string): boolean {
  return /[-.]pooler\.|pgbouncer=true/.test(url);
}

export function selectMigrationUrl(env: Record<string, string | undefined> = process.env): string {
  const candidates = [
    env.DIRECT_URL,
    env.POSTGRES_URL_NON_POOLING, // Vercel Postgres
    env.DATABASE_URL_UNPOOLED, // Neon
    env.DATABASE_URL,
    env.POSTGRES_URL
  ]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  // Prefer any direct endpoint over the first-named one.
  return candidates.find((url) => !isPooled(url)) ?? candidates[0] ?? "";
}

const migrationUrl = selectMigrationUrl();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: migrationUrl
  }
});
