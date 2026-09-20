import type { CaseCategory, PublicationState } from "@prisma/client";
import { scanForPersonalData } from "./privacy";

// A report is not a publication.
//
// The previous build set publicVisible = true on every submission and rendered
// the reporter's raw text on a public page. Cases now enter `screening`, carry
// the reasons they are held, and only become public when a handler says so —
// or, for low-risk categories with clean text, when the automatic check finds
// nothing that needs a human first.

/** Categories where an allegation or a person is usually involved. */
const SENSITIVE_CATEGORIES: CaseCategory[] = ["safety", "dispute"];

const ALLEGATION_TERMS =
  /\b(accus|alleg|assault|abuse|harass|threat|stole|theft|corrupt|bribe|fraud|attack|violence|weapon|rape|traffick)\w*/i;

const NAMED_PERSON_HINT = /\b(mr|mrs|ms|dr|prof|chief|officer|inspector|pastor|imam)\.?\s+[A-Z][a-z]+/;

export interface ScreeningDecision {
  publicationState: PublicationState;
  publicVisible: boolean;
  flags: string[];
}

/**
 * Decides the initial publication state of a new case.
 *
 * Returning `screening` is the safe default: the case is tracked, visible to
 * its reporter and to handlers, and simply not yet on the public board.
 */
export function screenNewCase(input: {
  category: CaseCategory;
  narrative: string;
  locationGeneral?: string | null;
  hasPreciseCoordinates: boolean;
}): ScreeningDecision {
  const flags: string[] = [];

  if (SENSITIVE_CATEGORIES.includes(input.category)) flags.push(`sensitive-category:${input.category}`);
  if (ALLEGATION_TERMS.test(input.narrative)) flags.push("allegation-language");
  if (NAMED_PERSON_HINT.test(input.narrative)) flags.push("possible-named-person");
  flags.push(...scanForPersonalData(input.narrative).flags);
  if (input.hasPreciseCoordinates) flags.push("precise-location");

  if (flags.length === 0) {
    return { publicationState: "public_case", publicVisible: true, flags };
  }
  return { publicationState: "screening", publicVisible: false, flags };
}

/** publicVisible is a denormalization of publicationState; keep them in step. */
export function publicVisibleFor(state: PublicationState): boolean {
  return state === "public_case";
}

export const PUBLICATION_LABEL: Record<PublicationState, string> = {
  private_case: "Private",
  screening: "Awaiting review",
  public_case: "Public",
  restricted: "Restricted",
  archived: "Archived"
};

export const PUBLICATION_DESCRIPTION: Record<PublicationState, string> = {
  private_case: "Visible only to the reporter and authorized case handlers.",
  screening: "Held for review before it appears on the public board.",
  public_case: "Listed publicly with a summary written for publication.",
  restricted: "Deliberately withheld from the public board for safety or privacy reasons.",
  archived: "Closed and removed from the public board."
};

/**
 * Builds the text that may be published for a case.
 *
 * Never the raw report. Until a handler writes a publishable summary the
 * public page says what kind of issue was reported and where, and nothing the
 * reporter may not have meant to broadcast.
 */
export function defaultPublicSummary(input: {
  category: CaseCategory;
  locationGeneral?: string | null;
}): string {
  const subject: Record<CaseCategory, string> = {
    safety: "A safety concern",
    community: "A community issue",
    service: "A public service issue",
    infrastructure: "An infrastructure issue",
    dispute: "A dispute affecting people who share a space",
    other: "A civic matter"
  };
  const where = input.locationGeneral?.trim() ? ` in the ${input.locationGeneral.trim()} area` : "";
  return `${subject[input.category]}${where} has been reported. Details are held with the case handlers while the report is reviewed; nothing here has been verified yet.`;
}

/** Short, non-identifying title derived from the category and area. */
export function defaultTitle(input: { category: CaseCategory; locationGeneral?: string | null }): string {
  const subject: Record<CaseCategory, string> = {
    safety: "Safety concern reported",
    community: "Community issue reported",
    service: "Public service issue reported",
    infrastructure: "Infrastructure issue reported",
    dispute: "Dispute reported",
    other: "Civic matter reported"
  };
  const area = input.locationGeneral?.trim();
  return area ? `${subject[input.category]} — ${area.slice(0, 60)}` : subject[input.category];
}
