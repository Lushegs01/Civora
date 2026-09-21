import crypto from "node:crypto";
import type {
  CaseCategory,
  CasePriority,
  CivicCategory,
  EvidenceKind,
  EvidenceSourceType,
  EventType,
  JurisdictionLevel,
  PrivacyMode,
  PublicationState,
  ResponseState,
  VerificationState,
  Visibility
} from "@prisma/client";

// The fictional demo corpus.
//
// Everything here is invented for evaluation. Organizations carry
// `fictional: true`, civic information carries `fictional: true`, and the UI
// labels both, so nothing in a demo can be mistaken for a real record.
//
// This module is data only: it is loaded by prisma/seed.ts and by the
// explicitly gated demo reset. No component imports it.

const HOUR = 3_600_000;
const MINUTE = 60_000;
const DAY = 24 * HOUR;

export const DEMO_ORGS = [
  {
    slug: "org-facilities",
    name: "Facilities Department",
    description: "Buildings, electrical safety and campus/public facility maintenance.",
    contactEmail: "facilities@civora-demo.example"
  },
  {
    slug: "org-public-works",
    name: "Public Works Office",
    description: "Streets, lighting, signage and public infrastructure.",
    contactEmail: "publicworks@civora-demo.example"
  },
  {
    slug: "org-water",
    name: "Municipal Water Services",
    description: "Water supply, outages and service restoration.",
    contactEmail: "water@civora-demo.example"
  },
  {
    slug: "org-mediation",
    name: "Community Mediation Unit",
    description: "Neutral mediation and referral for community disputes.",
    contactEmail: "mediation@civora-demo.example"
  },
  {
    slug: "org-safety-desk",
    name: "Safety & Protection Desk",
    description: "Triage and referral for safety and protection concerns.",
    contactEmail: "safety@civora-demo.example"
  }
] as const;

export type DemoOrgSlug = (typeof DEMO_ORGS)[number]["slug"];

export const DEMO_USERS = [
  {
    email: "triage@civora-demo.example",
    displayName: "A. Okafor (Triage desk)",
    role: "responder" as const,
    orgSlug: null
  },
  {
    email: "facilities@civora-demo.example",
    displayName: "R. Mensah (Facilities)",
    role: "responder" as const,
    orgSlug: "org-facilities" as DemoOrgSlug
  },
  {
    email: "works@civora-demo.example",
    displayName: "T. Bello (Public Works)",
    role: "responder" as const,
    orgSlug: "org-public-works" as DemoOrgSlug
  },
  {
    email: "water@civora-demo.example",
    displayName: "N. Adeyemi (Water Services)",
    role: "responder" as const,
    orgSlug: "org-water" as DemoOrgSlug
  },
  {
    email: "mediation@civora-demo.example",
    displayName: "K. Danjuma (Mediation Unit)",
    role: "organization_admin" as const,
    orgSlug: "org-mediation" as DemoOrgSlug
  },
  {
    email: "admin@civora-demo.example",
    displayName: "Civora platform administrator",
    role: "platform_admin" as const,
    orgSlug: null
  }
];

/**
 * Tracking tokens pre-seeded on a demo device.
 *
 * These are *demo* credentials and are the only tokens in the system whose
 * plaintext is known: they exist so a fresh browser can show a realistic "your
 * cases" list. They are only planted when the app runs in demo mode.
 */
export const DEMO_DEVICE_TOKENS: Record<string, string> = {
  "CS-1042": "demo-device-token-cs1042-0000000000aaaa",
  "CS-1040": "demo-device-token-cs1040-0000000000bbbb"
};

export function demoTokenHash(caseId: string): string {
  return crypto.createHash("sha256").update(DEMO_DEVICE_TOKENS[caseId]).digest("hex");
}

export interface DemoReport {
  key: string;
  role: "initial" | "corroborating";
  privacyMode: PrivacyMode;
  narrative: string;
  areaNote?: string;
  offsetMs: number;
  trackingTokenHash?: string;
  contact?: { name?: string; email?: string; phone?: string; preferredChannel?: string };
}

export interface DemoEvidence {
  offsetMs: number;
  kind: EvidenceKind;
  title: string;
  sourceType: EvidenceSourceType;
  submittedByLabel: string;
  excerpt?: string;
  relationship: string;
  publicVisible: boolean;
  sourceRef?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
}

export interface DemoEvent {
  offsetMs: number;
  type: EventType;
  actorType: "system" | "reporter" | "responder" | "organization" | "matching_rule";
  actorLabel: string;
  orgSlug?: DemoOrgSlug;
  visibility: Visibility;
  title: string;
  detail?: string;
}

export interface DemoUpdate {
  offsetMs: number;
  authorLabel: string;
  orgSlug?: DemoOrgSlug;
  body: string;
}

export interface DemoNote {
  offsetMs: number;
  authorLabel: string;
  body: string;
}

export interface DemoInfoRequest {
  offsetMs: number;
  requestedByLabel: string;
  orgSlug?: DemoOrgSlug;
  message: string;
  status: "open" | "answered";
  answerBody?: string;
  answerOffsetMs?: number;
}

export interface DemoCase {
  publicCaseId: string;
  caseNumber: number;
  title: string;
  /** Written for publication — this is what the public board shows. */
  publicSummary: string;
  /** The reporter's own narrative; restricted to handlers and the reporter. */
  privateDescription: string;
  category: CaseCategory;
  locationGeneral?: string;
  privacyMode: PrivacyMode;
  verification: VerificationState;
  verificationReason?: string;
  response: ResponseState;
  priority: CasePriority;
  publicationState: PublicationState;
  screeningFlags?: string[];
  orgSlug?: DemoOrgSlug;
  createdOffsetMs: number;
  updatedOffsetMs: number;
  incidentOffsetMs: number;
  resolvedOffsetMs?: number;
  closedOffsetMs?: number;
  nextUpdateOffsetMs?: number;
  awaitingReporter?: boolean;
  disputePathway?: boolean;
  known: string[];
  uncertain: string[];
  reports: DemoReport[];
  evidence: DemoEvidence[];
  events: DemoEvent[];
  updates: DemoUpdate[];
  notes: DemoNote[];
  infoRequests?: DemoInfoRequest[];
}

/** Proposed and confirmed relationships between demo cases. */
export interface DemoLink {
  sourcePublicId: string;
  targetPublicId: string;
  score: number;
  signals: Record<string, number | boolean>;
  status: "proposed" | "confirmed";
  decisionNote?: string;
  createdOffsetMs: number;
  decidedOffsetMs?: number;
}

