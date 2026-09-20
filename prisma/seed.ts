import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "node:crypto";
import "dotenv/config";
import {
  DEMO_CASES,
  DEMO_CIVIC_ITEMS,
  DEMO_LINKS,
  DEMO_MAX_CASE_NUMBER,
  DEMO_ORGS,
  DEMO_USERS
} from "../src/lib/db/demo-dataset";
import { hashPassword } from "../src/lib/auth/password";

// Seeds the fictional demo corpus.
//
// Idempotent: running it twice leaves the same dataset. Timestamps are
// generated relative to the moment of seeding so the demo always looks live.

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const now = Date.now();
const at = (offsetMs: number) => new Date(now + offsetMs);

/** Demo responder password. Randomised unless one is supplied explicitly. */
const demoPassword = process.env.DEMO_RESPONDER_PASSWORD || crypto.randomBytes(18).toString("base64url");

async function main() {
  console.log("Seeding Civora demo dataset (fictional).");

  // Wipe in dependency order. Sessions and rate-limit counters survive.
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

  const orgIdBySlug = new Map<string, string>();
  for (const org of DEMO_ORGS) {
    const created = await prisma.organization.create({
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

  const passwordHash = await hashPassword(demoPassword);
  const userIdByEmail = new Map<string, string>();
  for (const user of DEMO_USERS) {
    const created = await prisma.user.create({
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

  // Map an org to the demo user who acts for it, so audit events have a real
  // actor rather than a generic desk label.
  const userForOrg = (slug?: string | null): string | null => {
    if (!slug) return userIdByEmail.get("triage@civora-demo.example") ?? null;
    const user = DEMO_USERS.find((u) => u.orgSlug === slug);
    return user ? userIdByEmail.get(user.email) ?? null : null;
  };

  const caseIdByPublicId = new Map<string, string>();

  for (const demo of DEMO_CASES) {
    const orgId = demo.orgSlug ? orgIdBySlug.get(demo.orgSlug)! : null;
    const created = await prisma.case.create({
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
      const createdReport = await prisma.report.create({
        data: {
          caseId: created.id,
          role: report.role,
          privacyMode: report.privacyMode,
          // Reports without a demo device token still need a unique hash; a
          // random one means nobody holds a token that opens them.
          trackingTokenHash: report.trackingTokenHash ?? crypto.randomBytes(32).toString("hex"),
          narrative: report.narrative,
          areaNote: report.areaNote ?? null,
          receivedAt: at(report.offsetMs)
        }
      });
      if (report.contact && report.privacyMode !== "anonymous") {
        await prisma.reporterContact.create({
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
      await prisma.evidence.create({
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
          // Seeded evidence describes documents that exist on paper in the
          // fiction; no bytes are stored, so no storageKey and no download.
          storageKey: null,
          publicVisible: evidence.publicVisible,
          sourceRef: evidence.sourceRef ?? null,
          submittedAt: at(evidence.offsetMs)
        }
      });
    }

    for (const event of demo.events) {
      await prisma.caseEvent.create({
        data: {
          caseId: created.id,
          type: event.type,
          actorType: event.actorType,
          actorId: event.actorType === "responder" || event.actorType === "organization"
            ? userForOrg(event.orgSlug)
            : null,
          actorLabel: event.actorLabel,
          organizationId: event.orgSlug ? orgIdBySlug.get(event.orgSlug)! : null,
          visibility: event.visibility,
          title: event.title,
          detail: event.detail ?? null,
          at: at(event.offsetMs)
        }
      });
    }

    for (const update of demo.updates) {
      await prisma.caseUpdate.create({
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
      await prisma.internalNote.create({
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
      await prisma.infoRequest.create({
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
      await prisma.caseAssignment.create({
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
    await prisma.caseLink.create({
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
    await prisma.civicInfoItem.create({
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

  // Keep the sequence above the seeded numbers so a new submission cannot
  // collide with a demo case id.
  await prisma.$executeRawUnsafe(
    `SELECT setval('civora_case_number_seq', ${DEMO_MAX_CASE_NUMBER}, true)`
  );

  console.log(`Seeded ${DEMO_CASES.length} fictional cases, ${DEMO_ORGS.length} organizations, ${DEMO_USERS.length} demo users, ${DEMO_CIVIC_ITEMS.length} civic items.`);
  if (!process.env.DEMO_RESPONDER_PASSWORD) {
    console.log(`Demo responder password (generated, not stored anywhere else): ${demoPassword}`);
    console.log("Set DEMO_RESPONDER_PASSWORD to choose your own, or sign in with the demo access code while CIVORA_DEMO_MODE=true.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
