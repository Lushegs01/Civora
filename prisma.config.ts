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

/**
 * Neon serves both endpoints from one hostname bar an infix:
 * `ep-foo-pooler.region.neon.tech` pools, `ep-foo.region.neon.tech` does not.
 * A project connected through the Neon integration can end up with only the
 * pooled URL injected, and then there is no direct endpoint to find under any
 * variable name — migrations fail on the advisory lock with nothing in the
 * environment to fix it.
 *
 * Dropping the infix reaches the direct endpoint. This is a guess and is
 * scoped like one: Neon hostnames only, and only once every configured
 * candidate has turned out to be pooled. A wrong guess fails exactly where
 * the pooled URL already fails, so it costs nothing to try. Setting
 * DATABASE_URL_UNPOOLED or DIRECT_URL explicitly is better and skips it.
 */
function deriveNeonDirect(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".neon.tech")) return null;
    if (!parsed.hostname.includes("-pooler.")) return null;
    parsed.hostname = parsed.hostname.replace("-pooler.", ".");
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return null;
  }
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

  // A direct endpoint someone configured beats anything inferred.
  const configured = candidates.find((url) => !isPooled(url));
  if (configured) return configured;

  for (const url of candidates) {
    const derived = deriveNeonDirect(url);
    if (derived) return derived;
  }

  // Everything is pooled and nothing could be derived. Hand back the pooled
  // URL so migrate fails loudly, rather than skipping migrations and serving
  // an unmigrated database.
  return candidates[0] ?? "";
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