export const DEMO_CASES: DemoCase[] = [
  {
    publicCaseId: "CS-1035",
    caseNumber: 1035,
    title: "Street lighting outage along Riverside Walk",
    publicSummary:
      "Six street lights along the Riverside Walk footpath, between the market entrance and the footbridge, were reported dark after a storm. The Public Works Office replaced the damaged cable section and six fittings, and the case is closed with a documented outcome.",
    privateDescription:
      "Six street lights along the riverside footpath between the market entrance and the footbridge have been dark since the storm on the 5th. The path is used heavily in the early morning.",
    category: "infrastructure",
    locationGeneral: "Riverside Walk, between market entrance and footbridge",
    privacyMode: "identified",
    verification: "resolved",
    verificationReason: "Works completion record documents the repair and closes the reported fault.",
    response: "closed",
    priority: "standard",
    publicationState: "public_case",
    orgSlug: "org-public-works",
    createdOffsetMs: -11 * DAY,
    updatedOffsetMs: -6 * DAY,
    incidentOffsetMs: -11 * DAY,
    resolvedOffsetMs: -6 * DAY,
    closedOffsetMs: -6 * DAY,
    known: [
      "Four independent reports describe the same dark stretch of path.",
      "A works order was raised by the Public Works Office.",
      "The contractor recorded the replaced cable section and fittings."
    ],
    uncertain: ["The long-term maintenance schedule for this stretch has not been published."],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "identified",
        narrative:
          "Six street lights along the riverside footpath between the market entrance and the footbridge have been dark since the storm on the 5th. The path is used heavily in the early morning.",
        offsetMs: -11 * DAY,
        contact: { name: "Demo reporter (fictional)", email: "resident@civora-demo.example", preferredChannel: "email" }
      },
      {
        key: "r2",
        role: "corroborating",
        privacyMode: "anonymous",
        narrative: "Same stretch of path is still dark near the footbridge end.",
        areaNote: "Same stretch, near the footbridge",
        offsetMs: -10 * DAY
      }
    ],
    evidence: [
      {
        offsetMs: -6 * DAY,
        kind: "official",
        title: "Works completion record",
        sourceType: "official",
        submittedByLabel: "Public Works Office",
        excerpt:
          "Works order RW-2311 completed. Cable section (14 m) and six fittings replaced; lighting tested operational at 09:40.",
        relationship: "Documents the completed action and supports closure.",
        publicVisible: true,
        sourceRef: "Works order RW-2311 (fictional demo record)"
      }
    ],
    events: [
      { offsetMs: -11 * DAY, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Identified reporter", visibility: "public", title: "Case reported", detail: "Initial report received with location details." },
      { offsetMs: -10 * DAY, type: "CORROBORATION_CONFIRMED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Corroborating report confirmed", detail: "A case handler confirmed that a second report describes the same stretch of path." },
      { offsetMs: -10 * DAY, type: "VERIFICATION_UPDATED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Verification set to Partially verified", detail: "Multiple consistent reports refer to the same stretch of path." },
      { offsetMs: -9 * DAY, type: "CASE_ASSIGNED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Assigned to Public Works Office" },
      { offsetMs: -8 * DAY, type: "RESPONSE_IN_PROGRESS", actorType: "organization", actorLabel: "Public Works Office", orgSlug: "org-public-works", visibility: "public", title: "Response marked in progress" },
      { offsetMs: -6 * DAY, type: "ACTION_RECORDED", actorType: "organization", actorLabel: "Public Works Office", orgSlug: "org-public-works", visibility: "public", title: "Action recorded", detail: "Contractor replaced the damaged cable section and six light fittings. All six lights tested after replacement." },
      { offsetMs: -6 * DAY, type: "CASE_CLOSED", actorType: "organization", actorLabel: "Public Works Office", orgSlug: "org-public-works", visibility: "public", title: "Case closed", detail: "Lighting restored along the reported stretch." }
    ],
    updates: [
      {
        offsetMs: -6 * DAY,
        authorLabel: "Public Works Office",
        orgSlug: "org-public-works",
        body: "Repair completed along Riverside Walk. Six fittings replaced and tested. If you still notice dark sections, please file a new report referencing this case."
      }
    ],
    notes: []
  },
  {
    publicCaseId: "CS-1038",
    caseNumber: 1038,
    title: "Public project implementation status unclear",
    publicSummary:
      "Published records about the market pavilion refurbishment in Central Ward disagree with each other about whether phase one has been delivered. Civora documents the discrepancy; it does not judge which record is correct.",
    privateDescription:
      "Public notices say the market pavilion refurbishment is substantially complete, but the pavilion remains closed and unfinished. Published budget and procurement records appear to disagree with each other.",
    category: "other",
    locationGeneral: "Market pavilion, Central Ward",
    privacyMode: "anonymous",
    verification: "conflicting",
    verificationReason:
      "The budget summary and the procurement record materially disagree about delivery status. The discrepancy is documented, not judged.",
    response: "received",
    priority: "elevated",
    publicationState: "public_case",
    createdOffsetMs: -6 * DAY,
    updatedOffsetMs: -2 * DAY,
    incidentOffsetMs: -6 * DAY,
    known: [
      "The published budget summary shows 90% of allocated funds disbursed.",
      "The procurement record lists the main internal fit-out as not yet delivered.",
      "A public notice describes phase one as substantially complete."
    ],
    uncertain: [
      "Which record reflects the current state of the site has not been established.",
      "No independent site verification has been conducted yet."
    ],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "anonymous",
        narrative:
          "Public notices say the market pavilion refurbishment is substantially complete, but the pavilion remains closed and unfinished. Published budget and procurement records appear to disagree with each other.",
        offsetMs: -6 * DAY
      }
    ],
    evidence: [
      {
        offsetMs: -5 * DAY,
        kind: "document",
        title: "Budget summary — market pavilion refurbishment",
        sourceType: "primary",
        submittedByLabel: "Published budget record",
        excerpt:
          "Phase one expenditure reported at 90% of the allocated 2.4M. Line items for internal fit-out marked as disbursed to contractor.",
        relationship: "Indicates funds for the fit-out were disbursed.",
        publicVisible: true,
        sourceRef: "Quarterly budget summary, p.14 (fictional demo document)"
      },
      {
        offsetMs: -4 * DAY,
        kind: "document",
        title: "Procurement record — pavilion phase one",
        sourceType: "primary",
        submittedByLabel: "Published procurement register",
        excerpt:
          "Contract PA-8891 status: active. Deliverable D2 (internal fit-out) — not delivered. Revised completion estimate: outstanding.",
        relationship: "Materially disagrees with the budget summary on delivery status.",
        publicVisible: true,
        sourceRef: "Procurement register entry PA-8891 (fictional demo document)"
      },
      {
        offsetMs: -6 * DAY,
        kind: "official",
        title: "Public notice — pavilion refurbishment",
        sourceType: "official",
        submittedByLabel: "Project communications office",
        excerpt: "Phase one of the market pavilion refurbishment is substantially complete. Phase two begins next quarter.",
        relationship: "Describes the project as substantially complete; conflicts with the procurement record.",
        publicVisible: true,
        sourceRef: "Public notice board, 12 Sep (fictional demo notice)"
      }
    ],
    events: [
      { offsetMs: -6 * DAY, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Anonymous reporter", visibility: "public", title: "Case reported", detail: "Report submitted with references to published budget and procurement documents." },
      { offsetMs: -4 * DAY, type: "EVIDENCE_ADDED", actorType: "reporter", actorLabel: "Anonymous reporter", visibility: "public", title: "Documentary evidence added", detail: "Budget summary and procurement record attached." },
      { offsetMs: -2 * DAY, type: "VERIFICATION_UPDATED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Verification set to Conflicting", detail: "The budget summary and the procurement record materially disagree about delivery status. The discrepancy is documented, not judged." }
    ],
    updates: [],
    notes: []
  },
  {
    publicCaseId: "CS-1040",
    caseNumber: 1040,
    title: "Community water service disruption",
    publicSummary:
      "Households on and around Kessler Road reported losing water supply early one morning. The utility published a maintenance notice covering the same zone and timeframe, and crews are working on the supply line.",
    privateDescription:
      "No water in the Kessler Road area since early morning. Several neighbours report the same. A maintenance notice was posted by the utility later in the day.",
    category: "service",
    locationGeneral: "Kessler Road and adjacent streets",
    privacyMode: "confidential",
    verification: "documented",
    verificationReason: "The utility's published maintenance notice documents the disruption timeframe and area.",
    response: "in_progress",
    priority: "elevated",
    publicationState: "public_case",
    orgSlug: "org-water",
    createdOffsetMs: -2 * DAY - 6 * HOUR,
    updatedOffsetMs: -3 * HOUR,
    incidentOffsetMs: -2 * DAY - 8 * HOUR,
    nextUpdateOffsetMs: 2 * HOUR,
    known: [
      "The utility published a maintenance notice covering this zone.",
      "Two independent reports match the notice's timeframe and area.",
      "The utility confirmed crews are working on the supply line."
    ],
    uncertain: [
      "A revised restoration time has not been published yet.",
      "Some streets in the zone have partial supply while others have none."
    ],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "confidential",
        narrative:
          "No water in the Kessler Road area since early morning. Several neighbours report the same. A maintenance notice was posted by the utility later in the day.",
        offsetMs: -2 * DAY - 6 * HOUR,
        trackingTokenHash: demoTokenHash("CS-1040"),
        contact: {
          name: "Demo confidential reporter (fictional)",
          phone: "+000 000 0000",
          preferredChannel: "phone"
        }
      },
      {
        key: "r2",
        role: "corroborating",
        privacyMode: "anonymous",
        narrative: "Adjacent street also has no supply since the same morning.",
        areaNote: "Adjacent street, same morning",
        offsetMs: -2 * DAY - 4 * HOUR
      }
    ],
    evidence: [
      {
        offsetMs: -2 * DAY - 2 * HOUR,
        kind: "official",
        title: "Utility maintenance notice — Kessler Road zone",
        sourceType: "primary",
        submittedByLabel: "Municipal Water Services",
        excerpt:
          "Planned emergency maintenance on the Kessler Road supply line. Expected duration: up to 48 hours from 06:00. Some intermittent supply may occur while works proceed.",
        relationship: "Primary source documenting the disruption and its expected duration.",
        publicVisible: true,
        sourceRef: "Utility notice board ref W-1187 (fictional demo notice)"
      }
    ],
    events: [
      { offsetMs: -2 * DAY - 6 * HOUR, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Confidential reporter", visibility: "public", title: "Case reported" },
      { offsetMs: -2 * DAY - 4 * HOUR, type: "CORROBORATION_CONFIRMED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Corroborating report confirmed", detail: "A case handler confirmed that an independent report describes the same outage." },
      { offsetMs: -2 * DAY - 3 * HOUR, type: "VERIFICATION_UPDATED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Verification set to Documented", detail: "The utility's published maintenance notice documents the disruption timeframe and area." },
      { offsetMs: -2 * DAY, type: "CASE_ASSIGNED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Assigned to Municipal Water Services" },
      { offsetMs: -2 * DAY, type: "CASE_ACKNOWLEDGED", actorType: "organization", actorLabel: "Municipal Water Services", orgSlug: "org-water", visibility: "public", title: "Utility acknowledged the case" },
      { offsetMs: -3 * HOUR, type: "RESPONSE_IN_PROGRESS", actorType: "organization", actorLabel: "Municipal Water Services", orgSlug: "org-water", visibility: "public", title: "Response marked in progress", detail: "Crews working on the Kessler Road supply line." }
    ],
    updates: [
      {
        offsetMs: -3 * HOUR,
        authorLabel: "Municipal Water Services",
        orgSlug: "org-water",
        body: "Crews are on site. A revised restoration time will be published as soon as pressure testing completes."
      }
    ],
    notes: []
  },
  {
    publicCaseId: "CS-1042",
    caseNumber: 1042,
    title: "Dangerous electrical fault near student residences",
    publicSummary:
      "An exposed electrical panel beside the Halls B entrance walkway was reported, with visible scorching at head height next to a busy foot route. Facilities has acknowledged the case and arranged an inspection. The cause has not been independently established.",
    privateDescription:
      "Exposed wiring and a scorched wall panel on the north side of the residences walkway. Sparks were seen when someone brushed past it in the evening. The panel is at head height beside the main foot traffic route.",
    category: "safety",
    locationGeneral: "North walkway, student residences, Halls B entrance",
    privacyMode: "anonymous",
    verification: "partially_verified",
    verificationReason: "Multiple consistent reports and a supporting photo refer to the same location.",
    response: "acknowledged",
    priority: "urgent",
    publicationState: "public_case",
    screeningFlags: ["sensitive-category:safety"],
    orgSlug: "org-facilities",
    createdOffsetMs: -2 * DAY,
    updatedOffsetMs: -3 * HOUR - 18 * MINUTE,
    incidentOffsetMs: -2 * DAY - 2 * HOUR,
    nextUpdateOffsetMs: 2 * HOUR,
    known: [
      "Three reports within 36 hours refer to the same walkway panel.",
      "A supporting photo was submitted with a recorded checksum.",
      "Facilities acknowledged receipt and assigned an inspection."
    ],
    uncertain: [
      "The exact cause of the fault has not been independently established.",
      "Whether the panel is still energized has not been publicly confirmed.",
      "Resolution has not yet been confirmed."
    ],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "anonymous",
        narrative:
          "Exposed wiring and a scorched wall panel on the north side of the residences walkway. Sparks were seen when someone brushed past it in the evening. The panel is at head height beside the main foot traffic route.",
        areaNote: "North walkway, beside Halls B entrance",
        offsetMs: -2 * DAY,
        trackingTokenHash: demoTokenHash("CS-1042")
      },
      {
        key: "r2",
        role: "corroborating",
        privacyMode: "anonymous",
        narrative: "Same panel still exposed this evening, sparks visible again.",
        areaNote: "Same panel, evening",
        offsetMs: -1 * DAY - 20 * HOUR
      },
      {
        key: "r3",
        role: "corroborating",
        privacyMode: "identified",
        narrative: "I live in Halls B and walk past this panel daily. It is scorched and the cover is missing.",
        areaNote: "Resident, Halls B",
        offsetMs: -1 * DAY - 4 * HOUR,
        contact: { name: "Demo resident (fictional)", email: "resident-b@civora-demo.example", preferredChannel: "email" }
      }
    ],
    evidence: [
      {
        offsetMs: -2 * DAY + 40 * MINUTE,
        kind: "photo",
        title: "Scorched panel on the north walkway",
        sourceType: "citizen",
        submittedByLabel: "Citizen report (anonymous)",
        excerpt: "Photo taken at head height beside the Halls B entrance showing exposed wiring and scorch marks.",
        relationship: "Supports the reported location and visible damage.",
        publicVisible: true,
        fileName: "panel-photo.demo.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 184_320,
        checksum: "0".repeat(64)
      },
      {
        offsetMs: -3 * HOUR - 18 * MINUTE,
        kind: "official",
        title: "Facilities acknowledgement notice",
        sourceType: "official",
        submittedByLabel: "Facilities Department",
        excerpt:
          "Report received and assigned for inspection. An electrical contractor has been requested to assess the panel on the north walkway.",
        relationship: "Official acknowledgement; supports the response state.",
        publicVisible: true,
        sourceRef: "Facilities desk note, 16 Sep (fictional demo record)"
      }
    ],
    events: [
      { offsetMs: -2 * DAY, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Anonymous reporter", visibility: "public", title: "Case reported", detail: "Anonymous report with photo evidence. Initial verification state: Unverified." },
      { offsetMs: -2 * DAY + 40 * MINUTE, type: "EVIDENCE_ADDED", actorType: "reporter", actorLabel: "Anonymous reporter", visibility: "public", title: "Photographic evidence added", detail: "Photo of the scorched panel submitted with the initial report." },
      { offsetMs: -2 * DAY + 45 * MINUTE, type: "PUBLICATION_CHANGED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Published to the community board", detail: "A case handler reviewed the report and published a summary written for publication." },
      { offsetMs: -1 * DAY - 20 * HOUR, type: "POSSIBLE_MATCH_FOUND", actorType: "matching_rule", actorLabel: "Civora matching rule", visibility: "restricted", title: "Possible related report received", detail: "A second report resembles this case. Awaiting review by a case handler." },
      { offsetMs: -1 * DAY - 19 * HOUR, type: "CORROBORATION_CONFIRMED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Corroborating report confirmed", detail: "A case handler confirmed that a second report describes the same panel and location." },
      { offsetMs: -1 * DAY - 4 * HOUR, type: "CORROBORATION_CONFIRMED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Third report confirmed as corroborating", detail: "A resident reported the same fault from an identified account." },
      { offsetMs: -1 * DAY - 3 * HOUR, type: "VERIFICATION_UPDATED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Verification set to Partially verified", detail: "Multiple consistent reports and a supporting photo refer to the same location." },
      { offsetMs: -1 * DAY - 2 * HOUR, type: "CASE_ASSIGNED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Assigned to Facilities Department" },
      { offsetMs: -3 * HOUR - 18 * MINUTE, type: "CASE_ACKNOWLEDGED", actorType: "organization", actorLabel: "Facilities Department", orgSlug: "org-facilities", visibility: "public", title: "Facilities acknowledged the case" },
      { offsetMs: -3 * HOUR - 18 * MINUTE, type: "PUBLIC_UPDATE_ADDED", actorType: "organization", actorLabel: "Facilities Department", orgSlug: "org-facilities", visibility: "public", title: "Official update added" }
    ],
    updates: [
      {
        offsetMs: -3 * HOUR - 18 * MINUTE,
        authorLabel: "Facilities Department",
        orgSlug: "org-facilities",
        body: "Report received and assigned for inspection."
      }
    ],
    notes: [
      {
        offsetMs: -2 * HOUR,
        authorLabel: "R. Mensah (Facilities)",
        body: "Inspection slot requested with the electrical contractor for tomorrow morning. Area has been coned off by grounds staff in the meantime."
      }
    ]
  },
  {
    publicCaseId: "CS-1043",
    caseNumber: 1043,
    title: "Damaged pedestrian crossing sign at market entrance",
    publicSummary:
      "A pedestrian crossing sign at the market entrance was reported as bent and facing the wrong way. Nothing has been verified yet and no organization has taken ownership.",
    privateDescription:
      "The pedestrian crossing sign at the market entrance is bent and facing the wrong way. Drivers are not slowing at the crossing.",
    category: "infrastructure",
    locationGeneral: "Market entrance, pedestrian crossing",
    privacyMode: "identified",
    verification: "unverified",
    response: "received",
    priority: "standard",
    publicationState: "public_case",
    createdOffsetMs: -8 * HOUR,
    updatedOffsetMs: -8 * HOUR,
    incidentOffsetMs: -9 * HOUR,
    known: ["A single initial report has been received."],
    uncertain: [
      "No corroborating reports or supporting evidence exist yet.",
      "No organization has taken ownership of the case yet."
    ],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "identified",
        narrative:
          "The pedestrian crossing sign at the market entrance is bent and facing the wrong way. Drivers are not slowing at the crossing.",
        offsetMs: -8 * HOUR,
        contact: { name: "Demo reporter (fictional)", email: "market@civora-demo.example", preferredChannel: "email" }
      }
    ],
    evidence: [],
    events: [
      { offsetMs: -8 * HOUR, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Identified reporter", visibility: "public", title: "Case reported", detail: "Initial report received. Awaiting triage." }
    ],
    updates: [],
    notes: []
  },
  {
    publicCaseId: "CS-1044",
    caseNumber: 1044,
    title: "Reported dispute over access to a shared facility",
    publicSummary:
      "Two groups have reported conflicting access arrangements for a shared community hall kitchen. The case is on the mediation pathway. Civora records disagreement neutrally and does not determine fault.",
    privateDescription:
      "Two groups report conflicting access arrangements for the shared community hall kitchen on weekday evenings. Both sides describe a prior informal agreement that differs from what the other side says was agreed.",
    category: "dispute",
    locationGeneral: "Community hall kitchen, Elm Ward",
    privacyMode: "identified",
    verification: "partially_verified",
    verificationReason: "Two independent accounts describe the same scheduling disagreement.",
    response: "acknowledged",
    priority: "standard",
    publicationState: "public_case",
    screeningFlags: ["sensitive-category:dispute"],
    orgSlug: "org-mediation",
    createdOffsetMs: -3 * DAY,
    updatedOffsetMs: -1 * DAY,
    incidentOffsetMs: -3 * DAY,
    awaitingReporter: true,
    disputePathway: true,
    known: [
      "Two independent accounts describe the same scheduling disagreement.",
      "Both parties describe the facility as shared under a prior arrangement."
    ],
    uncertain: [
      "No authoritative document on the access arrangements has been submitted yet.",
      "Preferred resolutions have not yet been gathered from participants."
    ],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "identified",
        narrative:
          "Two groups report conflicting access arrangements for the shared community hall kitchen on weekday evenings.",
        offsetMs: -3 * DAY,
        contact: { name: "Demo participant A (fictional)", email: "hall-a@civora-demo.example", preferredChannel: "email" }
      },
      {
        key: "r2",
        role: "corroborating",
        privacyMode: "identified",
        narrative: "We had a prior arrangement for weekday evenings that differs from what the other group describes.",
        areaNote: "Second participant, same arrangement",
        offsetMs: -2 * DAY,
        contact: { name: "Demo participant B (fictional)", email: "hall-b@civora-demo.example", preferredChannel: "email" }
      }
    ],
    evidence: [
      {
        offsetMs: -2 * DAY + 2 * HOUR,
        kind: "note",
        title: "Mediation pathway record",
        sourceType: "official",
        submittedByLabel: "Community Mediation Unit",
        excerpt:
          "Case accepted on the mediation/referral pathway. A mediator will contact participants who opted in. Civora does not determine fault and does not label parties.",
        relationship: "Documents the chosen pathway for the case.",
        publicVisible: true,
        sourceRef: "Mediation intake record (fictional demo record)"
      }
    ],
    events: [
      { offsetMs: -3 * DAY, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Identified reporter", visibility: "public", title: "Reported disagreement received", detail: "Civora records disagreement neutrally; it does not determine fault." },
      { offsetMs: -2 * DAY, type: "CORROBORATION_CONFIRMED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Second participant account confirmed" },
      { offsetMs: -2 * DAY + 2 * HOUR, type: "CASE_ASSIGNED", actorType: "responder", actorLabel: "Response desk", visibility: "public", title: "Assigned to Community Mediation Unit", detail: "Mediation/referral pathway selected." },
      { offsetMs: -1 * DAY, type: "INFO_REQUESTED", actorType: "organization", actorLabel: "Community Mediation Unit", orgSlug: "org-mediation", visibility: "public", title: "Additional information requested", detail: "The mediation unit requested scheduling details and any written arrangement from participants." }
    ],
    updates: [],
    notes: [],
    infoRequests: [
      {
        offsetMs: -1 * DAY,
        requestedByLabel: "Community Mediation Unit",
        orgSlug: "org-mediation",
        message:
          "Could you share the weekday evening schedule you were working to, and any written note of the original arrangement? You can reply from your case page — nothing you send becomes public.",
        status: "open"
      }
    ]
  },
  {
    publicCaseId: "CS-1045",
    caseNumber: 1045,
    title: "Safety concern reported — Halls B walkway",
    publicSummary:
      "A safety concern in the student residences area has been reported. Details are held with the case handlers while the report is reviewed; nothing here has been verified yet.",
    privateDescription:
      "Sparking from the wall box on the walkway by Halls B again tonight. Cover is still off and the wall above it is black. Someone is going to get hurt.",
    category: "safety",
    locationGeneral: "North walkway, Halls B entrance, student residences",
    privacyMode: "anonymous",
    verification: "unverified",
    response: "received",
    priority: "urgent",
    // Held for review: a safety report is not published on submission.
    publicationState: "screening",
    screeningFlags: ["sensitive-category:safety"],
    createdOffsetMs: -5 * HOUR,
    updatedOffsetMs: -5 * HOUR,
    incidentOffsetMs: -6 * HOUR,
    known: ["A single initial report has been received."],
    uncertain: [
      "No corroborating reports or supporting evidence exist yet.",
      "No organization has taken ownership of the case yet."
    ],
    reports: [
      {
        key: "r1",
        role: "initial",
        privacyMode: "anonymous",
        narrative:
          "Sparking from the wall box on the walkway by Halls B again tonight. Cover is still off and the wall above it is black. Someone is going to get hurt.",
        areaNote: "North walkway, Halls B entrance",
        offsetMs: -5 * HOUR
      }
    ],
    evidence: [],
    events: [
      { offsetMs: -5 * HOUR, type: "REPORT_SUBMITTED", actorType: "reporter", actorLabel: "Anonymous reporter", visibility: "public", title: "Case reported", detail: "Initial report received. Verification state: Unverified. Reporter privacy: anonymous." },
      { offsetMs: -5 * HOUR, type: "PUBLICATION_CHANGED", actorType: "system", actorLabel: "Civora", visibility: "restricted", title: "Held for publication review", detail: "Automatic screening flagged: sensitive-category:safety." }
    ],
    updates: [],
    notes: []
  }
];

