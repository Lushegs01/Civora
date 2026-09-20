import { prisma } from "@/lib/db/prisma";
import { appMode, configurationWarnings, demoToolsEnabled } from "@/lib/config";
import { storageDriver } from "@/lib/storage";
import { providerName } from "@/lib/ai/provider";
import { ok } from "@/lib/api/respond";
import { readiness, SCHEMA_MISSING_WARNING } from "@/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Operational readiness.
 *
 * Reports what the deployment can actually do, so a misconfiguration is
 * visible rather than discovered by a reporter whose evidence upload failed.
 * It names no secrets and no hostnames.
 */
export async function GET() {
  let database = false;
  let schema = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
    // A catalog lookup rather than a count: this says whether migrations have
    // run without reading a single row of anyone's data.
    const rows = await prisma.$queryRaw<{ present: boolean }[]>`
      SELECT to_regclass('public."Case"') IS NOT NULL AS present
    `;
    schema = rows[0]?.present === true;
  } catch {
    // Whatever failed, the deployment cannot serve; both flags stay false.
  }

  const driver = storageDriver();
  const warnings = configurationWarnings();
  if (database && !schema) warnings.push(SCHEMA_MISSING_WARNING);

  const { status, httpStatus } = readiness({ database, schema, warnings });

  return ok(
    {
      status,
      mode: appMode,
      demoTools: demoToolsEnabled,
      database,
      schema,
      evidenceStorage: driver ? { driver: driver.name, durable: driver.durable } : null,
      ai: providerName(),
      warnings
    },
    httpStatus
  );
}
