import type { CaseCategory, PrivacyMode, Prisma } from "@prisma/client";
import { allocateCaseNumber, prisma } from "../db/prisma";
import { defaultPublicSummary, defaultTitle, screenNewCase } from "../publication";
import { PUBLIC_REPORTER_LABEL, SYSTEM_LABELS } from "../privacy";
import { findCandidates, TIME_WINDOW_HOURS, type MatchableCase } from "../matching";
import { hashRecoveryCode, hashToken, randomRecoveryCode, randomToken } from "../auth/tokens";
import { log } from "../log";

// Case creation.
//
// Everything a submission produces — the case, the report, the initial event
// and any proposed corroboration links — is written in one transaction. A
// half-created case with no report (and therefore no tracking token) would
// leave a reporter permanently locked out of their own case.

export interface CreateReportInput {
  category: CaseCategory;
  narrative: string;
  locationGeneral?: string;
  coordinates?: { lat: number; lng: number };
  incidentAt: Date;
  privacyMode: PrivacyMode;
  contact?: { name?: string; email?: string; phone?: string; preferredChannel?: string };
  submitterHash?: string;
  /** Include a recovery code so the reporter can regain access from a new device. */
  withRecoveryCode?: boolean;
}

export interface CreateReportResult {
  caseId: string;
  internalCaseId: string;
  reportId: string;
  /** Returned once, to the submitting client only. Never stored or logged. */
  trackingToken: string;
  recoveryCode?: string;
  publicVisible: boolean;
  publicationState: string;
  possibleMatches: Array<{ caseId: string; score: number }>;
}

const URGENT_TERMS =
  /(fire|weapon|blood|injur|unconscious|attack|gas leak|live wire|electrocut|trapped|collapse)/i;

function priorityFor(category: CaseCategory, narrative: string) {
  if (category !== "safety") return "standard" as const;
  return URGENT_TERMS.test(narrative) ? ("urgent" as const) : ("elevated" as const);
}

