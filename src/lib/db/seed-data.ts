import crypto from "crypto";
import type {
  CaseEvent,
  CaseRecord,
  CaseUpdate,
  CivoraDB,
  EvidenceRecord,
  InternalNote,
  Organization
} from "../types";

// All demo content is fictional and written for evaluation purposes.
// Timestamps are generated relative to first seed so the demo always feels live.

const HOUR = 3600_000;
const MINUTE = 60_000;
const DAY = 24 * HOUR;

// Tracking tokens pre-seeded on a demo device (must match src/lib/offline/db.ts).
const DEMO_DEVICE_TOKENS: Record<string, string> = {
  "CS-1042": "demo-device-token-cs1042-0000000000aaaa",
  "CS-1040": "demo-device-token-cs1040-0000000000bbbb"
};

const demoTokenHash = (caseId: string) =>
  crypto.createHash("sha256").update(DEMO_DEVICE_TOKENS[caseId]).digest("hex");

export const ORGS: Organization[] = [
  {
    id: "org-facilities",
    name: "Facilities Department",
    description: "Buildings, electrical safety and campus/public facility maintenance.",
    contactEmail: "facilities@civora-demo.example"
  },
  {
    id: "org-public-works",
    name: "Public Works Office",
    description: "Streets, lighting, signage and public infrastructure.",
    contactEmail: "publicworks@civora-demo.example"
  },
  {
    id: "org-water",
    name: "Municipal Water Services",
    description: "Water supply, outages and service restoration.",
    contactEmail: "water@civora-demo.example"
  },
  {
    id: "org-mediation",
    name: "Community Mediation Unit",
    description: "Neutral mediation and referral for community disputes.",
    contactEmail: "mediation@civora-demo.example"
  },
  {
    id: "org-safety-desk",
    name: "Safety & Protection Desk",
    description: "Triage and referral for safety and protection concerns.",
    contactEmail: "safety@civora-demo.example"
  }
];

