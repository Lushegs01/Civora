import type { CivoraDB, CaseEvent, CaseRecord, CaseUpdate, EvidenceRecord, InternalNote } from "./types";
import { isResolved } from "./types";
import { orgName } from "./db/store";

export type ViewerRole = "public" | "reporter" | "responder";

export interface CaseView {
  role: ViewerRole;
  case: CaseRecord;
  orgName?: string;
  orgContactEmail?: string;
  evidence: EvidenceRecord[]; // filtered by role
  events: CaseEvent[]; // filtered by role, newest last
  updates: CaseUpdate[];
  notes: InternalNote[]; // responder only
  progress: ProgressStep[];
  counts: { reports: number; evidence: number; updates: number; photos: number };
}

export interface ProgressStep {
  key: string;
  label: string;
  done: boolean;
  at?: string;
  current: boolean;
}

export function buildCaseView(db: CivoraDB, c: CaseRecord, role: ViewerRole): CaseView {
  // PRIVATE reporter data is stripped for everyone except responders (Rule 3).
  const safeCase: CaseRecord =
    role === "responder" ? c : { ...c, reporterContact: undefined, trackingTokenHash: undefined };
  c = safeCase;
  const allEvidence = db.evidence.filter((e) => e.caseId === c.id);
  const evidence =
    role === "responder" ? allEvidence : allEvidence.filter((e) => e.publicVisible);
  const allEvents = db.events
    .filter((e) => e.caseId === c.id)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const events = role === "public" ? allEvents.filter((e) => e.visibility === "public") : allEvents;
  const updates = db.updates
    .filter((u) => u.caseId === c.id)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const notes = role === "responder" ? db.notes.filter((n) => n.caseId === c.id) : [];
  const o = orgName(db, c.assignedOrgId);

  // CASE PROGRESS — derived from the event record, never invented.
  const evAt = (t: CaseEvent["type"]) => allEvents.find((e) => e.type === t)?.at;
  const corroborated = c.reports.length > 1;
  const assigned = Boolean(c.assignedOrgId);
  const responded = ["acknowledged", "in_progress", "action_recorded", "closed"].includes(c.response);
  const closed = c.response === "closed";
  const steps: ProgressStep[] = [
    { key: "reported", label: "Reported", done: true, at: c.createdAt, current: false },
    { key: "evidence", label: "Evidence added", done: allEvidence.some((e) => e.kind !== "report"), at: evAt("EVIDENCE_ADDED"), current: false },
    { key: "corroborated", label: "Corroborated", done: corroborated, at: evAt("CORROBORATION_RECEIVED"), current: !corroborated && assigned },
    { key: "assigned", label: "Assigned", done: assigned, at: evAt("CASE_ASSIGNED"), current: corroborated && !assigned },
    { key: "response", label: closed ? "Response recorded" : "Response pending", done: responded, at: evAt("CASE_ACKNOWLEDGED"), current: assigned && !responded },
    { key: "resolved", label: "Resolved", done: closed || isResolved(c), at: evAt("CASE_CLOSED"), current: responded && !closed }
  ];
  // "current" = the first not-done step
  const firstOpen = steps.find((s) => !s.done);
  if (firstOpen) firstOpen.current = true;

  return {
    role,
    case: c,
    orgName: o,
    orgContactEmail: db.orgs.find((x) => x.id === c.assignedOrgId)?.contactEmail,
    evidence,
    events,
    updates,
    notes,
    progress: steps,
    counts: {
      reports: c.reports.length,
      evidence: allEvidence.length,
      updates: updates.length,
      photos: allEvidence.filter((e) => e.kind === "photo").length
    }
  };
}

export function publicCaseRow(db: CivoraDB, c: CaseRecord) {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    locationGeneral: c.locationGeneral,
    verification: c.verification,
    response: c.response,
    priority: c.priority,
    updatedAt: c.updatedAt,
    resolved: isResolved(c),
    dispute: Boolean(c.disputePathway)
  };
}
