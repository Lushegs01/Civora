import type { NextRequest } from "next/server";
import { aiTranslateSchema } from "@/lib/validation/schemas";
import { LANGUAGE_NAMES, translateText } from "@/lib/ai/language";
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

/**
 * Machine translation.
 *
 * When no provider is configured this returns `status: "unavailable"` with the
 * original text and an explanation in the reader's language. It never returns
 * altered or untranslated text presented as a translation.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.aiTranslate,
    identity: clientIp(req),
    message: "You've requested several translations. Please wait a few minutes."
  });
  if (limited) return limited;

  const body = await readJson(req, aiTranslateSchema, { maxBytes: 16 * 1024 });
  if (!body.ok) return body.response;

  try {
    if (aiLive && !(await consumeDailyQuota("ai", ai.dailyQuota))) {
      return ok({
        status: "unavailable",
        sourceText: body.data.text,
        targetLanguage: LANGUAGE_NAMES[body.data.locale],
        provider: providerName(),
        notice: "The translation service's daily limit for this deployment has been reached. The original text is shown unchanged."
      });
    }
    return ok(await translateText(body.data.text, body.data.locale));
  } catch (error) {
    return serverError("ai.translate_failed", error, "That translation couldn't be prepared right now.");
  }
}
