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
  nextActions: Array<{ label: string; type: string; href?: string }>;
  relatedCaseIds?: string[];
  whatRemainsUncertain?: string[];
  tags?: string[];
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
      { label: "Report a fault", type: "report" },
      { label: "View full regulations", type: "link" }
    ],
    relatedCaseIds: ["CS-1042"],
    tags: ["electrical", "safety", "walkway"]
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
    nextActions: [{ label: "Contact Utility", type: "contact" }],
    relatedCaseIds: ["CS-1040"],
    tags: ["water", "outage", "rights"]
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
    nextActions: [{ label: "Apply for mediation", type: "apply" }],
    relatedCaseIds: ["CS-1044"],
    tags: ["mediation", "dispute", "community"]
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
    nextActions: [{ label: "Track related cases", type: "internal", href: "/community" }],
    relatedCaseIds: ["CS-1038"],
    tags: ["project", "market", "budget"]
  }
];

/** Highest seeded case number; the sequence starts above it. */
export const DEMO_MAX_CASE_NUMBER = 1045;
