import type { Role } from "@prisma/client";
import type { AuthenticatedActor } from "./auth/session";

// One place decides who may do what. Routes call these helpers; none of them
// re-derives permissions, and none of them trusts a client-supplied role,
// organization or case id.

export type ViewerRole = "public" | "reporter" | "responder" | "admin";

export interface CaseScope {
  assignedOrgId: string | null;
}

export function isStaff(actor: AuthenticatedActor | null): boolean {
  if (!actor) return false;
  return actor.role === "responder" || actor.role === "organization_admin" || actor.role === "platform_admin";
}

export function isPlatformAdmin(actor: AuthenticatedActor | null): boolean {
  return actor?.role === "platform_admin";
}

export function isOrgAdmin(actor: AuthenticatedActor | null): boolean {
  return actor?.role === "organization_admin" || actor?.role === "platform_admin";
}

/**
 * May this actor open the responder workspace at all?
 * Citizens never can, however they authenticated.
 */
export function canAccessWorkspace(actor: AuthenticatedActor | null): boolean {
  return isStaff(actor);
}

/**
 * May this actor read the restricted view of a case?
 *
 * Platform admins see everything. Everyone else sees unassigned cases (the
 * shared triage queue) and cases assigned to their own organization — never
 * another organization's active casework.
 */
export function canViewCase(actor: AuthenticatedActor | null, scope: CaseScope): boolean {
  if (!isStaff(actor)) return false;
  if (isPlatformAdmin(actor)) return true;
  if (!scope.assignedOrgId) return true;
  return Boolean(actor?.orgId) && actor!.orgId === scope.assignedOrgId;
}

/** May this actor record an action against a case? Same rule as reading it. */
export function canActOnCase(actor: AuthenticatedActor | null, scope: CaseScope): boolean {
  return canViewCase(actor, scope);
}

/**
 * May this actor route a case to `targetOrgId`?
 *
 * Triage is routing, so anyone who can work the shared unassigned queue can
 * send a case from it to whichever organization is responsible — that is the
 * job, and they can already read those cases.
 *
 * What is protected is a case that already belongs to someone: once assigned,
 * only that organization can move it, unless the actor is an organization
 * admin (who hands work off between organizations) or a platform admin.
 * Handing a case back to the unassigned queue is always allowed.
 */
export function canAssignToOrg(
  actor: AuthenticatedActor | null,
  scope: CaseScope,
  targetOrgId: string | null
): boolean {
  if (!canActOnCase(actor, scope)) return false;
  if (isPlatformAdmin(actor)) return true;
  if (targetOrgId === null) return true;
  if (scope.assignedOrgId === null) return true;
  if (actor?.orgId && targetOrgId === actor.orgId) return true;
  return isOrgAdmin(actor);
}

/** May this actor decide a proposed corroboration link? */
export function canDecideCaseLink(actor: AuthenticatedActor | null, scope: CaseScope): boolean {
  return canActOnCase(actor, scope);
}

/** May this actor publish or unpublish a case? */
export function canChangePublication(actor: AuthenticatedActor | null, scope: CaseScope): boolean {
  return canActOnCase(actor, scope);
}

/** The viewer role a DTO builder should use. */
export function viewerRoleFor(
  actor: AuthenticatedActor | null,
  scope: CaseScope,
  isAuthorizedReporter: boolean
): ViewerRole {
  if (isPlatformAdmin(actor)) return "admin";
  if (canViewCase(actor, scope)) return "responder";
  if (isAuthorizedReporter) return "reporter";
  return "public";
}

export const ROLE_LABEL: Record<Role, string> = {
  citizen: "Citizen",
  responder: "Responder",
  organization_admin: "Organization administrator",
  platform_admin: "Platform administrator"
};
