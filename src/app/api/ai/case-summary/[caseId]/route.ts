import type { NextRequest } from "next/server";
import { findCaseByPublicId } from "@/lib/db/repository";
import { toPublicCaseView } from "@/lib/dto/case";
import { deterministicSummary, summarizeCase } from "@/lib/ai/summary";
import { clientIp, enforceRateLimit, fail, ok, serverError } from "@/lib/api/respond";
import { consumeDailyQuota, RATE_LIMITS } from "@/lib/rate-limit";
import { ai, aiLive } from "@/lib/config";
import { providerName } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * AI-assisted summary of a case's public evidence.
 *
 * Read-only by construction: it loads the public view and returns text. It
 * cannot change verification, response, assignment or publication, and the
 * model only ever sees what a citizen could already read.
 */
export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.aiSummary,
    identity: clientIp(req),
    message: "Too many summary requests. Please wait a moment and try again."
  });
  if (limited) return limited;

  try {
    const caseRecord = await findCaseByPublicId(params.caseId);
    if (!caseRecord || !caseRecord.publicVisible) {
      return fail("Case not found.", { status: 404 });
    }
    const view = toPublicCaseView(caseRecord);

    // A deployment-wide daily ceiling on live calls, so a public endpoint
    // cannot run up an unbounded provider bill.
    if (aiLive && !(await consumeDailyQuota("ai", ai.dailyQuota))) {
      return ok({
        ...deterministicSummary(view),
        provider: providerName(),
        aiGenerated: false,
        generatedAt: new Date().toISOString(),
        disclaimer:
          "This summary was produced by Civora's built-in analyzer. The AI assistant's daily limit for this deployment has been reached."
      });
    }

    return ok(await summarizeCase(view));
  } catch (error) {
    return serverError("ai.summary_failed", error, "The summary couldn't be prepared right now.");
  }
}
