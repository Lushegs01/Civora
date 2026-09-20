-- CreateEnum
CREATE TYPE "PrivacyMode" AS ENUM ('anonymous', 'confidential', 'identified');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('unverified', 'partially_verified', 'documented', 'conflicting', 'resolved');

-- CreateEnum
CREATE TYPE "ResponseState" AS ENUM ('not_assigned', 'received', 'acknowledged', 'in_progress', 'action_recorded', 'closed');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('private_case', 'screening', 'public_case', 'restricted', 'archived');

-- CreateEnum
CREATE TYPE "CaseCategory" AS ENUM ('safety', 'community', 'service', 'infrastructure', 'dispute', 'other');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('standard', 'elevated', 'urgent');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('photo', 'video', 'document', 'report', 'official', 'note');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('primary', 'corroborating', 'official', 'citizen');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('REPORT_SUBMITTED', 'EVIDENCE_ADDED', 'POSSIBLE_MATCH_FOUND', 'CORROBORATION_CONFIRMED', 'CORROBORATION_REJECTED', 'VERIFICATION_UPDATED', 'CASE_ASSIGNED', 'CASE_ACKNOWLEDGED', 'RESPONSE_IN_PROGRESS', 'INFO_REQUESTED', 'INFO_PROVIDED', 'PUBLIC_UPDATE_ADDED', 'ACTION_RECORDED', 'UPDATE_REQUESTED', 'PUBLICATION_CHANGED', 'CASE_CLOSED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'restricted');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('system', 'reporter', 'responder', 'organization', 'matching_rule');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('citizen', 'responder', 'organization_admin', 'platform_admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('proposed', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "InfoRequestStatus" AS ENUM ('open', 'answered', 'cancelled');

-- CreateEnum
CREATE TYPE "CivicCategory" AS ENUM ('service', 'right', 'policy', 'opportunity', 'project', 'safety', 'procedure');

-- CreateEnum
CREATE TYPE "JurisdictionLevel" AS ENUM ('federal', 'state', 'local');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactEmail" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fictional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'citizen',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "passwordHash" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "bindingHash" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "publicCaseId" TEXT NOT NULL,
    "caseNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "publicSummary" TEXT NOT NULL,
    "privateDescription" TEXT NOT NULL,
    "category" "CaseCategory" NOT NULL,
    "locationGeneral" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "incidentAt" TIMESTAMP(3) NOT NULL,
    "privacyMode" "PrivacyMode" NOT NULL,
    "verification" "VerificationState" NOT NULL DEFAULT 'unverified',
    "verificationReason" TEXT,
    "response" "ResponseState" NOT NULL DEFAULT 'received',
    "priority" "CasePriority" NOT NULL DEFAULT 'standard',
    "publicationState" "PublicationState" NOT NULL DEFAULT 'screening',
    "publicVisible" BOOLEAN NOT NULL DEFAULT false,
    "screeningFlags" TEXT[],
    "assignedOrgId" TEXT,
    "nextUpdateAt" TIMESTAMP(3),
    "awaitingReporter" BOOLEAN NOT NULL DEFAULT false,
    "disputePathway" BOOLEAN NOT NULL DEFAULT false,
    "known" TEXT[],
    "uncertain" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "retainUntil" TIMESTAMP(3),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'initial',
    "privacyMode" "PrivacyMode" NOT NULL,
    "trackingTokenHash" TEXT NOT NULL,
    "recoveryCodeHash" TEXT,
    "narrative" TEXT NOT NULL,
    "areaNote" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitterHash" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReporterContact" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "preferredChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReporterContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "submittedByLabel" TEXT NOT NULL,
    "submittedById" TEXT,
    "excerpt" TEXT,
    "relationship" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "storageKey" TEXT,
    "storageDriver" TEXT,
    "publicVisible" BOOLEAN NOT NULL DEFAULT false,
    "sourceRef" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retainUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "organizationId" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseUpdate" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorLabel" TEXT NOT NULL,
    "authorId" TEXT,
    "organizationId" TEXT,
    "body" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorLabel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CaseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseLink" (
    "id" TEXT NOT NULL,
    "sourceCaseId" TEXT NOT NULL,
    "targetCaseId" TEXT NOT NULL,
    "reportId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "signals" JSONB NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'proposed',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfoRequest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "requestedById" TEXT,
    "requestedByLabel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InfoRequestStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "answerBody" TEXT,

    CONSTRAINT "InfoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CivicInfoItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "CivicCategory" NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "locality" TEXT,
    "level" "JurisdictionLevel" NOT NULL,
    "explanation" TEXT NOT NULL,
    "officialSource" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceAuthority" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "freshnessThresholdDays" INTEGER NOT NULL DEFAULT 180,
    "verificationMethod" TEXT,
    "eligibility" TEXT,
    "requirements" TEXT[],
    "fees" TEXT,
    "deadlines" TEXT,
    "contactInfo" TEXT,
    "nextActions" JSONB NOT NULL,
    "relatedCaseIds" TEXT[],
    "relatedCivicIds" TEXT[],
    "whatRemainsUncertain" TEXT[],
    "languageVersions" JSONB NOT NULL,
    "fictional" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivicInfoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitCounter" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_active_idx" ON "Organization"("active");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_role_idx" ON "User"("orgId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Case_publicCaseId_key" ON "Case"("publicCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- CreateIndex
CREATE INDEX "Case_publicVisible_updatedAt_idx" ON "Case"("publicVisible", "updatedAt");

-- CreateIndex
CREATE INDEX "Case_response_updatedAt_idx" ON "Case"("response", "updatedAt");

-- CreateIndex
CREATE INDEX "Case_verification_idx" ON "Case"("verification");

-- CreateIndex
CREATE INDEX "Case_assignedOrgId_response_idx" ON "Case"("assignedOrgId", "response");

-- CreateIndex
CREATE INDEX "Case_category_incidentAt_idx" ON "Case"("category", "incidentAt");

-- CreateIndex
CREATE INDEX "Case_updatedAt_idx" ON "Case"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_trackingTokenHash_key" ON "Report"("trackingTokenHash");

-- CreateIndex
CREATE INDEX "Report_caseId_receivedAt_idx" ON "Report"("caseId", "receivedAt");

-- CreateIndex
CREATE INDEX "Report_trackingTokenHash_idx" ON "Report"("trackingTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ReporterContact_reportId_key" ON "ReporterContact"("reportId");

-- CreateIndex
CREATE INDEX "Evidence_caseId_submittedAt_idx" ON "Evidence"("caseId", "submittedAt");

-- CreateIndex
CREATE INDEX "Evidence_caseId_publicVisible_idx" ON "Evidence"("caseId", "publicVisible");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_at_idx" ON "CaseEvent"("caseId", "at");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_visibility_at_idx" ON "CaseEvent"("caseId", "visibility", "at");

-- CreateIndex
CREATE INDEX "CaseUpdate_caseId_at_idx" ON "CaseUpdate"("caseId", "at");

-- CreateIndex
CREATE INDEX "InternalNote_caseId_at_idx" ON "InternalNote"("caseId", "at");

-- CreateIndex
CREATE INDEX "CaseAssignment_caseId_active_idx" ON "CaseAssignment"("caseId", "active");

-- CreateIndex
CREATE INDEX "CaseAssignment_orgId_active_idx" ON "CaseAssignment"("orgId", "active");

-- CreateIndex
CREATE INDEX "CaseLink_targetCaseId_status_idx" ON "CaseLink"("targetCaseId", "status");

-- CreateIndex
CREATE INDEX "CaseLink_status_createdAt_idx" ON "CaseLink"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseLink_sourceCaseId_targetCaseId_key" ON "CaseLink"("sourceCaseId", "targetCaseId");

-- CreateIndex
CREATE INDEX "InfoRequest_caseId_status_idx" ON "InfoRequest"("caseId", "status");

-- CreateIndex
CREATE INDEX "CivicInfoItem_category_lastVerifiedAt_idx" ON "CivicInfoItem"("category", "lastVerifiedAt");

-- CreateIndex
CREATE INDEX "CivicInfoItem_level_locality_idx" ON "CivicInfoItem"("level", "locality");

-- CreateIndex
CREATE INDEX "RateLimitCounter_expiresAt_idx" ON "RateLimitCounter"("expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_assignedOrgId_fkey" FOREIGN KEY ("assignedOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporterContact" ADD CONSTRAINT "ReporterContact_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_sourceCaseId_fkey" FOREIGN KEY ("sourceCaseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_targetCaseId_fkey" FOREIGN KEY ("targetCaseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLink" ADD CONSTRAINT "CaseLink_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfoRequest" ADD CONSTRAINT "InfoRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfoRequest" ADD CONSTRAINT "InfoRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Concurrency-safe public case numbers.
-- Allocated with nextval() inside the case-creating transaction, so two
-- simultaneous submissions can never be handed the same "CS-nnnn".
-- Starts above the seeded fictional dataset's highest number.
CREATE SEQUENCE IF NOT EXISTS "civora_case_number_seq" AS integer START WITH 1046 INCREMENT BY 1;
