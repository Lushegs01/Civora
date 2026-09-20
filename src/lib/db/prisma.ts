import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseUrl, isProduction } from "../config";

// Safe singleton for Next.js.
//
// The client is built on first use rather than on import. Two reasons:
//
//   1. `next build` imports every route module to collect page data. An eager
//      client would make the *build* require a live DATABASE_URL, so a
//      deployment could not be built without one — which is exactly how this
//      broke the first Vercel preview.
//   2. Tests, scripts and lint passes can import anything under src/lib
//      without needing database configuration.
//
// Configuration is still validated the moment a query is actually attempted,
// so a missing URL fails loudly rather than silently connecting to nothing.

declare global {
  // eslint-disable-next-line no-var
  var __civoraPrisma: PrismaClient | undefined;
}

let instance: PrismaClient | undefined;

function create(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl(),
    // Serverless platforms recycle instances aggressively; a small pool with a
    // short idle timeout avoids holding connections a dead instance owns.
    max: Number.parseInt(process.env.DATABASE_POOL_MAX || "", 10) || (isProduction ? 5 : 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });
  return new PrismaClient({ adapter, log: ["warn", "error"] });
}

function client(): PrismaClient {
  if (instance) return instance;
  // In development the module graph is re-evaluated on every hot reload, which
  // would otherwise open a new pool per reload until PostgreSQL refuses.
  instance = globalThis.__civoraPrisma ?? create();
  if (!isProduction) globalThis.__civoraPrisma = instance;
  return instance;
}

/**
 * The application's Prisma client.
 *
 * A proxy so that importing this module has no side effects; the first
 * property access builds the real client. Functions are bound to that client
 * so `$transaction`, `$queryRaw` and the model delegates behave normally.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const target = client() as unknown as Record<string | symbol, unknown>;
    const value = target[property];
    return typeof value === "function" ? value.bind(target) : value;
  },
  has(_target, property) {
    return property in (client() as unknown as object);
  }
});

/** Transaction client type — what repository helpers accept. */
export type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Allocates the next public case number from a PostgreSQL sequence.
 * Concurrency safe by construction: nextval() never returns the same value to
 * two transactions, so simultaneous submissions cannot collide.
 */
export async function allocateCaseNumber(tx: Tx): Promise<{ caseNumber: number; publicCaseId: string }> {
  const rows = await tx.$queryRaw<Array<{ nextval: bigint | number }>>`
    SELECT nextval('civora_case_number_seq') AS nextval
  `;
  const caseNumber = Number(rows[0]?.nextval);
  if (!Number.isFinite(caseNumber)) {
    throw new Error("Could not allocate a case number.");
  }
  return { caseNumber, publicCaseId: `CS-${caseNumber}` };
}
