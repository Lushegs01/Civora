import type { CaseCategory } from "@prisma/client";

// Corroboration matching.
//
// This engine proposes; it never concludes. Its output is a candidate link
// with a per-signal breakdown for a human to judge. Nothing here may change a
// case's verification state — that transition lives in case-state.ts and needs
// a responder and a reason.

/**
 * Words that carry no discriminating power in a civic report. Without this
 * list two unrelated reports that both mention "the market road" score as a
 * near-certain match.
 */
const STOP_WORDS = new Set([
  "the","and","for","with","that","this","there","their","from","near","about","into","over","under",
  "was","were","has","have","had","been","being","are","not","but","you","your","our","out","off",
  "when","where","which","while","after","before","again","some","any","all","its","it's","they",
  "them","then","than","also","just","very","more","most","much","many","one","two","get","got",
  "around","because","could","would","should","still","today","yesterday","morning","evening","night",
  "people","person","area","place","thing","issue","problem","report","reported","happened","happening",
  "said","says","saw","seen","went","going","come","came","look","looks","looking","need","needs"
]);

/**
 * Generic location nouns. On their own they must not create a strong match —
 * "market", "road", "campus" and "station" describe half a city.
 */
const GENERIC_PLACE_WORDS = new Set([
  "market","road","street","avenue","lane","campus","station","junction","road.","park","square",
  "centre","center","area","zone","district","estate","block","building","hall","gate","entrance",
  "north","south","east","west","upper","lower","main","old","new","central"
]);

export interface MatchSignals {
  category: boolean;
  timeProximityHours: number;
  timeScore: number;
  locationScore: number;
  /** Informative (non-generic) location tokens shared by both reports. */
  locationSpecificTokens: number;
  textScore: number;
  textSharedTokens: number;
  duplicateFingerprint: boolean;
}

export interface MatchCandidate<T> {
  target: T;
  score: number;
  signals: MatchSignals;
}

export interface MatchableCase {
  id: string;
  publicCaseId: string;
  category: CaseCategory;
  narrative: string;
  locationGeneral: string | null;
  incidentAt: Date;
  updatedAt: Date;
}

export interface MatchInput {
  category: CaseCategory;
  narrative: string;
  locationGeneral?: string | null;
  incidentAt: Date;
}

/**
 * Score at or above which a link is worth a handler's attention.
 *
 * Tuned for recall rather than precision, deliberately. A proposal is
 * restricted, carries its per-signal breakdown, and changes nothing until a
 * person confirms it — so the cost of showing one too many is a few seconds of
 * a triage desk's time, while the cost of missing a real corroboration is a
 * hazard nobody connects. The hard gate against nonsense matches is
 * `hasSubstance` below, not this number.
 */
export const PROPOSAL_THRESHOLD = 0.45;
/** Score at or above which the two reports are probably the same submission. */
export const DUPLICATE_THRESHOLD = 0.92;
/** How far apart two reports can be and still describe the same incident. */
export const TIME_WINDOW_HOURS = 72;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

/** Tokens that actually identify a place, excluding the generic vocabulary. */
export function specificPlaceTokens(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(tokenize(text).filter((token) => !GENERIC_PLACE_WORDS.has(token)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function sharedCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const token of a) if (b.has(token)) n += 1;
  return n;
}

/**
 * Location similarity, weighted so that generic nouns contribute a fraction of
 * what a distinctive place name does.
 */
export function locationSimilarity(a: string | null | undefined, b: string | null | undefined): {
  score: number;
  specificShared: number;
} {
  if (!a?.trim() || !b?.trim()) return { score: 0, specificShared: 0 };
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return { score: 0, specificShared: 0 };

  let weighted = 0;
  let total = 0;
  for (const token of tokensA) {
    const weight = GENERIC_PLACE_WORDS.has(token) ? 0.15 : 1;
    total += weight;
    if (tokensB.has(token)) weighted += weight;
  }
  const specificShared = sharedCount(specificPlaceTokens(a), specificPlaceTokens(b));
  return { score: total === 0 ? 0 : weighted / total, specificShared };
}

/** Text similarity over informative tokens only. */
export function textSimilarity(a: string, b: string): { score: number; shared: number } {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  const shared = sharedCount(tokensA, tokensB);
  // Too few informative tokens on either side to conclude anything.
  if (tokensA.size < 3 || tokensB.size < 3) return { score: 0, shared };
  return { score: jaccard(tokensA, tokensB), shared };
}

function timeScore(a: Date, b: Date): { score: number; hours: number } {
  const hours = Math.abs(a.getTime() - b.getTime()) / 3_600_000;
  if (hours > TIME_WINDOW_HOURS) return { score: 0, hours };
  // Linear decay across the window: same hour ≈ 1, edge of window ≈ 0.
  return { score: 1 - hours / TIME_WINDOW_HOURS, hours };
}

/**
 * Scores one candidate pairing.
 *
 * Category must match, the reports must be within the time window, and there
 * must be real corroborating detail — at least one distinctive shared location
 * token or a meaningful text overlap. A shared generic place name alone can
 * never reach the proposal threshold.
 */
export function scoreMatch(input: MatchInput, candidate: MatchableCase): MatchCandidate<MatchableCase> | null {
  if (input.category !== candidate.category) return null;

  const time = timeScore(input.incidentAt, candidate.incidentAt);
  if (time.score <= 0) return null;

  const location = locationSimilarity(input.locationGeneral, candidate.locationGeneral);
  const text = textSimilarity(input.narrative, candidate.narrative);

  const signals: MatchSignals = {
    category: true,
    timeProximityHours: Math.round(time.hours * 10) / 10,
    timeScore: round(time.score),
    locationScore: round(location.score),
    locationSpecificTokens: location.specificShared,
    textScore: round(text.score),
    textSharedTokens: text.shared,
    duplicateFingerprint: false
  };

  // Corroboration needs substance: a distinctive place in common, or several
  // informative words in common. Otherwise this is just two reports about
  // "the market road" on the same day.
  const hasSubstance = location.specificShared >= 1 || text.shared >= 4;
  if (!hasSubstance) return null;

  // Location and text are independent signals and are combined, never maxed:
  // one strong signal alone should not be enough.
  const score = round(0.45 * location.score + 0.4 * text.score + 0.15 * time.score);
  signals.duplicateFingerprint = text.score >= DUPLICATE_THRESHOLD && location.score >= 0.9;

  if (score < PROPOSAL_THRESHOLD) return null;
  return { target: candidate, score, signals };
}

/** Ranked candidate links for a new report. Never more than a handful. */
export function findCandidates(
  input: MatchInput,
  candidates: MatchableCase[],
  limit = 3
): Array<MatchCandidate<MatchableCase>> {
  const scored: Array<MatchCandidate<MatchableCase>> = [];
  for (const candidate of candidates) {
    const match = scoreMatch(input, candidate);
    if (match) scored.push(match);
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Exposed for tests and for the responder UI's "why was this proposed?" panel. */
export const __internals = { STOP_WORDS, GENERIC_PLACE_WORDS, jaccard };
