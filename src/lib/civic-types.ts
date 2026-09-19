// Civora civic information domain model. These types represent structured civic
// knowledge — services, rights, policies, opportunities, public projects, and
// safety information. Each item carries provenance (source, verification date,
// freshness) so the UI can show *why* information is trusted, not just *that*
// it is trusted. Product Rule: AI never determines verification status.

export type CivicCategory =
  | "service"
  | "right"
  | "policy"
  | "opportunity"
  | "project"
  | "safety"
  | "procedure";

export type FreshnessState =
  | "current"       // Verified recently
  | "review_needed" // Verification older than threshold
  | "outdated"      // Source known to have changed or too old
  | "conflicting";  // Multiple credible sources disagree

export type JurisdictionLevel = "federal" | "state" | "local";

export interface Jurisdiction {
  country: string;
  region?: string;       // State / Province
  locality?: string;     // LGA / District / Municipality
  level: JurisdictionLevel;
}

export interface NextAction {
  label: string;
  labelKey?: string;     // i18n key for translation
  type: "link" | "internal" | "report" | "contact" | "share" | "save" | "apply";
  href?: string;
  icon?: string;
}

export interface CivicInfoItem {
  id: string;                       // e.g. "CIV-001"
  title: string;
  category: CivicCategory;
  jurisdiction: Jurisdiction;
  explanation: string;              // plain-language explanation
  officialSource: string;           // institution name
  sourceUrl?: string;               // link to authoritative source
  sourceAuthority: string;          // type of authority (e.g. "Federal Ministry")
  publishedAt: string;              // ISO date
  lastVerifiedAt: string;           // ISO date
  freshnessState: FreshnessState;
  freshnessThresholdDays: number;   // days before review_needed
  verificationMethod?: string;      // how it was verified
  eligibility?: string;             // who is eligible
  requirements?: string[];          // steps or documents needed
  fees?: string;                    // cost information
  deadlines?: string;               // time constraints
  contactInfo?: string;             // how to reach the authority
  nextActions: NextAction[];
  relatedCaseIds?: string[];        // linked cases from incident system
  relatedCivicIds?: string[];       // linked civic info items
  whatRemainsUncertain?: string[];  // explicit uncertainty
  languageVersions: Record<string, {
    title: string;
    explanation: string;
    eligibility?: string;
    requirements?: string[];
  }>;
  fictional: boolean;               // true for demo data — always labelled
  tags?: string[];                  // for search
}

// Metadata for civic categories — mirrors the pattern in types.ts CATEGORY_META
export const CIVIC_CATEGORY_META: Record<
  CivicCategory,
  { label: string; blurb: string; icon: string; labelKey: string }
> = {
  service: {
    label: "Public service",
    blurb: "Water, power, health, education, and other government services.",
    icon: "building-2",
    labelKey: "civic.category.service"
  },
  right: {
    label: "Rights",
    blurb: "Constitutional and legal rights of citizens.",
    icon: "scale",
    labelKey: "civic.category.right"
  },
  policy: {
    label: "Policy",
    blurb: "Government policies affecting communities.",
    icon: "file-text",
    labelKey: "civic.category.policy"
  },
  opportunity: {
    label: "Opportunity",
    blurb: "Grants, scholarships, programmes, and public tenders.",
    icon: "sparkles",
    labelKey: "civic.category.opportunity"
  },
  project: {
    label: "Public project",
    blurb: "Roads, buildings, and public works under construction.",
    icon: "hard-hat",
    labelKey: "civic.category.project"
  },
  safety: {
    label: "Safety",
    blurb: "Safety standards, reporting channels, and emergency procedures.",
    icon: "shield-alert",
    labelKey: "civic.category.safety"
  },
  procedure: {
    label: "Procedure",
    blurb: "How to apply, register, or complete government processes.",
    icon: "clipboard-list",
    labelKey: "civic.category.procedure"
  }
};

export const FRESHNESS_META: Record<
  FreshnessState,
  { label: string; icon: string; tone: "success" | "warning" | "danger" | "danger"; description: string; labelKey: string }
> = {
  current: {
    label: "Current",
    icon: "check-circle-2",
    tone: "success",
    description: "This information was verified recently and is believed to be up to date.",
    labelKey: "freshness.current"
  },
  review_needed: {
    label: "Review needed",
    icon: "clock",
    tone: "warning",
    description: "This information has not been re-verified recently. It may still be accurate but should be confirmed.",
    labelKey: "freshness.review_needed"
  },
  outdated: {
    label: "Outdated",
    icon: "alert-triangle",
    tone: "danger",
    description: "The source is known to have changed or the information is too old to rely on without checking.",
    labelKey: "freshness.outdated"
  },
  conflicting: {
    label: "Conflicting",
    icon: "triangle-alert",
    tone: "danger",
    description: "Multiple credible sources disagree. The discrepancy is documented, not judged.",
    labelKey: "freshness.conflicting"
  }
};

export function computeFreshness(lastVerifiedAt: string, thresholdDays: number): FreshnessState {
  const daysSince = (Date.now() - new Date(lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= thresholdDays) return "current";
  if (daysSince <= thresholdDays * 2) return "review_needed";
  return "outdated";
}

export function jurisdictionLabel(j: Jurisdiction): string {
  const parts: string[] = [];
  if (j.locality) parts.push(j.locality);
  if (j.region) parts.push(j.region);
  parts.push(j.country);
  return parts.join(", ");
}

export function jurisdictionShort(j: Jurisdiction): string {
  if (j.locality) return j.locality;
  if (j.region) return j.region;
  return j.country;
}