export function buildSeed(): CivoraDB {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const org = (id: string) => ORGS.find((o) => o.id === id)!;

  const cases: CaseRecord[] = [];
  const evidence: EvidenceRecord[] = [];
  const events: CaseEvent[] = [];
  const updates: CaseUpdate[] = [];
  const notes: InternalNote[] = [];
  let evSeq = 0;
  let evtSeq = 0;

  const addEvidence = (
    e: Omit<EvidenceRecord, "id" | "submittedAt"> & { at: string }
  ) => {
    const rec: EvidenceRecord = {
      id: `ev-${++evSeq}`,
      caseId: e.caseId,
      submittedAt: e.at,
      kind: e.kind,
      title: e.title,
      sourceType: e.sourceType,
      submittedByLabel: e.submittedByLabel,
      excerpt: e.excerpt,
      relationship: e.relationship,
      fileName: e.fileName,
      mimeType: e.mimeType,
      sizeBytes: e.sizeBytes,
      checksum: e.checksum,
      publicVisible: e.publicVisible,
      sourceRef: e.sourceRef
    };
    evidence.push(rec);
    return rec;
  };

  const addEvent = (
    e: Omit<CaseEvent, "id" | "caseId" | "at"> & { caseId: string; at: string }
  ) => {
    events.push({ id: `evt-${++evtSeq}`, at: e.at, caseId: e.caseId, type: e.type, actor: e.actor, visibility: e.visibility, title: e.title, detail: e.detail });
  };

  const base = (
    id: string,
    over: Partial<CaseRecord> & Pick<CaseRecord, "title" | "description" | "category">
  ): CaseRecord => ({
    id,
    privacyMode: "anonymous",
    verification: "unverified",
    response: "received",
    priority: "standard",
    publicVisible: true,
    known: [],
    uncertain: [],
    reports: [],
    createdAt: iso(-9 * DAY),
    updatedAt: iso(-9 * DAY),
    incidentAt: iso(-9 * DAY),
    ...over
  });

  // ---------------------------------------------------------------- CS-1035
  // Resolved infrastructure case — demonstrates the full lifecycle end-to-end.
  {
    const t0 = iso(-11 * DAY);
    const c = base("CS-1035", {
      title: "Street lighting outage along Riverside Walk",
      description:
        "Six street lights along the riverside footpath between the market entrance and the footbridge have been dark since the storm on the 5th. The path is used heavily in the early morning.",
      category: "infrastructure",
      locationGeneral: "Riverside Walk, between market entrance and footbridge",
      verification: "resolved",
      response: "closed",
      priority: "standard",
      assignedOrgId: "org-public-works",
      createdAt: t0,
      updatedAt: iso(-6 * DAY),
      resolvedAt: iso(-6 * DAY),
      incidentAt: iso(-11 * DAY),
      known: [
        "Four independent reports describe the same dark stretch of path.",
        "A works order was raised by the Public Works Office.",
        "The contractor recorded the replaced cable section and fittings."
      ],
      uncertain: [
        "The long-term maintenance schedule for this stretch has not been published."
      ],
      reports: [
        { id: "r-1", at: t0, role: "initial", privacyMode: "identified" },
        { id: "r-2", at: iso(-10 * DAY), role: "corroborating", privacyMode: "anonymous", areaNote: "Same stretch, near the footbridge" }
      ]
    });
    cases.push(c);
    addEvent({ caseId: c.id, at: t0, type: "REPORT_SUBMITTED", actor: "Citizen report", visibility: "public", title: "Case reported", detail: "Initial report received with location details." });
    addEvent({ caseId: c.id, at: iso(-10 * DAY), type: "CORROBORATION_RECEIVED", actor: "Matching rule", visibility: "public", title: "Independent corroborating report received" });
    addEvent({ caseId: c.id, at: iso(-10 * DAY), type: "VERIFICATION_UPDATED", actor: "Response desk", visibility: "public", title: "Verification set to Partially verified", detail: "Multiple consistent reports refer to the same stretch of path." });
    addEvent({ caseId: c.id, at: iso(-9 * DAY), type: "CASE_ASSIGNED", actor: "Response desk", visibility: "public", title: "Assigned to Public Works Office" });
    addEvent({ caseId: c.id, at: iso(-8 * DAY), type: "RESPONSE_IN_PROGRESS", actor: org("org-public-works").name, visibility: "public", title: "Response marked in progress" });
    addEvent({ caseId: c.id, at: iso(-6 * DAY), type: "ACTION_RECORDED", actor: org("org-public-works").name, visibility: "public", title: "Action recorded", detail: "Contractor replaced the damaged cable section and six light fittings. All six lights tested after replacement." });
    addEvent({ caseId: c.id, at: iso(-6 * DAY), type: "CASE_CLOSED", actor: org("org-public-works").name, visibility: "public", title: "Case closed", detail: "Lighting restored along the reported stretch." });
    addEvidence({ caseId: c.id, at: iso(-6 * DAY), kind: "official", title: "Works completion record", sourceType: "official", submittedByLabel: org("org-public-works").name, excerpt: "Works order RW-2311 completed. Cable section (14 m) and six fittings replaced; lighting tested operational at 09:40.", relationship: "Documents the completed action and supports closure.", publicVisible: true, sourceRef: "Works order RW-2311 (fictional demo record)" });
    updates.push({ id: "u-1", caseId: c.id, at: iso(-6 * DAY), authorLabel: org("org-public-works").name, body: "Repair completed along Riverside Walk. Six fittings replaced and tested. If you still notice dark sections, please file a new report referencing this case." });
  }

  // ---------------------------------------------------------------- CS-1038
  // Accountability case with genuinely conflicting documentary sources.
  {
    const t0 = iso(-6 * DAY);
    const c = base("CS-1038", {
      title: "Public project implementation status unclear",
      description:
        "Public notices say the market pavilion refurbishment is substantially complete, but the pavilion remains closed and unfinished. Published budget and procurement records appear to disagree with each other.",
      category: "other",
      locationGeneral: "Market pavilion, Central Ward",
      verification: "conflicting",
      response: "received",
      priority: "elevated",
      createdAt: t0,
      updatedAt: iso(-2 * DAY),
      incidentAt: iso(-6 * DAY),
      known: [
        "The published budget summary shows 90% of allocated funds disbursed.",
        "The procurement record lists the main internal fit-out as not yet delivered.",
        "A public notice describes phase one as substantially complete."
      ],
      uncertain: [
        "Which record reflects the current state of the site has not been established.",
        "No independent site verification has been conducted yet."
      ],
      reports: [{ id: "r-1", at: t0, role: "initial", privacyMode: "anonymous" }]
    });
    cases.push(c);
    addEvent({ caseId: c.id, at: t0, type: "REPORT_SUBMITTED", actor: "Citizen report", visibility: "public", title: "Case reported", detail: "Report submitted with references to published budget and procurement documents." });
    addEvent({ caseId: c.id, at: iso(-4 * DAY), type: "EVIDENCE_ADDED", actor: "Citizen report", visibility: "public", title: "Documentary evidence added", detail: "Budget summary and procurement record attached." });
    addEvent({ caseId: c.id, at: iso(-2 * DAY), type: "VERIFICATION_UPDATED", actor: "Response desk", visibility: "public", title: "Verification set to Conflicting", detail: "The budget summary and the procurement record materially disagree about delivery status. The discrepancy is documented, not judged." });
    addEvidence({ caseId: c.id, at: iso(-5 * DAY), kind: "document", title: "Budget summary — market pavilion refurbishment", sourceType: "primary", submittedByLabel: "Published budget record", excerpt: "Phase one expenditure reported at 90% of the allocated 2.4M. Line items for internal fit-out marked as disbursed to contractor.", relationship: "Indicates funds for the fit-out were disbursed.", publicVisible: true, sourceRef: "Quarterly budget summary, p.14 (fictional demo document)" });
    addEvidence({ caseId: c.id, at: iso(-4 * DAY), kind: "document", title: "Procurement record — pavilion phase one", sourceType: "primary", submittedByLabel: "Published procurement register", excerpt: "Contract PA-8891 status: active. Deliverable D2 (internal fit-out) — not delivered. Revised completion estimate: outstanding.", relationship: "Materially disagrees with the budget summary on delivery status.", publicVisible: true, sourceRef: "Procurement register entry PA-8891 (fictional demo document)" });
    addEvidence({ caseId: c.id, at: iso(-6 * DAY), kind: "official", title: "Public notice — pavilion refurbishment", sourceType: "official", submittedByLabel: "Project communications office", excerpt: "Phase one of the market pavilion refurbishment is substantially complete. Phase two begins next quarter.", relationship: "Describes the project as substantially complete; conflicts with the procurement record.", publicVisible: true, sourceRef: "Public notice board, 12 Sep (fictional demo notice)" });
  }

  // ---------------------------------------------------------------- CS-1040
  // Documented public-service case with an official primary source.
  {
    const t0 = iso(-2 * DAY - 6 * HOUR);
    const c = base("CS-1040", {
      title: "Community water service disruption",
      description:
        "No water in the Kessler Road area since early morning. Several neighbours report the same. A maintenance notice was posted by the utility later in the day.",
      category: "service",
      locationGeneral: "Kessler Road and adjacent streets",
      privacyMode: "confidential",
      verification: "documented",
      response: "in_progress",
      priority: "elevated",
      assignedOrgId: "org-water",
      createdAt: t0,
      updatedAt: iso(-3 * HOUR),
      incidentAt: iso(-2 * DAY - 8 * HOUR),
      nextUpdateAt: iso(2 * HOUR),
      trackingTokenHash: demoTokenHash("CS-1040"),
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
        { id: "r-1", at: t0, role: "initial", privacyMode: "confidential" },
        { id: "r-2", at: iso(-2 * DAY - 4 * HOUR), role: "corroborating", privacyMode: "anonymous", areaNote: "Adjacent street, same morning" }
      ]
    });
    cases.push(c);
    addEvent({ caseId: c.id, at: t0, type: "REPORT_SUBMITTED", actor: "Citizen report", visibility: "public", title: "Case reported" });
    addEvent({ caseId: c.id, at: iso(-2 * DAY - 4 * HOUR), type: "CORROBORATION_RECEIVED", actor: "Matching rule", visibility: "public", title: "Independent corroborating report received" });
    addEvent({ caseId: c.id, at: iso(-2 * DAY - 3 * HOUR), type: "VERIFICATION_UPDATED", actor: "Response desk", visibility: "public", title: "Verification set to Documented", detail: "The utility's published maintenance notice documents the disruption timeframe and area." });
    addEvent({ caseId: c.id, at: iso(-2 * DAY), type: "CASE_ASSIGNED", actor: "Response desk", visibility: "public", title: "Assigned to Municipal Water Services" });
    addEvent({ caseId: c.id, at: iso(-2 * DAY), type: "CASE_ACKNOWLEDGED", actor: org("org-water").name, visibility: "public", title: "Utility acknowledged the case" });
    addEvent({ caseId: c.id, at: iso(-3 * HOUR), type: "RESPONSE_IN_PROGRESS", actor: org("org-water").name, visibility: "public", title: "Response marked in progress", detail: "Crews working on the Kessler Road supply line." });
    addEvidence({ caseId: c.id, at: iso(-2 * DAY - 2 * HOUR), kind: "official", title: "Utility maintenance notice — Kessler Road zone", sourceType: "primary", submittedByLabel: org("org-water").name, excerpt: "Planned emergency maintenance on the Kessler Road supply line. Expected duration: up to 48 hours from 06:00. Some intermittent supply may occur while works proceed.", relationship: "Primary source documenting the disruption and its expected duration.", publicVisible: true, sourceRef: "Utility notice board ref W-1187 (fictional demo notice)" });
    updates.push({ id: "u-2", caseId: c.id, at: iso(-3 * HOUR), authorLabel: org("org-water").name, body: "Crews are on site. A revised restoration time will be published as soon as pressure testing completes." });
  }

  // ---------------------------------------------------------------- CS-1042
  // PRIMARY DEMO CASE — safety, partially verified, acknowledged.
  {
    const t0 = iso(-2 * DAY);
    const ackAt = iso(-3 * HOUR - 18 * MINUTE);
    const c = base("CS-1042", {
      title: "Dangerous electrical fault near student residences",
      description:
        "Exposed wiring and a scorched wall panel on the north side of the residences walkway. Sparks were seen when someone brushed past it in the evening. The panel is at head height beside the main foot traffic route.",
      category: "safety",
      locationGeneral: "North walkway, student residences, Halls B entrance",
      privacyMode: "anonymous",
      verification: "partially_verified",
      response: "acknowledged",
      priority: "urgent",
      assignedOrgId: "org-facilities",
      createdAt: t0,
      updatedAt: ackAt,
      incidentAt: iso(-2 * DAY - 2 * HOUR),
      nextUpdateAt: iso(2 * HOUR),
      trackingTokenHash: demoTokenHash("CS-1042"),
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
        { id: "r-1", at: t0, role: "initial", privacyMode: "anonymous", areaNote: "North walkway, beside Halls B entrance" },
        { id: "r-2", at: iso(-1 * DAY - 20 * HOUR), role: "corroborating", privacyMode: "anonymous", areaNote: "Same panel, evening" },
        { id: "r-3", at: iso(-1 * DAY - 4 * HOUR), role: "corroborating", privacyMode: "identified", areaNote: "Resident, Halls B" }
      ]
    });
    cases.push(c);
    addEvent({ caseId: c.id, at: t0, type: "REPORT_SUBMITTED", actor: "Citizen report", visibility: "public", title: "Case reported", detail: "Anonymous report with photo evidence. Initial verification state: Unverified." });
    addEvent({ caseId: c.id, at: iso(-2 * DAY + 40 * MINUTE), type: "EVIDENCE_ADDED", actor: "Citizen report", visibility: "public", title: "Photographic evidence added", detail: "Photo of the scorched panel submitted with the initial report." });
    addEvent({ caseId: c.id, at: iso(-1 * DAY - 20 * HOUR), type: "CORROBORATION_RECEIVED", actor: "Matching rule", visibility: "public", title: "Independent corroborating report received", detail: "A second report describes the same panel and location." });
    addEvent({ caseId: c.id, at: iso(-1 * DAY - 4 * HOUR), type: "CORROBORATION_RECEIVED", actor: "Matching rule", visibility: "public", title: "Third report received", detail: "A resident reported the same fault from an identified account." });
    addEvent({ caseId: c.id, at: iso(-1 * DAY - 3 * HOUR), type: "VERIFICATION_UPDATED", actor: "Response desk", visibility: "public", title: "Verification set to Partially verified", detail: "Multiple consistent reports and a supporting photo refer to the same location." });
    addEvent({ caseId: c.id, at: iso(-1 * DAY - 2 * HOUR), type: "CASE_ASSIGNED", actor: "Response desk", visibility: "public", title: "Assigned to Facilities Department" });
    addEvent({ caseId: c.id, at: ackAt, type: "CASE_ACKNOWLEDGED", actor: org("org-facilities").name, visibility: "public", title: "Facilities acknowledged the case" });
    addEvent({ caseId: c.id, at: ackAt, type: "PUBLIC_UPDATE_ADDED", actor: org("org-facilities").name, visibility: "public", title: "Official update added" });
    addEvidence({ caseId: c.id, at: iso(-2 * DAY + 40 * MINUTE), kind: "photo", title: "Scorched panel on the north walkway", sourceType: "citizen", submittedByLabel: "Citizen report (anonymous)", excerpt: "Photo taken at head height beside the Halls B entrance showing exposed wiring and scorch marks.", relationship: "Supports the reported location and visible damage.", publicVisible: true, fileName: "panel-photo.demo", mimeType: "image/jpeg", sizeBytes: 184_320 });
    addEvidence({ caseId: c.id, at: ackAt, kind: "official", title: "Facilities acknowledgement notice", sourceType: "official", submittedByLabel: org("org-facilities").name, excerpt: "Report received and assigned for inspection. An electrical contractor has been requested to assess the panel on the north walkway.", relationship: "Official acknowledgement; supports the response state.", publicVisible: true, sourceRef: "Facilities desk note, 16 Sep (fictional demo record)" });
    notes.push({ id: "n-1", caseId: c.id, at: iso(-2 * HOUR), authorLabel: "Response desk", body: "Inspection slot requested with the electrical contractor for tomorrow morning. Area has been coned off by grounds staff in the meantime. (Responder-only note.)" });
    updates.push({ id: "u-3", caseId: c.id, at: ackAt, authorLabel: org("org-facilities").name, body: "Report received and assigned for inspection." });
  }

  // ---------------------------------------------------------------- CS-1043
  // Fresh unverified case awaiting triage — the "before" of the demo arc.
  {
    const t0 = iso(-8 * HOUR);
    const c = base("CS-1043", {
      title: "Damaged pedestrian crossing sign at market entrance",
      description:
        "The pedestrian crossing sign at the market entrance is bent and facing the wrong way. Drivers are not slowing at the crossing.",
      category: "infrastructure",
      locationGeneral: "Market entrance, pedestrian crossing",
      privacyMode: "identified",
      verification: "unverified",
      response: "received",
      priority: "standard",
      createdAt: t0,
      updatedAt: t0,
      incidentAt: iso(-9 * HOUR),
      known: ["A single initial report has been received."],
      uncertain: [
        "No corroborating reports or supporting evidence exist yet.",
        "No organization has taken ownership of the case yet."
      ],
      reports: [{ id: "r-1", at: t0, role: "initial", privacyMode: "identified" }]
    });
    cases.push(c);
    addEvent({ caseId: c.id, at: t0, type: "REPORT_SUBMITTED", actor: "Citizen report", visibility: "public", title: "Case reported", detail: "Initial report received. Awaiting triage." });
  }

  // ---------------------------------------------------------------- CS-1044
  // Community dispute on the mediation pathway — social cohesion track.
  {
    const t0 = iso(-3 * DAY);
    const c = base("CS-1044", {
      title: "Reported dispute over access to a shared facility",
      description:
        "Two groups report conflicting access arrangements for the shared community hall kitchen on weekday evenings. Both sides describe a prior informal agreement that differs from what the other side says was agreed.",
      category: "dispute",
      locationGeneral: "Community hall kitchen, Elm Ward",
      verification: "partially_verified",
      response: "acknowledged",
      priority: "standard",
      assignedOrgId: "org-mediation",
      createdAt: t0,
      updatedAt: iso(-1 * DAY),
      incidentAt: iso(-3 * DAY),
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
        { id: "r-1", at: t0, role: "initial", privacyMode: "identified" },
        { id: "r-2", at: iso(-2 * DAY), role: "corroborating", privacyMode: "identified", areaNote: "Second participant, same arrangement" }
      ]
    });
    cases.push(c);
    addEvent({ caseId: c.id, at: t0, type: "REPORT_SUBMITTED", actor: "Citizen report", visibility: "public", title: "Reported disagreement received", detail: "Civora records disagreement neutrally; it does not determine fault." });
    addEvent({ caseId: c.id, at: iso(-2 * DAY), type: "CORROBORATION_RECEIVED", actor: "Matching rule", visibility: "public", title: "Second participant account received" });
    addEvent({ caseId: c.id, at: iso(-2 * DAY + 2 * HOUR), type: "CASE_ASSIGNED", actor: "Response desk", visibility: "public", title: "Assigned to Community Mediation Unit", detail: "Mediation/referral pathway selected." });
    addEvent({ caseId: c.id, at: iso(-1 * DAY), type: "INFO_REQUESTED", actor: org("org-mediation").name, visibility: "public", title: "Additional information requested", detail: "The mediation unit requested scheduling details and any written arrangement from participants." });
    addEvidence({ caseId: c.id, at: iso(-2 * DAY + 2 * HOUR), kind: "note", title: "Mediation pathway record", sourceType: "official", submittedByLabel: org("org-mediation").name, excerpt: "Case accepted on the mediation/referral pathway. A mediator will contact participants who opted in. Civora does not determine fault and does not label parties.", relationship: "Documents the chosen pathway for the case.", publicVisible: true, sourceRef: "Mediation intake record (fictional demo record)" });
  }

  return {
    version: 1,
    orgs: ORGS,
    cases,
    evidence,
    events,
    updates,
    notes,
    meta: { lastCaseNumber: 1045, seededAt: new Date().toISOString() }
  };
}
