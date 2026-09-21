import type { CivicInfoItem, ResponseState, VerificationState } from "@prisma/client";
import { computeFreshness, type FreshnessState, type Jurisdiction, type NextAction } from "../civic-types";

// Civic information leaves the server with its provenance attached: where it
// came from, when it was last verified, how, and whether it is demo data.
// Freshness is computed from lastVerifiedAt rather than stored, so a stale
// record cannot keep claiming to be current.

/**
 * A case a civic item points at, resolved to what may be shown.
 *
 * `relatedCaseIds` is authored data, and authored data can name a case that is
 * private, still in screening, or restricted. Exposing the raw list would have
 * published the existence of those cases from a page that has no business
 * knowing about them. So the ids never leave the server: they are resolved
 * against `publicVisible`, and only cases that survive that check appear here.
 */
export interface RelatedCaseLink {
  publicCaseId: string;
  title: string;
  verification: VerificationState;
  response: ResponseState;
  updatedAt: string;
}

export interface CivicInfoView {
  id: string;
  title: string;
  category: CivicInfoItem["category"];
  jurisdiction: Jurisdiction;
  explanation: string;
  officialSource: string;
  sourceUrl?: string;
  sourceAuthority: string;
  publishedAt: string;
  lastVerifiedAt: string;
  freshnessState: FreshnessState;
  freshnessThresholdDays: number;
  verificationMethod?: string;
  eligibility?: string;
  requirements: string[];
  fees?: string;
  deadlines?: string;
  contactInfo?: string;
  nextActions: NextAction[];
  /** Public cases only. See RelatedCaseLink. */
  relatedCases: RelatedCaseLink[];
  relatedCivicIds: string[];
  whatRemainsUncertain: string[];
  languageVersions: Record<
    string,
    {
      title: string;
      explanation: string;
      eligibility?: string;
      requirements?: string[];
      whatRemainsUncertain?: string[];
    }
  >;
  /** Demo corpus flag — the UI labels these unmistakably. */
  fictional: boolean;
  tags: string[];
}

export function toCivicInfoView(
  item: CivicInfoItem,
  /** Already filtered to publicly visible cases by the caller. */
  relatedCases: RelatedCaseLink[] = []
): CivicInfoView {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    jurisdiction: {
      country: item.country,
      region: item.region ?? undefined,
      locality: item.locality ?? undefined,
      level: item.level
    },
    explanation: item.explanation,
    officialSource: item.officialSource,
    sourceUrl: item.sourceUrl ?? undefined,
    sourceAuthority: item.sourceAuthority,
    publishedAt: item.publishedAt.toISOString(),
    lastVerifiedAt: item.lastVerifiedAt.toISOString(),
    freshnessState: computeFreshness(item.lastVerifiedAt.toISOString(), item.freshnessThresholdDays),
    freshnessThresholdDays: item.freshnessThresholdDays,
    verificationMethod: item.verificationMethod ?? undefined,
    eligibility: item.eligibility ?? undefined,
    requirements: item.requirements,
    fees: item.fees ?? undefined,
    deadlines: item.deadlines ?? undefined,
    contactInfo: item.contactInfo ?? undefined,
    nextActions: Array.isArray(item.nextActions) ? (item.nextActions as unknown as NextAction[]) : [],
    relatedCases,
    relatedCivicIds: item.relatedCivicIds,
    whatRemainsUncertain: item.whatRemainsUncertain,
    languageVersions:
      item.languageVersions && typeof item.languageVersions === "object"
        ? (item.languageVersions as CivicInfoView["languageVersions"])
        : {},
    fictional: item.fictional,
    tags: item.tags
  };
}