export async function createReport(input: CreateReportInput): Promise<CreateReportResult> {
  const trackingToken = randomToken(32);
  const recoveryCode = input.withRecoveryCode ? randomRecoveryCode() : undefined;
  const now = new Date();

  // Candidate matching runs before the write so the transaction stays short.
  // Only the fields the matcher needs are loaded, and only from a bounded
  // window of recent, still-open cases in the same category.
  const windowStart = new Date(input.incidentAt.getTime() - TIME_WINDOW_HOURS * 3_600_000);
  const windowEnd = new Date(input.incidentAt.getTime() + TIME_WINDOW_HOURS * 3_600_000);
  const candidateRows = await prisma.case.findMany({
    where: {
      category: input.category,
      response: { not: "closed" },
      incidentAt: { gte: windowStart, lte: windowEnd }
    },
    select: {
      id: true,
      publicCaseId: true,
      category: true,
      privateDescription: true,
      locationGeneral: true,
      incidentAt: true,
      updatedAt: true
    },
    orderBy: { incidentAt: "desc" },
    take: 200
  });

  const candidates: MatchableCase[] = candidateRows.map((row) => ({
    id: row.id,
    publicCaseId: row.publicCaseId,
    category: row.category,
    narrative: row.privateDescription,
    locationGeneral: row.locationGeneral,
    incidentAt: row.incidentAt,
    updatedAt: row.updatedAt
  }));

  const matches = findCandidates(
    {
      category: input.category,
      narrative: input.narrative,
      locationGeneral: input.locationGeneral ?? null,
      incidentAt: input.incidentAt
    },
    candidates
  );

  const screening = screenNewCase({
    category: input.category,
    narrative: input.narrative,
    locationGeneral: input.locationGeneral,
    hasPreciseCoordinates: Boolean(input.coordinates)
  });

  const reporterLabel = PUBLIC_REPORTER_LABEL[input.privacyMode];

  const created = await prisma.$transaction(async (tx) => {
    const { caseNumber, publicCaseId } = await allocateCaseNumber(tx);

    const createdCase = await tx.case.create({
      data: {
        publicCaseId,
        caseNumber,
        title: defaultTitle({ category: input.category, locationGeneral: input.locationGeneral }),
        publicSummary: defaultPublicSummary({
          category: input.category,
          locationGeneral: input.locationGeneral
        }),
        privateDescription: input.narrative,
        category: input.category,
        locationGeneral: input.locationGeneral ?? null,
        lat: input.coordinates?.lat ?? null,
        lng: input.coordinates?.lng ?? null,
        incidentAt: input.incidentAt,
        privacyMode: input.privacyMode,
        priority: priorityFor(input.category, input.narrative),
        publicationState: screening.publicationState,
        publicVisible: screening.publicVisible,
        screeningFlags: screening.flags,
        known: ["A single initial report has been received."],
        uncertain: [
          "No corroborating reports or supporting evidence exist yet.",
          "No organization has taken ownership of the case yet."
        ]
      }
    });

    const report = await tx.report.create({
      data: {
        caseId: createdCase.id,
        role: "initial",
        privacyMode: input.privacyMode,
        trackingTokenHash: hashToken(trackingToken),
        recoveryCodeHash: recoveryCode ? hashRecoveryCode(recoveryCode) : null,
        narrative: input.narrative,
        areaNote: input.locationGeneral ?? null,
        submitterHash: input.submitterHash ?? null,
        receivedAt: now
      }
    });

    // Identity is only stored when the reporter chose to share it, and it
    // lives in its own table so no case query can select it by accident.
    if (input.privacyMode !== "anonymous" && input.contact && hasAnyContact(input.contact)) {
      await tx.reporterContact.create({
        data: {
          reportId: report.id,
          name: input.contact.name ?? null,
          email: input.contact.email ?? null,
          phone: input.contact.phone ?? null,
          preferredChannel: input.contact.preferredChannel ?? null
        }
      });
    }

    await tx.caseEvent.create({
      data: {
        caseId: createdCase.id,
        type: "REPORT_SUBMITTED",
        actorType: "reporter",
        actorLabel: reporterLabel,
        visibility: "public",
        title: "Case reported",
        detail: `Initial report received. Verification state: Unverified. Reporter privacy: ${input.privacyMode}.`,
        at: now
      }
    });

    if (!screening.publicVisible) {
      await tx.caseEvent.create({
        data: {
          caseId: createdCase.id,
          type: "PUBLICATION_CHANGED",
          actorType: "system",
          actorLabel: SYSTEM_LABELS.system,
          visibility: "restricted",
          title: "Held for publication review",
          detail: `Automatic screening flagged: ${screening.flags.join(", ")}.`,
          at: now
        }
      });
    }

    // Proposed links only. The matcher can never assert corroboration, and it
    // never changes a verification state — a handler decides, per case-state.ts.
    for (const match of matches) {
      await tx.caseLink.create({
        data: {
          sourceCaseId: createdCase.id,
          targetCaseId: match.target.id,
          reportId: report.id,
          score: match.score,
          signals: match.signals as unknown as Prisma.InputJsonValue,
          status: "proposed"
        }
      });
      await tx.caseEvent.create({
        data: {
          caseId: match.target.id,
          type: "POSSIBLE_MATCH_FOUND",
          actorType: "matching_rule",
          actorLabel: SYSTEM_LABELS.matchingRule,
          // Restricted: an unreviewed heuristic must not read publicly as
          // corroboration.
          visibility: "restricted",
          title: "Possible related report received",
          detail: `A new report (${createdCase.publicCaseId}) resembles this case (score ${match.score.toFixed(2)}). Awaiting review by a case handler.`,
          at: now
        }
      });
    }

    return { createdCase, report };
  });

  log.info("case.created", {
    caseId: created.createdCase.publicCaseId,
    category: input.category,
    privacyMode: input.privacyMode,
    publicationState: screening.publicationState,
    proposedLinks: matches.length
  });

  return {
    caseId: created.createdCase.publicCaseId,
    internalCaseId: created.createdCase.id,
    reportId: created.report.id,
    trackingToken,
    recoveryCode,
    publicVisible: screening.publicVisible,
    publicationState: screening.publicationState,
    possibleMatches: matches.map((m) => ({ caseId: m.target.publicCaseId, score: m.score }))
  };
}

function hasAnyContact(contact: NonNullable<CreateReportInput["contact"]>): boolean {
  return Boolean(contact.name || contact.email || contact.phone);
}
