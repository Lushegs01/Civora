import { z } from "zod";
import type { PublicCaseView } from "../dto/case";
import { chat, parseJsonObject, providerName, type ProviderName } from "./provider";
import { log } from "../log";

// AI-assisted case summary.
//
// Advisory only. It reads the same public evidence a citizen can see, it
// cannot write anything, and its output is validated against a schema before
// it reaches a page. A model that returns something unexpected is discarded in
// favour of the deterministic summary — never rendered raw.

export const caseSummarySchema = z.object({
  overview: z.string().min(1).max(2000),
  known: z.array(z.string().min(1).max(400)).max(8).default([]),
  uncertain: z.array(z.string().min(1).max(400)).max(8).default([]),
  conflicts: z.array(z.string().min(1).max(400)).max(6).default([]),
  sourcesUsed: z.array(z.string().min(1).max(60)).max(6).default([])
});

export type CaseSummaryCore = z.infer<typeof caseSummarySchema>;

export interface CaseSummary extends CaseSummaryCore {
  provider: ProviderName;
  /** True when the text came from a model rather than the built-in analyzer. */
  aiGenerated: boolean;
  generatedAt: string;
  disclaimer: string;
}

const DISCLAIMER =
  "This is an AI-assisted reading of the evidence on file. It is not an official finding, it does not change the verification state, and it does not judge anyone's truthfulness.";

const SYSTEM_PROMPT = [
  "You summarize civic case evidence for a public transparency product.",
  "Be strictly neutral. Never decide guilt, truth or blame.",
  "Never name or describe individuals. Never invent facts that are not in the input.",
  "Return JSON with exactly these keys: overview (string), known (string[]),",
  "uncertain (string[]), conflicts (string[]), sourcesUsed (string[] of evidence ids)."
].join(" ");

/**
 * Deterministic summary over structured data. Used when no model is
 * configured, when the provider fails, and whenever model output fails
 * validation — so the card always shows something honest.
 */
export function deterministicSummary(view: PublicCaseView): CaseSummaryCore {
  const corroborating = view.evidence.filter((e) => e.sourceType === "corroborating").length;
  const official = view.evidence.filter((e) => e.sourceType === "official").length;
  const documents = view.evidence.filter((e) => e.kind === "document").length;

  const sentences: string[] = [];
  const reportWord = view.counts.reports === 1 ? "report describes" : "reports describe";
  sentences.push(
    `${view.counts.reports} ${reportWord} a ${view.category === "other" ? "civic matter" : `${view.category} issue`}.`
  );
  if (view.counts.confirmedLinks > 0) {
    sentences.push(
      `${view.counts.confirmedLinks} related case${view.counts.confirmedLinks === 1 ? " has" : "s have"} been confirmed by a case handler.`
    );
  }
  if (corroborating > 0) {
    sentences.push(`Independent corroborating material is on file (${corroborating} item${corroborating === 1 ? "" : "s"}).`);
  }
  if (official > 0) sentences.push("Official documentation from the responding organization is included.");
  if (documents > 0) sentences.push(`${documents} document${documents === 1 ? " is" : "s are"} part of the evidence chain.`);
  const latest = view.updates[view.updates.length - 1];
  if (latest) sentences.push(`The latest official update is: “${truncate(latest.body, 160)}”`);

  const conflicts: string[] = [];
  for (const e of view.evidence) {
    if (e.kind !== "document" && e.kind !== "official") continue;
    if (/disagree|conflict|differs|not delivered|not yet/i.test(`${e.relationship} ${e.excerpt || ""}`)) {
      conflicts.push(`“${e.title}” appears to disagree with other records. The discrepancy is documented, not judged.`);
    }
  }
  if (view.verification === "conflicting" && conflicts.length === 0) {
    conflicts.push("Sources on file materially disagree. The discrepancy is documented, not judged.");
  }

  return {
    overview: sentences.join(" "),
    known: view.known,
    uncertain: view.uncertain,
    conflicts: conflicts.slice(0, 6),
    sourcesUsed: view.evidence.slice(0, 6).map((e) => e.id)
  };
}

export async function summarizeCase(view: PublicCaseView): Promise<CaseSummary> {
  const fallback = deterministicSummary(view);
  const generatedAt = new Date().toISOString();

  const result = await chat({
    system: SYSTEM_PROMPT,
    json: true,
    user: JSON.stringify({
      caseId: view.id,
      category: view.category,
      verification: view.verification,
      response: view.response,
      // The *public* summary only. The reporter's narrative is never sent to a
      // third-party provider.
      summary: view.summary,
      known: view.known,
      uncertain: view.uncertain,
      reportCount: view.counts.reports,
      evidence: view.evidence.map((e) => ({
        id: e.id,
        title: e.title,
        sourceType: e.sourceType,
        excerpt: e.excerpt,
        relationship: e.relationship
      })),
      updates: view.updates.map((u) => u.body)
    })
  });

  if (!result.ok) {
    return { ...fallback, provider: providerName(), aiGenerated: false, generatedAt, disclaimer: DISCLAIMER };
  }

  const raw = parseJsonObject(result.content);
  const parsed = raw ? caseSummarySchema.safeParse(raw) : null;
  if (!parsed?.success) {
    log.warn("ai.summary_schema_rejected", { caseId: view.id });
    return { ...fallback, provider: providerName(), aiGenerated: false, generatedAt, disclaimer: DISCLAIMER };
  }

  // Source ids are only accepted when they name evidence actually on this
  // case, so a model cannot invent a citation.
  const knownIds = new Set(view.evidence.map((e) => e.id));
  const sourcesUsed = parsed.data.sourcesUsed.filter((id) => knownIds.has(id));

  return {
    ...parsed.data,
    sourcesUsed,
    provider: providerName(),
    aiGenerated: true,
    generatedAt,
    disclaimer: DISCLAIMER
  };
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
