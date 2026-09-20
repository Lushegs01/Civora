import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

// Every query the application makes lives here, so the shape of what a route
// loads is reviewable in one file.

export const caseInclude = {
  assignedOrg: true,
  reports: { include: { contact: true }, orderBy: { receivedAt: "asc" } },
  evidence: { where: { deletedAt: null }, orderBy: { submittedAt: "asc" } },
  events: { orderBy: { at: "asc" } },
  updates: { orderBy: { at: "asc" } },
  notes: { orderBy: { at: "desc" } },
  infoRequests: { orderBy: { createdAt: "desc" } },
  linksFrom: { include: { targetCase: { select: { publicCaseId: true, title: true } } }, orderBy: { createdAt: "desc" } },
  linksTo: { include: { sourceCase: { select: { publicCaseId: true, title: true } } }, orderBy: { createdAt: "desc" } }
} satisfies Prisma.CaseInclude;

export type CaseWithRelations = Prisma.CaseGetPayload<{ include: typeof caseInclude }>;

/** Public case ids are normalized once, here, so lookups are consistent. */
export function normalizeCaseId(input: string): string {
  const trimmed = input.trim().toUpperCase();
  return /^CS-\d{1,9}$/.test(trimmed) ? trimmed : "";
}

export async function findCaseByPublicId(publicCaseId: string): Promise<CaseWithRelations | null> {
  const id = normalizeCaseId(publicCaseId);
  if (!id) return null;
  return prisma.case.findUnique({ where: { publicCaseId: id }, include: caseInclude });
}

/** Minimal projection used for authorization decisions before loading a case. */
export async function findCaseScope(publicCaseId: string) {
  const id = normalizeCaseId(publicCaseId);
  if (!id) return null;
  return prisma.case.findUnique({
    where: { publicCaseId: id },
    select: {
      id: true,
      publicCaseId: true,
      assignedOrgId: true,
      response: true,
      verification: true,
      publicVisible: true,
      publicationState: true,
      privacyMode: true
    }
  });
}

export const caseRowSelect = {
  publicCaseId: true,
  title: true,
  category: true,
  locationGeneral: true,
  verification: true,
  response: true,
  priority: true,
  updatedAt: true,
  disputePathway: true
} satisfies Prisma.CaseSelect;

export interface PublicCaseListOptions {
  take?: number;
  cursor?: string;
  category?: Prisma.CaseWhereInput["category"];
}

/** Paginated public board. Never loads the whole table. */
export async function listPublicCases(options: PublicCaseListOptions = {}) {
  const take = Math.min(Math.max(options.take ?? 30, 1), 60);
  return prisma.case.findMany({
    where: { publicVisible: true, ...(options.category ? { category: options.category } : {}) },
    select: caseRowSelect,
    orderBy: [{ updatedAt: "desc" }, { publicCaseId: "desc" }],
    take: take + 1,
    ...(options.cursor ? { skip: 1, cursor: { publicCaseId: options.cursor } } : {})
  });
}

/** Cases an actor may work on: their organization's plus the unassigned queue. */
export async function listWorkspaceCases(scope: { orgId: string | null; all: boolean }, take = 100) {
  return prisma.case.findMany({
    where: scope.all ? {} : { OR: [{ assignedOrgId: null }, { assignedOrgId: scope.orgId ?? "__none__" }] },
    select: {
      ...caseRowSelect,
      id: true,
      assignedOrgId: true,
      createdAt: true,
      publicationState: true,
      awaitingReporter: true,
      _count: { select: { reports: true, evidence: true, linksTo: true } }
    },
    orderBy: [{ updatedAt: "desc" }],
    take
  });
}

export async function countsForDashboard(scope: { orgId: string | null; all: boolean }) {
  const where: Prisma.CaseWhereInput = scope.all
    ? {}
    : { OR: [{ assignedOrgId: null }, { assignedOrgId: scope.orgId ?? "__none__" }] };
  const [newCases, unverified, assigned, inProgress, resolved, proposedLinks] = await Promise.all([
    prisma.case.count({ where: { ...where, response: { in: ["received", "not_assigned"] } } }),
    prisma.case.count({ where: { ...where, verification: "unverified", response: { not: "closed" } } }),
    prisma.case.count({ where: { ...where, assignedOrgId: { not: null }, response: { not: "closed" } } }),
    prisma.case.count({ where: { ...where, response: { in: ["in_progress", "action_recorded"] } } }),
    prisma.case.count({ where: { ...where, response: "closed" } }),
    prisma.caseLink.count({ where: { status: "proposed", targetCase: where } })
  ]);
  return { newCases, unverified, assigned, inProgress, resolved, proposedLinks };
}

/** Community snapshot for the citizen dashboard — counts only, no rows. */
export async function publicSnapshot() {
  const [open, awaitingResponse, resolved] = await Promise.all([
    prisma.case.count({ where: { publicVisible: true, response: { not: "closed" } } }),
    prisma.case.count({ where: { publicVisible: true, response: { in: ["not_assigned", "received"] } } }),
    prisma.case.count({ where: { publicVisible: true, response: "closed" } })
  ]);
  return { open, awaitingResponse, resolved };
}

export async function listOrganizations() {
  return prisma.organization.findMany({
    where: { active: true },
    select: { id: true, name: true, description: true, contactEmail: true, fictional: true },
    orderBy: { name: "asc" }
  });
}

/**
 * Finds the report a tracking token belongs to.
 *
 * The token is never stored, so this is a lookup by hash; a caller that does
 * not hold the token cannot construct the query. Returns null rather than
 * throwing so callers can respond identically for "wrong token" and "no such
 * case", which keeps case ids from being enumerable.
 */
export async function findReportByTokenHash(tokenHash: string) {
  return prisma.report.findUnique({
    where: { trackingTokenHash: tokenHash },
    select: { id: true, caseId: true, case: { select: { publicCaseId: true } } }
  });
}

export async function findReportByRecoveryHash(publicCaseId: string, recoveryCodeHash: string) {
  const id = normalizeCaseId(publicCaseId);
  if (!id) return null;
  return prisma.report.findFirst({
    where: { recoveryCodeHash, case: { publicCaseId: id } },
    select: { id: true, caseId: true, trackingTokenHash: true }
  });
}

export type { PrismaClient };
export { prisma };
