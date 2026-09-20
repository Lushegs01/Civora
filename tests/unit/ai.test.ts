import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { caseSummarySchema, deterministicSummary } from "@/lib/ai/summary";
import type { PublicCaseView } from "@/lib/dto/case";

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
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual(["en", "fr", "sw"]);

    for (const locale of ["sw", "fr"] as const) {
      const result = await translateText("Some civic text to translate.", locale);
      expect(result.notice.length).toBeGreaterThan(10);
      expect(result.notice).not.toMatch(/^Machine translation is not enabled/);
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
