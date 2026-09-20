import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requestActor } from "@/lib/auth/actor";
import { canAccessWorkspace, isPlatformAdmin } from "@/lib/authz";
import { countsForDashboard, listWorkspaceCases } from "@/lib/db/repository";
import { prisma } from "@/lib/db/prisma";
import { ResponderDashboardClient } from "./ResponderDashboardClient";

export const metadata: Metadata = { title: "Responder workspace", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * The responder queue.
 *
 * Scoped server-side: a responder sees the unassigned triage queue plus their
 * own organization's cases. Another organization's active casework is not
 * loaded at all, so it cannot be leaked by a client-side filter mistake.
 */
export default async function ResponderDashboard() {
  const actor = await requestActor();
  if (!canAccessWorkspace(actor)) redirect("/responder/access");

  const scope = { orgId: actor!.orgId, all: isPlatformAdmin(actor) };
  const [cases, metrics, orgCount, org] = await Promise.all([
    listWorkspaceCases(scope),
    countsForDashboard(scope),
    prisma.organization.count({ where: { active: true } }),
    actor!.orgId
      ? prisma.organization.findUnique({ where: { id: actor!.orgId }, select: { name: true } })
      : Promise.resolve(null)
  ]);

  return (
    <ResponderDashboardClient
      cases={cases.map((c) => ({
        id: c.publicCaseId,
        title: c.title,
        category: c.category,
        locationGeneral: c.locationGeneral,
        verification: c.verification,
        response: c.response,
        priority: c.priority,
        updatedAt: c.updatedAt.toISOString(),
        assigned: Boolean(c.assignedOrgId),
        publicationState: c.publicationState,
        awaitingReporter: c.awaitingReporter,
        proposedLinks: c._count.linksTo
      }))}
      metrics={metrics}
      orgCount={orgCount}
      viewer={{
        displayName: actor!.displayName,
        role: actor!.role,
        orgName: org?.name ?? null,
        isDemo: actor!.isDemo
      }}
    />
  );
}
