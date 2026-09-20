import { prisma } from "@/lib/db/prisma";
import { appMode, configurationWarnings, demoToolsEnabled } from "@/lib/config";
import { storageDriver } from "@/lib/storage";
import { providerName } from "@/lib/ai/provider";
import { ok } from "@/lib/api/respond";

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
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const driver = storageDriver();
  const warnings = configurationWarnings();

  return ok(
    {
      status: database && warnings.length === 0 ? "ok" : database ? "degraded" : "unavailable",
      mode: appMode,
      demoTools: demoToolsEnabled,
      database,
      evidenceStorage: driver ? { driver: driver.name, durable: driver.durable } : null,
      ai: providerName(),
      warnings
    },
    database ? 200 : 503
  );
}
