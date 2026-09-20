import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requestActor } from "@/lib/auth/actor";
import { canAccessWorkspace, canViewCase, isPlatformAdmin } from "@/lib/authz";
import { findCaseByPublicId, listOrganizations } from "@/lib/db/repository";
import { toResponderCaseView } from "@/lib/dto/case";
import { ResponderCasePanel } from "@/components/responder/ResponderCasePanel";
import { log } from "@/lib/log";

export const metadata: Metadata = { title: "Case workspace", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResponderCasePage({ params }: { params: { caseId: string } }) {
  const actor = await requestActor();
  if (!canAccessWorkspace(actor)) redirect("/responder/access");

  const record = await findCaseByPublicId(params.caseId);
  if (!record) notFound();

  // Organization scoping is enforced here, not in the component: a case
  // belonging to another organization's queue is never rendered at all.
  if (!canViewCase(actor, { assignedOrgId: record.assignedOrgId })) {
    log.warn("responder.case_access_denied", { userId: actor?.userId, caseId: record.publicCaseId });
    notFound();
  }

  const orgs = await listOrganizations();
  const view = toResponderCaseView(record, isPlatformAdmin(actor) ? "admin" : "responder");

  return (
    <ResponderCasePanel
      view={view}
      orgs={orgs}
      viewer={{ displayName: actor!.displayName, role: actor!.role, orgId: actor!.orgId }}
    />
  );
}
