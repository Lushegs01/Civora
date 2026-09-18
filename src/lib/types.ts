// Civora domain model. These types mirror the relational schema documented in
// prisma/schema.prisma; the demo runtime persists them via the JSON store
// (src/lib/db/store.ts) which can be swapped for Postgres without UI changes.

export type PrivacyMode = "anonymous" | "confidential" | "identified";

export type VerificationState =
  | "unverified"
  | "partially_verified"
  | "documented"
  | "conflicting"
  | "resolved";

export type ResponseState =
  | "not_assigned"
  | "received"
  | "acknowledged"
  | "in_progress"
  | "action_recorded"
  | "closed";

export type CaseCategory =
  | "safety"
  | "community"
  | "service"
  | "infrastructure"
  | "dispute"
  | "other";

export type CasePriority = "standard" | "elevated" | "urgent";

export type EvidenceKind = "photo" | "video" | "document" | "report" | "official" | "note";

export type EvidenceSourceType = "primary" | "corroborating" | "official" | "citizen";

export type EventType =
  | "REPORT_SUBMITTED"
  | "EVIDENCE_ADDED"
  | "CORROBORATION_RECEIVED"
  | "VERIFICATION_UPDATED"
  | "CASE_ASSIGNED"
  | "CASE_ACKNOWLEDGED"
  | "RESPONSE_IN_PROGRESS"
  | "INFO_REQUESTED"
  | "PUBLIC_UPDATE_ADDED"
  | "ACTION_RECORDED"
  | "UPDATE_REQUESTED"
  | "CASE_CLOSED";

export interface Organization {
  id: string;
  name: string;
  description: string;
  contactEmail?: string;
}

export interface ReportEntry {
  id: string;
  at: string;
  role: "initial" | "corroborating";
  privacyMode: PrivacyMode;
  trackingTokenHash?: string;
  areaNote?: string;
}

export interface CaseRecord {
  id: string; // public case id, e.g. CS-1042 — the only id exposed anywhere
  title: string;
  description: string;
  category: CaseCategory;
  locationGeneral?: string;
  coordinates?: { lat: number; lng: number };
  incidentAt: string;
  privacyMode: PrivacyMode;
  verification: VerificationState;
  response: ResponseState;
  priority: CasePriority;
  assignedOrgId?: string;
  nextUpdateAt?: string;
  awaitingReporter?: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;

  reporterContact?: string; // PRIVATE reporter data — responder views only, never public
  publicVisible: boolean;
  known: string[];
  uncertain: string[];
  reports: ReportEntry[];
  disputePathway?: boolean;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  kind: EvidenceKind;
  title: string;
  sourceType: EvidenceSourceType;
  submittedAt: string;
  submittedByLabel: string; // never a raw identity — role/privacy-aware label
  excerpt?: string;
  relationship: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  storageKey?: string; // server-side object-storage key (demo: local uploads dir)
  publicVisible: boolean;
  sourceRef?: string; // citation or reference for official/primary sources
}

export interface CaseEvent {
  id: string;
  caseId: string;
  type: EventType;
  at: string;
  actor: string;
  visibility: "public" | "restricted";
  title: string;
  detail?: string;
}

export interface CaseUpdate {
  id: string;
  caseId: string;
  at: string;
  authorLabel: string;
  body: string;
}

export interface InternalNote {
  id: string;
  caseId: string;
  at: string;
  authorLabel: string;
  body: string;
}

export interface CivoraDB {
  version: number;
  orgs: Organization[];
  cases: CaseRecord[];
  evidence: EvidenceRecord[];
  events: CaseEvent[];
  updates: CaseUpdate[];
  notes: InternalNote[];
  meta: { lastCaseNumber: number; seededAt: string };
}

export const CATEGORY_META: Record<
  CaseCategory,
  { label: string; blurb: string; icon: string }
> = {
  safety: {
    label: "Safety",
    blurb: "Something that put people at risk or felt unsafe.",
    icon: "shield-alert"
  },
  community: {
    label: "Community issue",
    blurb: "Neighbourhood concerns that affect shared life together.",
    icon: "users"
  },
  service: {
    label: "Public service",
    blurb: "Water, power, waste, transport or other everyday services.",
    icon: "wrench"
  },
  infrastructure: {
    label: "Infrastructure",
    blurb: "Roads, lighting, buildings, signage and public works.",
    icon: "hard-hat"
  },
  dispute: {
    label: "Dispute",
    blurb: "A disagreement affecting people who share a space or facility.",
    icon: "scale"
  },
  other: {
    label: "Other",
    blurb: "A civic matter that doesn't fit another category.",
    icon: "circle-ellipsis"
  }
};

export const PRIVACY_META: Record<
  PrivacyMode,
  {
    label: string;
    title: string;
    body: string;
    publicLine: string;
    icon: string;
  }
> = {
  anonymous: {
    label: "Anonymous",
    title: "Your identity is not attached to the case",
    body: "Nothing links the report back to you. Even case handlers cannot see who filed it.",
    publicLine: "Reporter identity: not recorded",
    icon: "eye-off"
  },
  confidential: {
    label: "Confidential",
    title: "Visible to authorized responders only",
    body: "Your identity may be available to authorized case handlers. It is never shown publicly.",
    publicLine: "Reporter identity: restricted to authorized responders",
    icon: "lock"
  },
  identified: {
    label: "Identified",
    title: "Shared with authorized case handlers",
    body: "Your identity is available to the organization handling this case so they can follow up with you.",
    publicLine: "Reporter identity: shared with the responding organization",
    icon: "user-round"
  }
};

export function isResolved(c: CaseRecord): boolean {
  return c.response === "closed" || c.verification === "resolved";
}
