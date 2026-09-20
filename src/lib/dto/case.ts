import type {
  CaseCategory,
  CasePriority,
  EventType,
  PrivacyMode,
  PublicationState,
  ResponseState,
  VerificationState,
  Visibility,
  EvidenceKind,
  EvidenceSourceType,
  LinkStatus
} from "@prisma/client";
import type { ViewerRole } from "../authz";
import { isResolved } from "../case-state";
import { PUBLICATION_DESCRIPTION, PUBLICATION_LABEL } from "../publication";
import type { CaseWithRelations } from "../db/repository";

// Explicit data-transfer objects.
//
// Nothing in Civora serializes a database row and deletes a few fields
// afterwards. Each view is *constructed* from named fields, so a column added
// to the schema later cannot leak into a public response by default.

export interface PublicEvidenceView {
  id: string;
  kind: EvidenceKind;
  title: string;
  sourceType: EvidenceSourceType;
  submittedByLabel: string;
  submittedAt: string;
  excerpt?: string;
  relationship: string;
  checksum?: string;
  sourceRef?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  /** True when a file exists and this viewer may fetch it. */
  hasFile: boolean;
  publicVisible: boolean;
}

export interface CaseEventView {
  id: string;
  type: EventType;
  at: string;
  actorLabel: string;
  visibility: Visibility;
  title: string;
  detail?: string;
}

export interface CaseUpdateView {
  id: string;
  at: string;
  authorLabel: string;
  body: string;
}

export interface ProgressStep {
  key: string;
  labelKey: string;
  label: string;
  done: boolean;
  at?: string;
  current: boolean;
}

export interface PublicCaseView {
  role: ViewerRole;
  id: string;
  title: string;
  /** Text written for publication. Never the raw report. */
  summary: string;
  category: CaseCategory;
  locationGeneral?: string;
  incidentAt: string;
  verification: VerificationState;
  response: ResponseState;
  priority: CasePriority;
  publicationState: PublicationState;
  publicationLabel: string;
  publicationDescription: string;
  privacyMode: PrivacyMode;
  disputePathway: boolean;
  awaitingReporter: boolean;
  nextUpdateAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  known: string[];
  uncertain: string[];
  orgName?: string;
  orgContactEmail?: string;
  evidence: PublicEvidenceView[];
  events: CaseEventView[];
  updates: CaseUpdateView[];
  progress: ProgressStep[];
  counts: { reports: number; evidence: number; updates: number; photos: number; confirmedLinks: number };
  resolved: boolean;
}

export interface InfoRequestView {
  id: string;
  message: string;
  status: "open" | "answered" | "cancelled";
  requestedByLabel: string;
  createdAt: string;
  answeredAt?: string;
  answerBody?: string;
}

export interface ReporterCaseView extends PublicCaseView {
  role: "reporter";
  /** The reporter's own narrative, shown back only to them. */
  yourReport: string;
  /** Evidence restricted from the public board but belonging to this reporter. */
  restrictedEvidenceCount: number;
  openInfoRequests: InfoRequestView[];
  canAddEvidence: boolean;
  canRequestUpdate: boolean;
}

export interface CaseLinkView {
  id: string;
  status: LinkStatus;
  score: number;
  signals: Record<string, unknown>;
  otherCaseId: string;
  otherCaseTitle: string;
  direction: "incoming" | "outgoing";
  createdAt: string;
  decidedAt?: string;
  decisionNote?: string;
}

export interface ResponderCaseView extends Omit<PublicCaseView, "role"> {
  role: "responder" | "admin";
  /** Full reporter narrative — restricted to authorized handlers. */
  privateDescription: string;
  /** Present only for confidential/identified reports, never for anonymous. */
  reporterContact?: { name?: string; email?: string; phone?: string; preferredChannel?: string };
  coordinates?: { lat: number; lng: number };
  screeningFlags: string[];
  verificationReason?: string;
  notes: Array<{ id: string; at: string; authorLabel: string; body: string }>;
  links: CaseLinkView[];
  infoRequests: InfoRequestView[];
  assignedOrgId?: string;
  reports: Array<{ id: string; role: string; privacyMode: PrivacyMode; receivedAt: string; areaNote?: string }>;
}

export interface CaseRowView {
  id: string;
  title: string;
  category: CaseCategory;
  locationGeneral?: string;
  verification: VerificationState;
  response: ResponseState;
  priority: CasePriority;
  updatedAt: string;
  resolved: boolean;
  dispute: boolean;
  href: string;
}

// ---------------------------------------------------------------- builders

