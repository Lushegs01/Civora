import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseUrl, isProduction } from "../config";

// Safe singleton for Next.js. In development the module graph is re-evaluated
// on every hot reload, which would otherwise open a new pool per reload until
// PostgreSQL refuses connections.

declare global {
  // eslint-disable-next-line no-var
  var __civoraPrisma: PrismaClient | undefined;
}

function create(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl(),
    // Serverless platforms recycle instances aggressively; a small pool with a
    // short idle timeout avoids holding connections a dead instance owns.
    max: Number.parseInt(process.env.DATABASE_POOL_MAX || "", 10) || (isProduction ? 5 : 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });
  return new PrismaClient({
    adapter,
    log: isProduction ? ["warn", "error"] : ["warn", "error"]
  });
}

export const prisma: PrismaClient = globalThis.__civoraPrisma ?? create();

if (!isProduction) globalThis.__civoraPrisma = prisma;

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
