import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { hashPassword } from "../auth/password";
import {
  DEMO_CASES,
  DEMO_CIVIC_ITEMS,
  DEMO_LINKS,
  DEMO_MAX_CASE_NUMBER,
  DEMO_ORGS,
  DEMO_USERS
} from "./demo-dataset";

// Re-seeds the fictional dataset at runtime.
//
// Only reachable from the demo reset endpoint, which is gated on demo mode,
// ENABLE_DEMO_TOOLS and a platform-admin session.

export async function reseedDemoDataset(): Promise<{
  cases: number;
  organizations: number;
  civicItems: number;
}> {
  const now = Date.now();
  const at = (offsetMs: number) => new Date(now + offsetMs);
  const password = process.env.DEMO_RESPONDER_PASSWORD || crypto.randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.caseLink.deleteMany();
    await tx.infoRequest.deleteMany();
    await tx.caseAssignment.deleteMany();
    await tx.internalNote.deleteMany();
    await tx.caseUpdate.deleteMany();
    await tx.caseEvent.deleteMany();
    await tx.evidence.deleteMany();
    await tx.reporterContact.deleteMany();
    await tx.report.deleteMany();
    await tx.case.deleteMany();
    await tx.civicInfoItem.deleteMany();
    await tx.session.deleteMany();
    await tx.user.deleteMany();
    await tx.organization.deleteMany();

    const orgIdBySlug = new Map<string, string>();
    for (const org of DEMO_ORGS) {
      const created = await tx.organization.create({
        data: {
          slug: org.slug,
          name: org.name,
          description: org.description,
          contactEmail: org.contactEmail,
          fictional: true
        }
      });
      orgIdBySlug.set(org.slug, created.id);
    }

    const userIdByEmail = new Map<string, string>();
    for (const user of DEMO_USERS) {
      const created = await tx.user.create({
        data: {
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          passwordHash,
          isDemo: true,
          orgId: user.orgSlug ? orgIdBySlug.get(user.orgSlug)! : null
        }
      });
      userIdByEmail.set(user.email, created.id);
    }
    const userForOrg = (slug?: string | null): string | null => {
      if (!slug) return userIdByEmail.get("triage@civora-demo.example") ?? null;
      const user = DEMO_USERS.find((u) => u.orgSlug === slug);
      return user ? userIdByEmail.get(user.email) ?? null : null;
    };

    const caseIdByPublicId = new Map<string, string>();
    for (const demo of DEMO_CASES) {
      const orgId = demo.orgSlug ? orgIdBySlug.get(demo.orgSlug)! : null;
      const created = await tx.case.create({
        data: {
          publicCaseId: demo.publicCaseId,
          caseNumber: demo.caseNumber,
          title: demo.title,
          publicSummary: demo.publicSummary,
          privateDescription: demo.privateDescription,
          category: demo.category,
          locationGeneral: demo.locationGeneral ?? null,
          incidentAt: at(demo.incidentOffsetMs),
          privacyMode: demo.privacyMode,
          verification: demo.verification,
          verificationReason: demo.verificationReason ?? null,
          response: demo.response,
          priority: demo.priority,
          publicationState: demo.publicationState,
          publicVisible: demo.publicationState === "public_case",
          screeningFlags: demo.screeningFlags ?? [],
          assignedOrgId: orgId,
          nextUpdateAt: demo.nextUpdateOffsetMs !== undefined ? at(demo.nextUpdateOffsetMs) : null,
          awaitingReporter: demo.awaitingReporter ?? false,
          disputePathway: demo.disputePathway ?? false,
          known: demo.known,
          uncertain: demo.uncertain,
          createdAt: at(demo.createdOffsetMs),
          updatedAt: at(demo.updatedOffsetMs),
          closedAt: demo.closedOffsetMs !== undefined ? at(demo.closedOffsetMs) : null,
          resolvedAt: demo.resolvedOffsetMs !== undefined ? at(demo.resolvedOffsetMs) : null
        }
      });
      caseIdByPublicId.set(demo.publicCaseId, created.id);

      for (const report of demo.reports) {
        const createdReport = await tx.report.create({
          data: {
            caseId: created.id,
            role: report.role,
            privacyMode: report.privacyMode,
            trackingTokenHash: report.trackingTokenHash ?? crypto.randomBytes(32).toString("hex"),
            narrative: report.narrative,
            areaNote: report.areaNote ?? null,
            receivedAt: at(report.offsetMs)
          }
        });
        if (report.contact && report.privacyMode !== "anonymous") {
          await tx.reporterContact.create({
            data: {
              reportId: createdReport.id,
              name: report.contact.name ?? null,
              email: report.contact.email ?? null,
              phone: report.contact.phone ?? null,
              preferredChannel: report.contact.preferredChannel ?? null
            }
          });
        }
      }

      for (const evidence of demo.evidence) {
        await tx.evidence.create({
          data: {
            caseId: created.id,
            kind: evidence.kind,
            title: evidence.title,
            sourceType: evidence.sourceType,
            submittedByLabel: evidence.submittedByLabel,
            excerpt: evidence.excerpt ?? null,
            relationship: evidence.relationship,
            fileName: evidence.fileName ?? null,
            mimeType: evidence.mimeType ?? null,
            sizeBytes: evidence.sizeBytes ?? null,
            checksum: evidence.checksum ?? null,
            storageKey: null,
            publicVisible: evidence.publicVisible,
            sourceRef: evidence.sourceRef ?? null,
            submittedAt: at(evidence.offsetMs)
          }
        });
      }

      for (const ev of demo.events) {
        await tx.caseEvent.create({
          data: {
            caseId: created.id,
            type: ev.type,
            actorType: ev.actorType,
            actorId:
              ev.actorType === "responder" || ev.actorType === "organization" ? userForOrg(ev.orgSlug) : null,
            actorLabel: ev.actorLabel,
            organizationId: ev.orgSlug ? orgIdBySlug.get(ev.orgSlug)! : null,
            visibility: ev.visibility,
            title: ev.title,
            detail: ev.detail ?? null,
            at: at(ev.offsetMs)
          }
        });
      }

      for (const update of demo.updates) {
        await tx.caseUpdate.create({
          data: {
            caseId: created.id,
            authorLabel: update.authorLabel,
            authorId: userForOrg(update.orgSlug),
            organizationId: update.orgSlug ? orgIdBySlug.get(update.orgSlug)! : null,
            body: update.body,
            at: at(update.offsetMs)
          }
        });
      }

      for (const note of demo.notes) {
        await tx.internalNote.create({
          data: {
            caseId: created.id,
            authorLabel: note.authorLabel,
            authorId: userForOrg(demo.orgSlug),
            body: note.body,
            at: at(note.offsetMs)
          }
        });
      }

      for (const request of demo.infoRequests ?? []) {
        await tx.infoRequest.create({
          data: {
            caseId: created.id,
            requestedById: userForOrg(request.orgSlug),
            requestedByLabel: request.requestedByLabel,
            message: request.message,
            status: request.status,
            createdAt: at(request.offsetMs),
            answeredAt: request.answerOffsetMs !== undefined ? at(request.answerOffsetMs) : null,
            answerBody: request.answerBody ?? null
          }
        });
      }

      if (orgId) {
        await tx.caseAssignment.create({
          data: {
            caseId: created.id,
            orgId,
            assignedById: userForOrg(null),
            assignedAt: at(demo.createdOffsetMs + 3_600_000),
            active: true
          }
        });
      }
    }

    for (const link of DEMO_LINKS) {
      const sourceId = caseIdByPublicId.get(link.sourcePublicId);
      const targetId = caseIdByPublicId.get(link.targetPublicId);
      if (!sourceId || !targetId) continue;
      await tx.caseLink.create({
        data: {
          sourceCaseId: sourceId,
          targetCaseId: targetId,
          score: link.score,
          signals: link.signals as unknown as Prisma.InputJsonValue,
          status: link.status,
          decisionNote: link.decisionNote ?? null,
          createdAt: at(link.createdOffsetMs),
          decidedAt: link.decidedOffsetMs !== undefined ? at(link.decidedOffsetMs) : null
        }
      });
    }

    for (const item of DEMO_CIVIC_ITEMS) {
      await tx.civicInfoItem.create({
        data: {
          id: item.id,
          title: item.title,
          category: item.category,
          country: item.country,
          region: item.region ?? null,
          locality: item.locality ?? null,
          level: item.level,
          explanation: item.explanation,
          officialSource: item.officialSource,
          sourceUrl: item.sourceUrl ?? null,
          sourceAuthority: item.sourceAuthority,
          publishedAt: at(item.publishedOffsetMs),
          lastVerifiedAt: at(item.lastVerifiedOffsetMs),
          freshnessThresholdDays: item.freshnessThresholdDays,
          verificationMethod: item.verificationMethod ?? null,
          eligibility: item.eligibility ?? null,
          requirements: item.requirements ?? [],
          fees: item.fees ?? null,
          deadlines: item.deadlines ?? null,
          contactInfo: item.contactInfo ?? null,
          nextActions: item.nextActions as unknown as Prisma.InputJsonValue,
          relatedCaseIds: item.relatedCaseIds ?? [],
          relatedCivicIds: [],
          whatRemainsUncertain: item.whatRemainsUncertain ?? [],
          languageVersions: {} as Prisma.InputJsonValue,
          fictional: true,
          tags: item.tags ?? []
        }
      });
    }
  }, { timeout: 60_000 });

  await prisma.$executeRawUnsafe(
    `SELECT setval('civora_case_number_seq', ${DEMO_MAX_CASE_NUMBER}, true)`
  );

  return {
    cases: DEMO_CASES.length,
    organizations: DEMO_ORGS.length,
    civicItems: DEMO_CIVIC_ITEMS.length
  };
}