function iso(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

function evidenceView(
  e: CaseWithRelations["evidence"][number],
  canSeeRestricted: boolean
): PublicEvidenceView {
  return {
    id: e.id,
    kind: e.kind,
    title: e.title,
    sourceType: e.sourceType,
    submittedByLabel: e.submittedByLabel,
    submittedAt: e.submittedAt.toISOString(),
    excerpt: e.excerpt ?? undefined,
    relationship: e.relationship,
    checksum: e.checksum ?? undefined,
    sourceRef: e.sourceRef ?? undefined,
    fileName: e.fileName ?? undefined,
    mimeType: e.mimeType ?? undefined,
    sizeBytes: e.sizeBytes ?? undefined,
    hasFile: Boolean(e.storageKey) && (e.publicVisible || canSeeRestricted),
    publicVisible: e.publicVisible
  };
}

function eventView(e: CaseWithRelations["events"][number]): CaseEventView {
  return {
    id: e.id,
    type: e.type,
    at: e.at.toISOString(),
    actorLabel: e.actorLabel,
    visibility: e.visibility,
    title: e.title,
    detail: e.detail ?? undefined
  };
}

function buildProgress(c: CaseWithRelations): ProgressStep[] {
  const eventAt = (type: EventType) => iso(c.events.find((e) => e.type === type)?.at);
  const confirmedLinks = c.linksTo.filter((l) => l.status === "confirmed").length +
    c.linksFrom.filter((l) => l.status === "confirmed").length;
  const hasEvidence = c.evidence.some((e) => e.kind !== "report");
  const assigned = Boolean(c.assignedOrgId);
  const responded = ["acknowledged", "in_progress", "action_recorded", "closed"].includes(c.response);
  const closed = c.response === "closed";

  const steps: ProgressStep[] = [
    { key: "reported", labelKey: "case.progress.reported", label: "Reported", done: true, at: c.createdAt.toISOString(), current: false },
    { key: "evidence", labelKey: "case.progress.evidence", label: "Evidence added", done: hasEvidence, at: eventAt("EVIDENCE_ADDED"), current: false },
    { key: "corroborated", labelKey: "case.progress.corroborated", label: "Corroborated", done: confirmedLinks > 0, at: eventAt("CORROBORATION_CONFIRMED"), current: false },
    { key: "assigned", labelKey: "case.progress.assigned", label: "Assigned", done: assigned, at: eventAt("CASE_ASSIGNED"), current: false },
    { key: "response", labelKey: "case.progress.response", label: closed ? "Response recorded" : "Response pending", done: responded, at: eventAt("CASE_ACKNOWLEDGED"), current: false },
    { key: "resolved", labelKey: "case.progress.resolved", label: "Resolved", done: closed, at: eventAt("CASE_CLOSED"), current: false }
  ];
  const firstOpen = steps.find((s) => !s.done);
  if (firstOpen) firstOpen.current = true;
  return steps;
}

function counts(c: CaseWithRelations) {
  return {
    reports: c.reports.length,
    evidence: c.evidence.length,
    updates: c.updates.length,
    photos: c.evidence.filter((e) => e.kind === "photo").length,
    confirmedLinks:
      c.linksTo.filter((l) => l.status === "confirmed").length +
      c.linksFrom.filter((l) => l.status === "confirmed").length
  };
}

function base(c: CaseWithRelations, role: ViewerRole, canSeeRestricted: boolean): PublicCaseView {
  const events = canSeeRestricted ? c.events : c.events.filter((e) => e.visibility === "public");
  const evidence = canSeeRestricted ? c.evidence : c.evidence.filter((e) => e.publicVisible);
  return {
    role,
    id: c.publicCaseId,
    title: c.title,
    summary: c.publicSummary,
    category: c.category,
    locationGeneral: c.locationGeneral ?? undefined,
    incidentAt: c.incidentAt.toISOString(),
    verification: c.verification,
    response: c.response,
    priority: c.priority,
    publicationState: c.publicationState,
    publicationLabel: PUBLICATION_LABEL[c.publicationState],
    publicationDescription: PUBLICATION_DESCRIPTION[c.publicationState],
    privacyMode: c.privacyMode,
    disputePathway: c.disputePathway,
    awaitingReporter: c.awaitingReporter,
    nextUpdateAt: iso(c.nextUpdateAt),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    resolvedAt: iso(c.resolvedAt),
    known: c.known,
    uncertain: c.uncertain,
    orgName: c.assignedOrg?.name,
    orgContactEmail: c.assignedOrg?.contactEmail ?? undefined,
    evidence: evidence.map((e) => evidenceView(e, canSeeRestricted)),
    events: events.map(eventView),
    updates: c.updates.map((u) => ({
      id: u.id,
      at: u.at.toISOString(),
      authorLabel: u.authorLabel,
      body: u.body
    })),
    progress: buildProgress(c),
    counts: counts(c),
    resolved: isResolved(c)
  };
}

/**
 * The public transparency view.
 *
 * Contains no tracking token or hash, no reporter identity, no coordinates,
 * no internal notes, no restricted evidence and no raw report text.
 */
export function toPublicCaseView(c: CaseWithRelations): PublicCaseView {
  return base(c, "public", false);
}

/** Adds the reporter's own submission and their follow-up affordances. */
export function toReporterCaseView(c: CaseWithRelations, reportId: string): ReporterCaseView {
  const view = base(c, "reporter", false);
  const own = c.reports.find((r) => r.id === reportId);
  return {
    ...view,
    role: "reporter",
    yourReport: own?.narrative ?? c.privateDescription,
    restrictedEvidenceCount: c.evidence.filter((e) => !e.publicVisible).length,
    openInfoRequests: c.infoRequests
      .filter((r) => r.status === "open")
      .map((r) => ({
        id: r.id,
        message: r.message,
        status: r.status,
        requestedByLabel: r.requestedByLabel,
        createdAt: r.createdAt.toISOString(),
        answeredAt: iso(r.answeredAt),
        answerBody: r.answerBody ?? undefined
      })),
    canAddEvidence: c.response !== "closed",
    canRequestUpdate: c.response !== "closed"
  };
}

/** The authorized handler's view: everything needed to act, and nothing more. */
export function toResponderCaseView(
  c: CaseWithRelations,
  role: "responder" | "admin"
): ResponderCaseView {
  const view = base(c, role, true);
  const contactRecord = c.reports.map((r) => r.contact).find(Boolean) ?? null;
  return {
    ...view,
    role,
    privateDescription: c.privateDescription,
    reporterContact:
      c.privacyMode !== "anonymous" && contactRecord
        ? {
            name: contactRecord.name ?? undefined,
            email: contactRecord.email ?? undefined,
            phone: contactRecord.phone ?? undefined,
            preferredChannel: contactRecord.preferredChannel ?? undefined
          }
        : undefined,
    coordinates: c.lat !== null && c.lng !== null ? { lat: c.lat, lng: c.lng } : undefined,
    screeningFlags: c.screeningFlags,
    verificationReason: c.verificationReason ?? undefined,
    assignedOrgId: c.assignedOrgId ?? undefined,
    notes: c.notes.map((n) => ({
      id: n.id,
      at: n.at.toISOString(),
      authorLabel: n.authorLabel,
      body: n.body
    })),
    links: [
      ...c.linksTo.map((l) => ({
        id: l.id,
        status: l.status,
        score: l.score,
        signals: l.signals as Record<string, unknown>,
        otherCaseId: l.sourceCase.publicCaseId,
        otherCaseTitle: l.sourceCase.title,
        direction: "incoming" as const,
        createdAt: l.createdAt.toISOString(),
        decidedAt: iso(l.decidedAt),
        decisionNote: l.decisionNote ?? undefined
      })),
      ...c.linksFrom.map((l) => ({
        id: l.id,
        status: l.status,
        score: l.score,
        signals: l.signals as Record<string, unknown>,
        otherCaseId: l.targetCase.publicCaseId,
        otherCaseTitle: l.targetCase.title,
        direction: "outgoing" as const,
        createdAt: l.createdAt.toISOString(),
        decidedAt: iso(l.decidedAt),
        decisionNote: l.decisionNote ?? undefined
      }))
    ],
    infoRequests: c.infoRequests.map((r) => ({
      id: r.id,
      message: r.message,
      status: r.status,
      requestedByLabel: r.requestedByLabel,
      createdAt: r.createdAt.toISOString(),
      answeredAt: iso(r.answeredAt),
      answerBody: r.answerBody ?? undefined
    })),
    reports: c.reports.map((r) => ({
      id: r.id,
      role: r.role,
      privacyMode: r.privacyMode,
      receivedAt: r.receivedAt.toISOString(),
      areaNote: r.areaNote ?? undefined
    }))
  };
}

/** Compact row for lists. */
export function toCaseRow(
  c: {
    publicCaseId: string;
    title: string;
    category: CaseCategory;
    locationGeneral: string | null;
    verification: VerificationState;
    response: ResponseState;
    priority: CasePriority;
    updatedAt: Date;
    disputePathway: boolean;
  },
  href: string
): CaseRowView {
  return {
    id: c.publicCaseId,
    title: c.title,
    category: c.category,
    locationGeneral: c.locationGeneral ?? undefined,
    verification: c.verification,
    response: c.response,
    priority: c.priority,
    updatedAt: c.updatedAt.toISOString(),
    resolved: isResolved(c),
    dispute: c.disputePathway,
    href
  };
}

/**
 * Keys that must never appear anywhere in a public payload. Used by the
 * security tests to assert the boundary rather than trusting review.
 */
export const FORBIDDEN_PUBLIC_KEYS = [
  "trackingTokenHash",
  "recoveryCodeHash",
  "reporterContact",
  "contactName",
  "privateDescription",
  "narrative",
  "storageKey",
  "coordinates",
  "lat",
  "lng",
  "notes",
  "screeningFlags",
  "submitterHash",
  "passwordHash",
  "tokenHash"
] as const;