/**
 * The seeded corroboration candidate: CS-1045 looks like CS-1042 to the
 * matching engine, but nothing has been confirmed. It sits in the responder
 * queue as a proposal, which is the point — a heuristic never decides.
 */
export const DEMO_LINKS: DemoLink[] = [
  {
    sourcePublicId: "CS-1045",
    targetPublicId: "CS-1042",
    score: 0.78,
    signals: {
      category: true,
      timeProximityHours: 42,
      timeScore: 0.42,
      locationScore: 0.86,
      locationSpecificTokens: 2,
      textScore: 0.31,
      textSharedTokens: 5,
      duplicateFingerprint: false
    },
    status: "proposed",
    createdOffsetMs: -5 * HOUR
  }
];

export interface DemoCivicItem {
  id: string;
  title: string;
  category: CivicCategory;
  country: string;
  region?: string;
  locality?: string;
  level: JurisdictionLevel;
  explanation: string;
  officialSource: string;
  sourceUrl?: string;
  sourceAuthority: string;
  publishedOffsetMs: number;
  lastVerifiedOffsetMs: number;
  freshnessThresholdDays: number;
  verificationMethod?: string;
  eligibility?: string;
  requirements?: string[];
  fees?: string;
  deadlines?: string;
  contactInfo?: string;
  // `label` is the English wording; `labelKey` is what the interface actually
  // renders, so an action button is not the one part of a translated page that
  // stays in English. NextActionsPanel prefers the key and falls back to label.
  nextActions: Array<{ label: string; labelKey?: string; type: string; href?: string }>;
  relatedCaseIds?: string[];
  whatRemainsUncertain?: string[];
  tags?: string[];
  /**
   * The item's own text in the other languages the interface offers.
   *
   * Translating the chrome and leaving the civic information in English means a
   * Swahili reader gets a Swahili menu over an English answer, which is the
   * part they actually came for. These are written translations, not machine
   * output: the reader is told which they are looking at, and a language with
   * no version here falls back to the source text rather than to a guess.
   */
  languageVersions?: Record<
    string,
    {
      title: string;
      explanation: string;
      eligibility?: string;
      requirements?: string[];
      whatRemainsUncertain?: string[];
    }
  >;
}

