import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { caseSummarySchema, deterministicSummary } from "@/lib/ai/summary";
import type { PublicCaseView } from "@/lib/dto/case";
import { LOCALES } from "@/lib/validation/schemas";

function view(over: Partial<PublicCaseView> = {}): PublicCaseView {
  return {
    role: "public",
    id: "CS-1042",
    title: "Safety concern reported",
    summary: "A safety concern has been reported and is being reviewed.",
    category: "safety",
    incidentAt: new Date().toISOString(),
    verification: "unverified",
    response: "received",
    priority: "urgent",
    publicationState: "public_case",
    publicationLabel: "Public",
    publicationDescription: "Listed publicly.",
    privacyMode: "anonymous",
    disputePathway: false,
    awaitingReporter: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    known: ["One report has been received."],
    uncertain: ["Nothing has been independently confirmed."],
    evidence: [],
    events: [],
    updates: [],
    progress: [],
    counts: { reports: 1, evidence: 0, updates: 0, photos: 0, confirmedLinks: 0 },
    resolved: false,
    ...over
  };
}

describe("AI summary schema", () => {
  it("accepts a well-formed response", () => {
    const parsed = caseSummarySchema.safeParse({
      overview: "Two reports describe the same fault.",
      known: ["A photo is on file."],
      uncertain: ["The cause is unknown."],
      conflicts: [],
      sourcesUsed: ["ev-1"]
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a response with the wrong shape", () => {
    expect(caseSummarySchema.safeParse({ overview: 42 }).success).toBe(false);
    expect(caseSummarySchema.safeParse({ overview: "ok", known: "not an array" }).success).toBe(false);
    expect(caseSummarySchema.safeParse(null).success).toBe(false);
    expect(caseSummarySchema.safeParse({}).success).toBe(false);
  });

  it("bounds the size of what it will render", () => {
    expect(caseSummarySchema.safeParse({ overview: "x".repeat(3000) }).success).toBe(false);
    expect(
      caseSummarySchema.safeParse({ overview: "ok", known: Array.from({ length: 50 }, () => "x") }).success
    ).toBe(false);
  });
});

describe("summary without a provider", () => {
  it("produces an honest deterministic summary rather than nothing", () => {
    const summary = deterministicSummary(view());
    expect(summary.overview).toContain("1 report describes");
    expect(summary.known).toEqual(["One report has been received."]);
  });

  it("describes confirmed corroboration only when a person confirmed it", () => {
    const withLinks = deterministicSummary(view({ counts: { reports: 1, evidence: 0, updates: 0, photos: 0, confirmedLinks: 2 } }));
    expect(withLinks.overview).toMatch(/confirmed by a case handler/i);

    const withoutLinks = deterministicSummary(view());
    expect(withoutLinks.overview).not.toMatch(/corroborat/i);
  });
});

describe("summarizeCase without a configured provider", () => {
  it("never claims the text was AI-generated", async () => {
    vi.resetModules();
    process.env.AI_PROVIDER = "mock";
    delete process.env.OPENAI_API_KEY;
    const { summarizeCase } = await import("@/lib/ai/summary");

    const result = await summarizeCase(view());
    expect(result.aiGenerated).toBe(false);
    expect(result.provider).toBe("mock");
    expect(result.disclaimer).toMatch(/not an official finding/i);
    expect(result.disclaimer).toMatch(/does not change the verification state/i);
  });
});

describe("translation honesty", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AI_PROVIDER = "mock";
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says translation is unavailable rather than inventing one", async () => {
    const { translateText } = await import("@/lib/ai/language");
    const source = "Public areas must have properly insulated electrical fittings.";
    const result = await translateText(source, "sw");

    expect(result.status).toBe("unavailable");
    expect(result.text).toBeUndefined();
    // The original is returned untouched, and labelled as the original.
    expect(result.sourceText).toBe(source);
    expect(result.targetLanguage).toBe("Swahili");
    // The explanation is in the reader's language, not English.
    expect(result.notice).toMatch(/Tafsiri ya mashine/);
  });

  it("supports every locale the interface offers", async () => {
    const { LANGUAGE_NAMES, translateText } = await import("@/lib/ai/language");
    // Derived from LOCALES rather than listed: Arabic was added and this
    // assertion should fail loudly if a language reaches the switcher without
    // its translation notices, not be quietly left behind.
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LOCALES].sort());

    for (const locale of LOCALES.filter((l) => l !== "en")) {
      const result = await translateText("Some civic text to translate.", locale);
      expect(result.notice.length, locale).toBeGreaterThan(10);
      // The notice is in the reader's own language, never an English default.
      expect(result.notice, locale).not.toMatch(/^Machine translation is not enabled/);
    }
  });

  it("does not pretend English needs translating into English", async () => {
    const { translateText } = await import("@/lib/ai/language");
    const result = await translateText("Already English.", "en");
    expect(result.status).toBe("source_language");
  });

  it("refuses to pass an unchanged echo off as a translation", async () => {
    vi.resetModules();
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    const source = "Water outages lasting more than 48 hours require alternative supply.";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: source } }] }), { status: 200 })
      )
    );

    const { translateText } = await import("@/lib/ai/language");
    const result = await translateText(source, "fr");
    expect(result.status).toBe("unavailable");
    expect(result.text).toBeUndefined();

    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = "mock";
  });
});

