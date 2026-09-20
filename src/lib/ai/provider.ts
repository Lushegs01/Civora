import { ai, aiLive } from "../config";
import { log } from "../log";

// One place talks to the model provider.
//
// Every call is bounded: input length, wall-clock timeout, and a daily quota
// enforced by the caller. Failures degrade to a clearly labelled non-AI
// result rather than an error page or, worse, a fabricated one.

export interface ChatOptions {
  system: string;
  user: string;
  json?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
}

export type ChatResult =
  | { ok: true; content: string }
  | { ok: false; reason: "not_configured" | "timeout" | "provider_error" | "empty" };

export function providerName(): "mock" | "openai" {
  return aiLive ? "openai" : "mock";
}

export async function chat(options: ChatOptions): Promise<ChatResult> {
  if (!aiLive) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ai.timeoutMs);
  try {
    const res = await fetch(`${ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ai.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: ai.model,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user.slice(0, ai.maxInputChars) }
        ],
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
        max_tokens: options.maxOutputTokens ?? 700,
        temperature: options.temperature ?? 0.2
      })
    });

    if (!res.ok) {
      // Status only — a provider error body can echo the prompt back.
      log.warn("ai.provider_error", { status: res.status });
      return { ok: false, reason: "provider_error" };
    }
    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      return { ok: false, reason: "empty" };
    }
    return { ok: true, content: content.trim() };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    log.warn(aborted ? "ai.timeout" : "ai.request_failed", { error });
    return { ok: false, reason: aborted ? "timeout" : "provider_error" };
  } finally {
    clearTimeout(timer);
  }
}

/** Parses model JSON without trusting it. Returns null on anything unexpected. */
export function parseJsonObject(content: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(content);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}
