import type { CaseRecord, CaseUpdate, EvidenceRecord } from "../types";
import { truncate } from "../utils";

// AI abstraction. Civora treats AI as an assistant to analysis and
// communication — never an authority (Product Rule 2). The mock provider is a
// deterministic analyzer over structured case data; setting AI_PROVIDER=openai
// routes the same prompt contract to a real model. Output is always labelled
// "AI-assisted summary" and must stay subordinate to the evidence.

export interface CaseSummary {
  overview: string;
  known: string[];
  uncertain: string[];
  conflicts: string[];
  sourcesUsed: string[]; // evidence ids referenced
  provider: "mock" | "openai";
  generatedAt: string;
}

export interface SummaryInput {
  caseRecord: Pick<CaseRecord, "id" | "title" | "category" | "description" | "verification" | "known" | "uncertain">;
  evidence: EvidenceRecord[];
  updates: CaseUpdate[];
  reportCount: number;
}

export interface SummaryProvider {
  name: "mock" | "openai";
  summarize(input: SummaryInput): Promise<CaseSummary>;
}

const mockProvider: SummaryProvider = {
  name: "mock",
  async summarize(input) {
    const { caseRecord: c, evidence, updates, reportCount } = input;
    const known = [...c.known];
    const uncertain = [...c.uncertain];
    const conflicts: string[] = [];
    const sourcesUsed: string[] = [];

    const corroborating = evidence.filter((e) => e.sourceType === "corroborating").length;
    const official = evidence.filter((e) => e.sourceType === "official").length;
    const docs = evidence.filter((e) => e.kind === "document").length;

    const sentences: string[] = [];
    sentences.push(
      `${reportCount} report${reportCount === 1 ? "" : "s"} describe${reportCount === 1 ? "s" : ""} a ${c.category === "other" ? "civic matter" : c.category + " issue"}${c.known.length ? "" : ""}.`
    );
    if (corroborating > 0) sentences.push(`Independent corroborating material is on file (${corroborating} item${corroborating === 1 ? "" : "s"}).`);
    if (official > 0) sentences.push(`Official documentation from the responding organization is included.`);
    if (docs > 0) sentences.push(`${docs} document${docs === 1 ? "" : "s"} are part of the evidence chain.`);
    if (updates.length > 0) sentences.push(`The latest official update is: “${truncate(updates[0].body, 160)}”`);

    // Conflict detection: doc-style evidence whose relationship disagrees.
    const docEvidence = evidence.filter((e) => e.kind === "document" || e.kind === "official");
    for (const e of docEvidence) {
      if (/disagree|conflict|differs|not delivered|not yet/i.test(e.relationship + " " + (e.excerpt || ""))) {
        conflicts.push(`“${e.title}” appears to disagree with other records. The discrepancy is documented, not judged.`);
        sourcesUsed.push(e.id);
      }
    }
    if (c.verification === "conflicting" && conflicts.length === 0) {
      conflicts.push("Sources on file materially disagree. The discrepancy is documented, not judged.");
    }

    for (const e of evidence) {
      if (e.publicVisible && (sourcesUsed.length < 6 || e.sourceType === "primary")) sourcesUsed.push(e.id);
    }

    const overview = sentences.join(" ") +
      " This is an AI-assisted reading of the evidence on file. It is not an official finding and does not judge anyone's truthfulness.";

    return {
      overview,
      known,
      uncertain,
      conflicts,
      sourcesUsed: Array.from(new Set(sourcesUsed)).slice(0, 6),
      provider: "mock",
      generatedAt: new Date().toISOString()
    };
  }
};

// Placeholder for a real provider — same contract, swapped via env config.
// Implementation intentionally fails soft back to the mock provider.
const openaiProvider: SummaryProvider = {
  name: "openai",
  async summarize(input) {
    try {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("no key");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You summarize civic case evidence for a public transparency product. Be strictly neutral. Never decide guilt or truth. Return JSON with keys: overview, known[], uncertain[], conflicts[], sourcesUsed[]."
            },
            { role: "user", content: JSON.stringify({ ...input, evidence: input.evidence.map((e) => ({ id: e.id, title: e.title, excerpt: e.excerpt, sourceType: e.sourceType })) }) }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });
      if (!res.ok) throw new Error("upstream error");
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return {
        overview: String(parsed.overview || ""),
        known: (parsed.known || []).map(String),
        uncertain: (parsed.uncertain || []).map(String),
        conflicts: (parsed.conflicts || []).map(String),
        sourcesUsed: (parsed.sourcesUsed || []).map(String).slice(0, 6),
        provider: "openai",
        generatedAt: new Date().toISOString()
      };
    } catch {
      return mockProvider.summarize(input);
    }
  }
};

export function getSummaryProvider(): SummaryProvider {
  return process.env.AI_PROVIDER === "openai" ? openaiProvider : mockProvider;
}
