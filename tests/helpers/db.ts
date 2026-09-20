import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@prisma/client";

// Test fixtures. Each suite starts from an empty database so a failure in one
// file cannot cascade into confusing failures in another.

export async function resetDatabase(): Promise<void> {
  await prisma.caseLink.deleteMany();
  await prisma.infoRequest.deleteMany();
  await prisma.caseAssignment.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.caseUpdate.deleteMany();
  await prisma.caseEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.reporterContact.deleteMany();
  await prisma.report.deleteMany();
  await prisma.case.deleteMany();
  await prisma.civicInfoItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.rateLimitCounter.deleteMany();
}

export async function createOrg(slug: string, name = slug) {
  return prisma.organization.create({
    data: { slug, name, description: `${name} (test fixture)`, contactEmail: `${slug}@test.example` }
  });
}

export async function createUser(options: {
  email: string;
  role: Role;
  orgId?: string | null;
  password?: string;
  displayName?: string;
}) {
  return prisma.user.create({
    data: {
      email: options.email,
      displayName: options.displayName ?? options.email,
      role: options.role,
      orgId: options.orgId ?? null,
      passwordHash: options.password ? await hashPassword(options.password) : null
    }
  });
}

/** An actor shaped like the one currentActor() returns, for authz tests. */
export function actorFor(user: { id: string; role: Role; orgId: string | null; displayName?: string }) {
  return {
    userId: user.id,
    sessionId: "test-session",
    role: user.role,
    orgId: user.orgId,
    displayName: user.displayName ?? "Test user",
    email: "test@test.example",
    isDemo: false
  };
}

export { prisma };
