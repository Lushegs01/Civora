import type { NextRequest } from "next/server";
import { requestActor } from "@/lib/auth/actor";
import { isPlatformAdmin } from "@/lib/authz";
import { demoToolsEnabled, isDemoMode, isProduction } from "@/lib/config";
import {
  clientIp,
  enforceRateLimit,
  fail,
  ok,
  requireSameOrigin,
  serverError
} from "@/lib/api/respond";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Restores the fictional dataset.
 *
 * This deletes every case in the database, so it is behind four gates:
 *   - CIVORA_DEMO_MODE must be on
 *   - ENABLE_DEMO_TOOLS must be on as well
 *   - the caller must be signed in as a platform administrator
 *   - it refuses outright in a production build
 *
 * A deployment that forgets to set the flags simply has no reset endpoint.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  if (!isDemoMode || !demoToolsEnabled || isProduction) {
    // Indistinguishable from a route that does not exist.
    return fail("Not found.", { status: 404 });
  }

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.demoReset,
    identity: clientIp(req),
    message: "The demo dataset was reset recently. Please wait before resetting again."
  });
  if (limited) return limited;

  const actor = await requestActor();
  if (!isPlatformAdmin(actor)) {
    return fail("Only a platform administrator can reset the demo dataset.", {
      status: 403,
      code: "forbidden"
    });
  }

  try {
    // Imported lazily so the demo corpus is never pulled into a production
    // bundle that will never be allowed to use it.
    const { reseedDemoDataset } = await import("@/lib/db/demo-reset");
    const result = await reseedDemoDataset();
    log.warn("demo.dataset_reset", { userId: actor?.userId, cases: result.cases });
    return ok({ ok: true, ...result });
  } catch (error) {
    return serverError("demo.reset_failed", error, "The demo dataset couldn't be reset.");
  }
}
