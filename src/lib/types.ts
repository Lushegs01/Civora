// Civora domain vocabulary for the UI.
//
// The *types* come from the Prisma schema, so a column rename is a type error
// rather than a silent divergence. What lives here is presentation metadata:
// the labels, blurbs and icons the interface uses.

import type {
  CaseCategory,
  CasePriority,
  EvidenceKind,
  EvidenceSourceType,
  EventType,
  PrivacyMode,
  PublicationState,
  ResponseState,
  VerificationState,
  Visibility
} from "@prisma/client";

export type {
  CaseCategory,
  CasePriority,
  EvidenceKind,
  EvidenceSourceType,
  EventType,
  PrivacyMode,
  PublicationState,
  ResponseState,
  VerificationState,
  Visibility
};

export interface OrganizationSummary {
  id: string;
  name: string;
  description: string;
  contactEmail?: string | null;
  fictional?: boolean;
}

export const CATEGORY_META: Record<
  CaseCategory,
  { label: string; labelKey: string; blurb: string; blurbKey: string; icon: string }
> = {
  safety: {
    label: "Safety",
    labelKey: "category.safety",
    blurb: "Something that put people at risk or felt unsafe.",
    blurbKey: "category.safety.blurb",
    icon: "shield-alert"
  },
  community: {
    label: "Community issue",
    labelKey: "category.community",
    blurb: "Neighbourhood concerns that affect shared life together.",
    blurbKey: "category.community.blurb",
    icon: "users"
  },
  service: {
    label: "Public service",
    labelKey: "category.service",
    blurb: "Water, power, waste, transport or other everyday services.",
    blurbKey: "category.service.blurb",
    icon: "wrench"
  },
  infrastructure: {
    label: "Infrastructure",
    labelKey: "category.infrastructure",
    blurb: "Roads, lighting, buildings, signage and public works.",
    blurbKey: "category.infrastructure.blurb",
    icon: "hard-hat"
  },
  dispute: {
    label: "Dispute",
    labelKey: "category.dispute",
    blurb: "A disagreement affecting people who share a space or facility.",
    blurbKey: "category.dispute.blurb",
    icon: "scale"
  },
  other: {
    label: "Other",
    labelKey: "category.other",
    blurb: "A civic matter that doesn't fit another category.",
    blurbKey: "category.other.blurb",
    icon: "circle-ellipsis"
  }
};

/**
 * Privacy copy.
 *
 * `publicLine` is what the case page tells everyone; `bodyDetail` is what the
 * reporter is told at the point of choosing. Anonymous genuinely stores
 * nothing, so the copy says so without hedging.
 */
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
    body: "No name or contact details are stored at all. Case handlers cannot see who filed it, and neither can we.",
    publicLine: "Reporter identity: not recorded",
    icon: "eye-off"
  },
  confidential: {
    label: "Confidential",
    title: "Visible to authorized case handlers only",
    body: "Your contact details are stored separately from the case and shown only to the organization handling it. They never appear publicly.",
    publicLine: "Reporter identity: restricted to authorized responders",
    icon: "lock"
  },
  identified: {
    label: "Identified",
    title: "Shared with the responding organization",
    body: "Your name and contact details are available to the organization handling this case so they can follow up with you. They never appear publicly.",
    publicLine: "Reporter identity: shared with the responding organization",
    icon: "user-round"
  }
};

export const PUBLICATION_META: Record<PublicationState, { label: string; icon: string; tone: string }> = {
  private_case: { label: "Private", icon: "lock", tone: "neutral" },
  screening: { label: "Awaiting review", icon: "clock", tone: "warning" },
  public_case: { label: "Public", icon: "eye", tone: "success" },
  restricted: { label: "Restricted", icon: "shield", tone: "warning" },
  archived: { label: "Archived", icon: "archive", tone: "neutral" }
};

export interface CaseCountsSummary {
  reports: number;
  evidence: number;
  updates: number;
  photos: number;
  confirmedLinks: number;
}