export const DEMO_CIVIC_ITEMS: DemoCivicItem[] = [
  {
    id: "CIV-ELEC-01",
    title: "Electrical Safety Standards in Public Areas",
    category: "safety",
    country: "Nigeria",
    region: "Kano State",
    level: "state",
    explanation:
      "Public areas and walkways must have properly insulated electrical fittings. Any exposed wiring or scorched panels must be isolated within 24 hours of reporting.",
    officialSource: "State Electricity Board",
    sourceAuthority: "Regulatory Agency",
    publishedOffsetMs: -180 * DAY,
    lastVerifiedOffsetMs: -10 * DAY,
    freshnessThresholdDays: 30,
    verificationMethod: "Checked against published state regulations (2024 handbook)",
    nextActions: [
      { label: "Report a fault", labelKey: "civic.action.report_fault", type: "report", href: "/report" },
      { label: "View full regulations", labelKey: "civic.action.view_regulations", type: "link" }
    ],
    relatedCaseIds: ["CS-1042"],
    tags: ["electrical", "safety", "walkway"],
    languageVersions: {
      fr: {
        title: "Normes de s\u00e9curit\u00e9 \u00e9lectrique dans les espaces publics",
        explanation:
          "Les espaces publics et les passages doivent \u00eatre \u00e9quip\u00e9s d'installations \u00e9lectriques correctement isol\u00e9es. Tout c\u00e2blage expos\u00e9 ou panneau calcin\u00e9 doit \u00eatre mis hors tension dans les 24 heures suivant le signalement."
      },
      ar: {
        title: "\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629 \u0641\u064a \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0639\u0627\u0645\u0629",
        explanation:
          "\u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0627\u0644\u062a\u0631\u0643\u064a\u0628\u0627\u062a \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629 \u0641\u064a \u0627\u0644\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u0639\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0645\u0631\u0627\u062a \u0645\u0639\u0632\u0648\u0644\u0629 \u0639\u0632\u0644\u064b\u0627 \u0633\u0644\u064a\u0645\u064b\u0627. \u0648\u064a\u062c\u0628 \u0641\u0635\u0644 \u0623\u064a \u0623\u0633\u0644\u0627\u0643 \u0645\u0643\u0634\u0648\u0641\u0629 \u0623\u0648 \u0644\u0648\u062d\u0629 \u0645\u062d\u062a\u0631\u0642\u0629 \u0639\u0646 \u0627\u0644\u062a\u064a\u0627\u0631 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629 \u0645\u0646 \u0627\u0644\u0625\u0628\u0644\u0627\u063a."
      },
      sw: {
        title: "Viwango vya Usalama wa Umeme katika Maeneo ya Umma",
        explanation:
          "Maeneo ya umma na njia za watembea kwa miguu lazima yawe na vifaa vya umeme vilivyofunikwa ipasavyo. Waya wowote ulio wazi au paneli iliyoungua lazima itenganishwe na umeme ndani ya saa 24 baada ya kuripotiwa."
      }
    }
  },
  {
    id: "CIV-WATER-01",
    title: "Rights During Emergency Water Outages",
    category: "right",
    country: "Nigeria",
    level: "federal",
    explanation:
      "If a municipal water outage lasts longer than 48 hours, the utility is required to provide alternative water access points or tankers for affected communities.",
    officialSource: "National Water Resources Commission",
    sourceAuthority: "Federal Commission",
    publishedOffsetMs: -400 * DAY,
    lastVerifiedOffsetMs: -60 * DAY,
    freshnessThresholdDays: 30,
    whatRemainsUncertain: ["The exact locations of emergency tankers are not always published in advance."],
    nextActions: [{ label: "Contact Utility", labelKey: "civic.action.contact_utility", type: "contact" }],
    relatedCaseIds: ["CS-1040"],
    tags: ["water", "outage", "rights"],
    languageVersions: {
      fr: {
        whatRemainsUncertain: [
          "Les emplacements exacts des citernes d'urgence ne sont pas toujours publi\u00e9s \u00e0 l'avance."
        ],
        title: "Droits en cas de coupure d'eau d'urgence",
        explanation:
          "Si une coupure d'eau municipale dure plus de 48 heures, le service des eaux est tenu de fournir des points d'eau de substitution ou des citernes aux communaut\u00e9s concern\u00e9es."
      },
      sw: {
        whatRemainsUncertain: [
          "Maeneo kamili ya magari ya maji ya dharura hayatangazwi mapema kila wakati."
        ],
        title: "Haki Wakati wa Kukatika kwa Maji kwa Dharura",
        explanation:
          "Iwapo kukatika kwa maji ya manispaa kunazidi saa 48, mamlaka ya maji inawajibika kutoa vituo mbadala vya maji au magari ya maji kwa jamii zilizoathirika."
      }
    }
  },
  {
    id: "CIV-MED-01",
    title: "Community Dispute Mediation Service",
    category: "service",
    country: "Nigeria",
    region: "Kano State",
    locality: "Kano Municipal",
    level: "local",
    explanation:
      "Free neutral mediation for disputes over shared community resources, land boundaries, and neighborhood noise. Process is confidential and voluntary.",
    officialSource: "Municipal Mediation Center",
    sourceAuthority: "Local Government",
    publishedOffsetMs: -120 * DAY,
    lastVerifiedOffsetMs: -5 * DAY,
    freshnessThresholdDays: 90,
    eligibility: "Residents of Kano Municipal",
    requirements: ["Both parties must agree to mediate", "Valid ID"],
    fees: "Free of charge",
    nextActions: [{ label: "Apply for mediation", labelKey: "civic.action.apply_mediation", type: "apply" }],
    relatedCaseIds: ["CS-1044"],
    tags: ["mediation", "dispute", "community"],
    languageVersions: {
      fr: {
        title: "Service communautaire de m\u00e9diation des litiges",
        explanation:
          "M\u00e9diation neutre et gratuite pour les litiges portant sur les ressources communes, les limites de terrain et le bruit de voisinage. La proc\u00e9dure est confidentielle et volontaire.",
        eligibility: "R\u00e9sidents de la municipalit\u00e9 de Kano",
        requirements: ["Les deux parties doivent accepter la m\u00e9diation", "Pi\u00e8ce d'identit\u00e9 en cours de validit\u00e9"]
      },
      sw: {
        title: "Huduma ya Usuluhishi wa Migogoro ya Jamii",
        explanation:
          "Usuluhishi huru na bila malipo kwa migogoro inayohusu rasilimali za pamoja, mipaka ya ardhi na kelele za jirani. Utaratibu ni wa siri na wa hiari.",
        eligibility: "Wakazi wa Manispaa ya Kano",
        requirements: ["Pande zote mbili lazima zikubali kusuluhishwa", "Kitambulisho halali"]
      }
    }
  },
  {
    id: "CIV-POLICY-01",
    title: "Market Pavilion Refurbishment Program",
    category: "project",
    country: "Nigeria",
    region: "Kano State",
    level: "state",
    explanation:
      "A state-funded project to refurbish 5 major market pavilions. Phase 1 covers structural repairs, Phase 2 covers internal fit-outs.",
    officialSource: "State Ministry of Works",
    sourceAuthority: "State Ministry",
    publishedOffsetMs: -200 * DAY,
    lastVerifiedOffsetMs: -2 * DAY,
    freshnessThresholdDays: 14,
    verificationMethod: "Cross-referenced budget summaries and procurement records.",
    whatRemainsUncertain: [
      "Whether Phase 1 is actually complete, as public notices and procurement records disagree."
    ],
    nextActions: [{ label: "Track related cases", labelKey: "civic.action.track_cases", type: "internal", href: "/community" }],
    relatedCaseIds: ["CS-1038"],
    tags: ["project", "market", "budget"],
    languageVersions: {
      fr: {
        whatRemainsUncertain: [
          "Si la phase 1 est r\u00e9ellement achev\u00e9e : les avis publics et les dossiers de march\u00e9 se contredisent."
        ],
        title: "Programme de r\u00e9novation des halles de march\u00e9",
        explanation:
          "Projet financ\u00e9 par l'\u00c9tat pour r\u00e9nover 5 grandes halles de march\u00e9. La phase 1 couvre les r\u00e9parations structurelles, la phase 2 les am\u00e9nagements int\u00e9rieurs."
      },
      sw: {
        whatRemainsUncertain: [
          "Kama awamu ya kwanza imekamilika kweli: matangazo ya umma na kumbukumbu za manunuzi zinapingana."
        ],
        title: "Mpango wa Ukarabati wa Mabanda ya Soko",
        explanation:
          "Mradi unaofadhiliwa na serikali ya jimbo wa kukarabati mabanda makuu 5 ya soko. Awamu ya kwanza inahusu ukarabati wa msingi, awamu ya pili inahusu vifaa vya ndani."
      }
    }
  },

  // ── A second and third jurisdiction ──────────────────────────────────────────
  //
  // Civora's claim is that the same structure carries a different country's
  // civic information, so the corpus exercises it rather than asserting it.
  // These items are governed by different authorities at different levels, and
  // their source language is not English: the Senegalese items are written in
  // French by their issuing authority and the Tanzanian ones in Swahili, with
  // the English base text as the translation. Nothing in the model prefers
  // English — `languageVersions` carries whichever languages exist, and a
  // reader whose language is missing is shown the source text, labelled.
  {
    id: "CIV-SN-ETAT-01",
    title: "Replacing a lost birth certificate",
    category: "procedure",
    country: "Senegal",
    region: "Dakar",
    locality: "Dakar Plateau",
    level: "local",
    explanation:
      "A duplicate birth certificate is issued by the civil registry office of the district where the birth was recorded, not where the applicant now lives. A request made at the wrong office is refused rather than forwarded.",
    officialSource: "Bureau de l'\u00e9tat civil, Dakar Plateau",
    sourceAuthority: "Municipal Authority",
    publishedOffsetMs: -300 * DAY,
    lastVerifiedOffsetMs: -8 * DAY,
    freshnessThresholdDays: 60,
    verificationMethod: "Confirmed against the municipal fee schedule and counter hours published for the current year.",
    eligibility: "The person named on the record, a parent, or a legal guardian with proof of relationship.",
    requirements: [
      "The district where the birth was registered",
      "Valid photo identification",
      "Proof of relationship if applying on behalf of someone else"
    ],
    fees: "1,000 FCFA per copy",
    deadlines: "Counter requests are processed within 5 working days.",
    nextActions: [
      { label: "Find your registry office", labelKey: "civic.action.find_registry", type: "link" },
      { label: "Report a refused request", labelKey: "civic.action.report_refused_request", type: "report", href: "/report" }
    ],
    whatRemainsUncertain: [
      "Whether offices outside Dakar charge the same fee \u2014 the published schedule covers the capital only."
    ],
    tags: ["civil registry", "birth certificate", "identity", "senegal"],
    languageVersions: {
      fr: {
        whatRemainsUncertain: [
          "Si les bureaux hors de Dakar appliquent le m\u00eame tarif \u2014 le bar\u00e8me publi\u00e9 ne couvre que la capitale."
        ],
        title: "Obtenir un duplicata d'acte de naissance",
        explanation:
          "Le duplicata d'un acte de naissance est d\u00e9livr\u00e9 par le bureau de l'\u00e9tat civil de la commune o\u00f9 la naissance a \u00e9t\u00e9 enregistr\u00e9e, et non celle o\u00f9 le demandeur r\u00e9side aujourd'hui. Une demande d\u00e9pos\u00e9e au mauvais bureau est refus\u00e9e et non transmise.",
        eligibility: "La personne concern\u00e9e, un parent, ou un tuteur l\u00e9gal pouvant justifier du lien.",
        requirements: [
          "La commune d'enregistrement de la naissance",
          "Une pi\u00e8ce d'identit\u00e9 avec photo en cours de validit\u00e9",
          "Un justificatif de lien de parent\u00e9 en cas de demande pour un tiers"
        ]
      },
      sw: {
        whatRemainsUncertain: [
          "Kama ofisi zilizo nje ya Dakar hutoza ada ile ile \u2014 orodha iliyochapishwa inahusu mji mkuu pekee."
        ],
        title: "Kupata nakala ya cheti cha kuzaliwa kilichopotea",
        explanation:
          "Nakala ya cheti cha kuzaliwa hutolewa na ofisi ya usajili wa raia ya eneo ambalo kuzaliwa kulisajiliwa, si eneo analoishi mwombaji sasa. Ombi linalowasilishwa ofisi isiyo sahihi hukataliwa badala ya kupelekwa mbele.",
        eligibility: "Mtu aliyetajwa kwenye cheti, mzazi, au mlezi wa kisheria mwenye ushahidi wa uhusiano.",
        requirements: [
          "Eneo ambalo kuzaliwa kulisajiliwa",
          "Kitambulisho halali chenye picha",
          "Ushahidi wa uhusiano iwapo unaomba kwa niaba ya mtu mwingine"
        ]
      }
    }
  },
  {
    id: "CIV-SN-FORM-01",
    title: "Vocational training places for young people",
    category: "opportunity",
    country: "Senegal",
    level: "federal",
    explanation:
      "Funded places on six-month vocational courses are allocated twice a year. Places are allocated by application date within each region, not nationally, so a region's allocation can close while another still has places.",
    officialSource: "Direction nationale de la formation professionnelle",
    sourceAuthority: "National Directorate",
    publishedOffsetMs: -220 * DAY,
    lastVerifiedOffsetMs: -75 * DAY,
    freshnessThresholdDays: 45,
    verificationMethod: "Checked against the last published allocation circular. The circular for the coming intake has not been issued.",
    eligibility: "Applicants aged 18\u201335 who are not currently in full-time education.",
    requirements: ["Proof of age", "Evidence of residence in the region applied to"],
    fees: "No application fee. Course materials are not covered.",
    nextActions: [
      { label: "Check your region's allocation", labelKey: "civic.action.check_allocation", type: "link" },
      { label: "Contact the directorate", labelKey: "civic.action.contact_directorate", type: "contact" }
    ],
    whatRemainsUncertain: [
      "The opening date of the next intake. The previous circular has expired and no replacement has been published.",
      "Whether unused places in one region are reallocated to another."
    ],
    tags: ["training", "youth", "opportunity", "senegal"],
    languageVersions: {
      fr: {
        whatRemainsUncertain: [
          "La date d'ouverture de la prochaine session. La circulaire pr\u00e9c\u00e9dente a expir\u00e9 et aucune autre n'a \u00e9t\u00e9 publi\u00e9e.",
          "Si les places non utilis\u00e9es dans une r\u00e9gion sont r\u00e9attribu\u00e9es \u00e0 une autre."
        ],
        title: "Places de formation professionnelle pour les jeunes",
        explanation:
          "Des places financ\u00e9es en formation professionnelle de six mois sont attribu\u00e9es deux fois par an. L'attribution se fait par date de d\u00e9p\u00f4t au sein de chaque r\u00e9gion, et non au niveau national : le quota d'une r\u00e9gion peut donc \u00eatre \u00e9puis\u00e9 alors qu'une autre dispose encore de places.",
        eligibility: "Candidats de 18 \u00e0 35 ans qui ne suivent pas d'\u00e9tudes \u00e0 temps plein.",
        requirements: ["Justificatif d'\u00e2ge", "Justificatif de r\u00e9sidence dans la r\u00e9gion demand\u00e9e"]
      },
      sw: {
        whatRemainsUncertain: [
          "Tarehe ya kuanza kwa awamu ijayo. Waraka uliopita umeisha muda na hakuna mwingine uliotolewa.",
          "Kama nafasi zisizotumika katika mkoa mmoja hugawiwa upya mkoa mwingine."
        ],
        title: "Nafasi za mafunzo ya ufundi kwa vijana",
        explanation:
          "Nafasi zinazofadhiliwa katika kozi za ufundi za miezi sita hugawanywa mara mbili kwa mwaka. Ugawaji hufanyika kwa tarehe ya maombi ndani ya kila mkoa, si kitaifa, hivyo nafasi za mkoa mmoja zinaweza kuisha wakati mkoa mwingine bado una nafasi.",
        eligibility: "Waombaji wenye umri wa miaka 18\u201335 ambao hawako masomoni kwa muda wote.",
        requirements: ["Ushahidi wa umri", "Ushahidi wa makazi katika mkoa unaoombewa"]
      }
    }
  },
  {
    id: "CIV-TZ-ARDHI-01",
    title: "Taking a land boundary dispute to a ward tribunal",
    category: "right",
    country: "Tanzania",
    region: "Dar es Salaam",
    level: "state",
    explanation:
      "A boundary dispute between neighbours is heard first by the ward tribunal, which must attempt mediation before it rules. A case filed straight at the district land office is sent back, and the delay counts against no one.",
    officialSource: "Ward Tribunal Secretariat, Dar es Salaam",
    sourceAuthority: "Regional Authority",
    publishedOffsetMs: -260 * DAY,
    lastVerifiedOffsetMs: -12 * DAY,
    freshnessThresholdDays: 60,
    verificationMethod: "Confirmed against the tribunal's published sitting procedure and filing fee notice.",
    eligibility: "Either party to the dispute, or a representative carrying written authority.",
    requirements: [
      "A written statement of the disputed boundary",
      "Any document showing occupation or ownership",
      "Names and addresses of both parties"
    ],
    fees: "Filing is free. A surveyor's report, if the tribunal orders one, is paid by the party that requested it.",
    nextActions: [
      { label: "Find your ward tribunal", labelKey: "civic.action.find_tribunal", type: "link" },
      { label: "Report a refused filing", labelKey: "civic.action.report_refused_filing", type: "report", href: "/report" }
    ],
    tags: ["land", "dispute", "tribunal", "tanzania"],
    languageVersions: {
      ar: {
        title: "\u0631\u0641\u0639 \u0646\u0632\u0627\u0639 \u0639\u0644\u0649 \u062d\u062f\u0648\u062f \u0627\u0644\u0623\u0631\u0636 \u0625\u0644\u0649 \u0645\u062c\u0644\u0633 \u0627\u0644\u062d\u064a",
        explanation:
          "\u064a\u064f\u0646\u0638\u0631 \u0641\u064a \u0646\u0632\u0627\u0639 \u0627\u0644\u062d\u062f\u0648\u062f \u0628\u064a\u0646 \u0627\u0644\u062c\u064a\u0631\u0627\u0646 \u0623\u0648\u0644\u064b\u0627 \u0623\u0645\u0627\u0645 \u0645\u062c\u0644\u0633 \u0627\u0644\u062d\u064a\u060c \u0627\u0644\u0630\u064a \u064a\u062c\u0628 \u0639\u0644\u064a\u0647 \u0645\u062d\u0627\u0648\u0644\u0629 \u0627\u0644\u0648\u0633\u0627\u0637\u0629 \u0642\u0628\u0644 \u0625\u0635\u062f\u0627\u0631 \u062d\u0643\u0645\u0647. \u0648\u0627\u0644\u062f\u0639\u0648\u0649 \u0627\u0644\u062a\u064a \u062a\u064f\u0631\u0641\u0639 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0645\u0643\u062a\u0628 \u0627\u0644\u0623\u0631\u0627\u0636\u064a \u062a\u064f\u0639\u0627\u062f\u060c \u0648\u0644\u0627 \u064a\u064f\u062d\u0633\u0628 \u0647\u0630\u0627 \u0627\u0644\u062a\u0623\u062e\u064a\u0631 \u0639\u0644\u0649 \u0623\u062d\u062f."
      },
      sw: {
        title: "Kupeleka mgogoro wa mpaka wa ardhi kwenye baraza la kata",
        explanation:
          "Mgogoro wa mpaka kati ya majirani husikilizwa kwanza na baraza la kata, ambalo lazima lijaribu usuluhishi kabla ya kutoa uamuzi. Shauri linalopelekwa moja kwa moja ofisi ya ardhi ya wilaya hurudishwa, na ucheleweshaji huo haumhesabiwi mtu yeyote.",
        eligibility: "Upande wowote katika mgogoro, au mwakilishi mwenye idhini ya maandishi.",
        requirements: [
          "Maelezo ya maandishi ya mpaka unaobishaniwa",
          "Hati yoyote inayoonyesha umiliki au matumizi",
          "Majina na anwani za pande zote mbili"
        ]
      },
      fr: {
        title: "Porter un litige de bornage devant le tribunal de quartier",
        explanation:
          "Un litige de bornage entre voisins est d'abord examin\u00e9 par le tribunal de quartier, qui doit tenter une m\u00e9diation avant de statuer. Un dossier d\u00e9pos\u00e9 directement au service foncier du district est renvoy\u00e9, et ce d\u00e9lai n'est imput\u00e9 \u00e0 personne.",
        eligibility: "L'une ou l'autre partie au litige, ou un repr\u00e9sentant muni d'une autorisation \u00e9crite.",
        requirements: [
          "Un expos\u00e9 \u00e9crit de la limite contest\u00e9e",
          "Tout document attestant l'occupation ou la propri\u00e9t\u00e9",
          "Les noms et adresses des deux parties"
        ]
      }
    }
  },
  {
    id: "CIV-TZ-MAJI-01",
    title: "Who maintains a community water point",
    category: "policy",
    country: "Tanzania",
    level: "federal",
    explanation:
      "A community water point is maintained by the registered water user association for that point, funded from the tariff it collects. Where no association is registered, responsibility sits with the district water engineer \u2014 which is the case for most points that have stopped working.",
    officialSource: "National Water Supply Directorate",
    sourceAuthority: "National Directorate",
    publishedOffsetMs: -520 * DAY,
    lastVerifiedOffsetMs: -140 * DAY,
    freshnessThresholdDays: 60,
    verificationMethod: "Last confirmed against the national maintenance policy. Two district circulars issued since then have not been reconciled with it.",
    nextActions: [
      { label: "Report a broken water point", labelKey: "civic.action.report_water_point", type: "report", href: "/report" },
      { label: "Track related cases", labelKey: "civic.action.track_cases", type: "internal", href: "/community" }
    ],
    whatRemainsUncertain: [
      "Whether the district circulars supersede the national policy on who pays for parts.",
      "Which points have a registered association \u2014 no public register is published."
    ],
    tags: ["water", "maintenance", "policy", "tanzania"],
    languageVersions: {
      sw: {
        whatRemainsUncertain: [
          "Kama waraka wa wilaya unabatilisha sera ya kitaifa kuhusu nani analipia vipuri.",
          "Ni vituo vipi vina jumuiya iliyosajiliwa \u2014 hakuna daftari la umma lililochapishwa."
        ],
        title: "Nani anayehudumia kituo cha maji cha jamii",
        explanation:
          "Kituo cha maji cha jamii huhudumiwa na jumuiya ya watumiaji maji iliyosajiliwa kwa kituo hicho, kwa kutumia ada inayokusanywa. Pale ambapo hakuna jumuiya iliyosajiliwa, jukumu ni la mhandisi wa maji wa wilaya \u2014 na hivyo ndivyo ilivyo kwa vituo vingi vilivyoacha kufanya kazi.",
        requirements: []
      },
      fr: {
        whatRemainsUncertain: [
          "Si les circulaires du district l'emportent sur la politique nationale quant \u00e0 qui paie les pi\u00e8ces.",
          "Quels points disposent d'une association enregistr\u00e9e \u2014 aucun registre public n'est publi\u00e9."
        ],
        title: "Qui entretient un point d'eau communautaire",
        explanation:
          "Un point d'eau communautaire est entretenu par l'association d'usagers de l'eau enregistr\u00e9e pour ce point, sur les recettes du tarif qu'elle per\u00e7oit. En l'absence d'association enregistr\u00e9e, la responsabilit\u00e9 incombe \u00e0 l'ing\u00e9nieur des eaux du district \u2014 ce qui est le cas de la plupart des points hors service.",
        requirements: []
      }
    }
  }
];

/** Highest seeded case number; the sequence starts above it. */
export const DEMO_MAX_CASE_NUMBER = 1045;