describe("provider selection", () => {
  const AI_VARS = ["AI_PROVIDER", "OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_MODEL", "AI_BASE_URL"];

  beforeEach(() => {
    vi.resetModules();
    for (const name of AI_VARS) delete process.env[name];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const name of AI_VARS) delete process.env[name];
    process.env.AI_PROVIDER = "mock";
  });

  /** Captures the single outbound request the provider makes. */
  function captureFetch(body: unknown = { choices: [{ message: { content: "ok" } }] }) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );
    return calls;
  }

  it("stays mock when a provider is named but no key is set", async () => {
    process.env.AI_PROVIDER = "gemini";
    const { providerName } = await import("@/lib/ai/provider");
    expect(providerName()).toBe("mock");
  });

  it("stays mock for a provider it does not know, whatever key is present", async () => {
    process.env.AI_PROVIDER = "definitely-not-a-provider";
    process.env.GEMINI_API_KEY = "k";
    const { providerName } = await import("@/lib/ai/provider");
    expect(providerName()).toBe("mock");
  });

  it("names the live provider, so a summary is attributable", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "k";
    const { providerName } = await import("@/lib/ai/provider");
    expect(providerName()).toBe("gemini");
  });

  it("accepts GOOGLE_API_KEY, which is what Google's own tooling exports", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GOOGLE_API_KEY = "k";
    const { providerName } = await import("@/lib/ai/provider");
    expect(providerName()).toBe("gemini");
  });

  it("sends a Gemini call to Gemini's OpenAI-compatible endpoint", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    const calls = captureFetch();

    const { chat } = await import("@/lib/ai/provider");
    const result = await chat({ system: "s", user: "u" });

    expect(result).toEqual({ ok: true, content: "ok" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    );
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(String(calls[0].init.body)).model).toBe("gemini-2.5-flash");
  });

  it("still sends an OpenAI call to OpenAI", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    const calls = captureFetch();

    const { chat } = await import("@/lib/ai/provider");
    await chat({ system: "s", user: "u" });

    expect(calls[0].url).toBe("https://api.openai.com/v1/chat/completions");
    expect(JSON.parse(String(calls[0].init.body)).model).toBe("gpt-4o-mini");
  });

  it("lets AI_MODEL and AI_BASE_URL override either provider", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "k";
    process.env.AI_MODEL = "gemini-2.0-flash";
    process.env.AI_BASE_URL = "https://gateway.example/v1";
    const calls = captureFetch();

    const { chat } = await import("@/lib/ai/provider");
    await chat({ system: "s", user: "u" });

    expect(calls[0].url).toBe("https://gateway.example/v1/chat/completions");
    expect(JSON.parse(String(calls[0].init.body)).model).toBe("gemini-2.0-flash");
  });

  it("names the missing key variable instead of failing silently", async () => {
    // Warnings are production-only, and NODE_ENV is read-only to TypeScript —
    // stubEnv is how the rest of the suite reaches it.
    vi.stubEnv("NODE_ENV", "production");
    process.env.AI_PROVIDER = "gemini";
    const { configurationWarnings } = await import("@/lib/config");
    const warning = configurationWarnings().find((w) => w.includes("AI_PROVIDER"));
    expect(warning).toMatch(/GEMINI_API_KEY or GOOGLE_API_KEY/);
    vi.unstubAllEnvs();
  });

  it("names an unrecognized provider rather than quietly running mock", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AI_PROVIDER = "claude";
    const { configurationWarnings } = await import("@/lib/config");
    const warning = configurationWarnings().find((w) => w.includes("AI_PROVIDER"));
    expect(warning).toMatch(/not a provider Civora knows/);
    expect(warning).toMatch(/openai or gemini/);
    vi.unstubAllEnvs();
  });
});

describe("reading what a model actually returns", () => {
  it("accepts JSON wrapped in a markdown fence", async () => {
    const { parseJsonObject } = await import("@/lib/ai/provider");
    // Models asked for JSON return it fenced anyway; Gemini does so often.
    expect(parseJsonObject('```json\n{"overview":"ok"}\n```')).toEqual({ overview: "ok" });
    expect(parseJsonObject('```\n{"overview":"ok"}\n```')).toEqual({ overview: "ok" });
    expect(parseJsonObject('{"overview":"ok"}')).toEqual({ overview: "ok" });
  });

  it("still refuses anything that is not a JSON object", async () => {
    const { parseJsonObject } = await import("@/lib/ai/provider");
    expect(parseJsonObject("```json\nnot json\n```")).toBeNull();
    expect(parseJsonObject('["an","array"]')).toBeNull();
    expect(parseJsonObject("null")).toBeNull();
    expect(parseJsonObject("plain prose")).toBeNull();
  });
});

describe("AI cannot change trust state", () => {
  it("exposes no write surface at all", async () => {
    const summary = await import("@/lib/ai/summary");
    const language = await import("@/lib/ai/language");
    const provider = await import("@/lib/ai/provider");

    const exported = [
      ...Object.keys(summary),
      ...Object.keys(language),
      ...Object.keys(provider)
    ].join(" ");
    for (const forbidden of ["verify", "resolve", "assign", "close", "publish", "update"]) {
      expect(exported.toLowerCase()).not.toContain(forbidden);
    }
  });
});
