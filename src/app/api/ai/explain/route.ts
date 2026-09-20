import type { NextRequest } from "next/server";
import { aiTextSchema } from "@/lib/validation/schemas";
import { explainText } from "@/lib/ai/language";
import {
  clientIp,
  enforceRateLimit,
  ok,
  readJson,
  requireSameOrigin,
  serverError
} from "@/lib/api/respond";
import { consumeDailyQuota, RATE_LIMITS } from "@/lib/rate-limit";
import { ai, aiLive } from "@/lib/config";
import { providerName } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Rewrites civic text in plain language. Advisory; the source stays authoritative. */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.aiExplain,
    identity: clientIp(req),
    message: "You've asked for several plain-language summaries. Please wait a few minutes."
  });
  if (limited) return limited;

  // 8 KB is ample for a civic explanation and keeps a single request from
  // consuming a large slice of the provider budget.
  const body = await readJson(req, aiTextSchema, { maxBytes: 8 * 1024 });
  if (!body.ok) return body.response;

  try {
    if (aiLive && !(await consumeDailyQuota("ai", ai.dailyQuota))) {
      return ok({
        status: "unavailable",
        sourceText: body.data.text,
        provider: providerName(),
        notice: "The AI assistant's daily limit for this deployment has been reached. The original text is shown unchanged."
      });
    }
    return ok(await explainText(body.data.text, body.data.locale));
  } catch (error) {
    return serverError("ai.explain_failed", error, "That explanation couldn't be prepared right now.");
  }
}
