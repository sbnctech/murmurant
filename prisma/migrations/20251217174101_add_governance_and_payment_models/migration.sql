-- CreateEnum
CREATE TYPE "GovernanceMeetingType" AS ENUM ('BOARD', 'EXECUTIVE', 'SPECIAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "MinutesStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISED', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MotionResult" AS ENUM ('PASSED', 'FAILED', 'TABLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReviewFlagType" AS ENUM ('INSURANCE_REVIEW', 'LEGAL_REVIEW', 'POLICY_REVIEW', 'COMPLIANCE_CHECK', 'GENERAL');

-- CreateEnum
CREATE TYPE "ReviewFlagStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_ACTION', 'REFUND_PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "EmailSuppressionList" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmailTrackingConfig" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable: Add confirmedAt column (default change for status handled separately due to enum constraint)
ALTER TABLE "EventRegistration" ADD COLUMN "confirmedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerRef" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'fake',
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'CREATED',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "metadata" JSONB,
    "checkoutUrl" TEXT,
    "webhookReceivedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" UUID NOT NULL,
    "jobName" TEXT NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "requestId" TEXT,
    "status" "JobRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceMeeting" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" "GovernanceMeetingType" NOT NULL,
    "title" TEXT,
    "location" TEXT,
    "attendanceCount" INTEGER,
    "quorumMet" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceMinutes" (
    "id" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "status" "MinutesStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "summary" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "reviewNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "publishedAt" TIMESTAMP(3),
    "publishedById" UUID,
    "createdById" UUID,
    "lastEditedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceMinutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceMotion" (
    "id" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "motionNumber" INTEGER NOT NULL,
    "motionText" TEXT NOT NULL,
    "movedById" UUID,
    "secondedById" UUID,
    "votesYes" INTEGER NOT NULL DEFAULT 0,
    "votesNo" INTEGER NOT NULL DEFAULT 0,
    "votesAbstain" INTEGER NOT NULL DEFAULT 0,
    "result" "MotionResult",
    "resultNotes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceMotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceAnnotation" (
    "id" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "motionId" UUID,
    "anchor" TEXT,
    "body" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceReviewFlag" (
    "id" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "flagType" "ReviewFlagType" NOT NULL,
    "status" "ReviewFlagStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" UUID,
    "resolution" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceReviewFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_registrationId_idx" ON "PaymentIntent"("registrationId");

-- CreateIndex
CREATE INDEX "PaymentIntent_providerRef_idx" ON "PaymentIntent"("providerRef");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "PaymentIntent_createdAt_idx" ON "PaymentIntent"("createdAt");

-- CreateIndex
CREATE INDEX "JobRun_jobName_idx" ON "JobRun"("jobName");

-- CreateIndex
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");

-- CreateIndex
CREATE INDEX "JobRun_scheduledFor_idx" ON "JobRun"("scheduledFor");

-- CreateIndex
CREATE INDEX "JobRun_createdAt_idx" ON "JobRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobRun_jobName_scheduledFor_key" ON "JobRun"("jobName", "scheduledFor");

-- CreateIndex
CREATE INDEX "GovernanceMeeting_date_idx" ON "GovernanceMeeting"("date");

-- CreateIndex
CREATE INDEX "GovernanceMeeting_type_idx" ON "GovernanceMeeting"("type");

-- CreateIndex
CREATE INDEX "GovernanceMeeting_createdById_idx" ON "GovernanceMeeting"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceMeeting_date_type_key" ON "GovernanceMeeting"("date", "type");

-- CreateIndex
CREATE INDEX "GovernanceMinutes_meetingId_idx" ON "GovernanceMinutes"("meetingId");

-- CreateIndex
CREATE INDEX "GovernanceMinutes_status_idx" ON "GovernanceMinutes"("status");

-- CreateIndex
CREATE INDEX "GovernanceMinutes_createdAt_idx" ON "GovernanceMinutes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceMinutes_meetingId_version_key" ON "GovernanceMinutes"("meetingId", "version");

-- CreateIndex
CREATE INDEX "GovernanceMotion_meetingId_idx" ON "GovernanceMotion"("meetingId");

-- CreateIndex
CREATE INDEX "GovernanceMotion_result_idx" ON "GovernanceMotion"("result");

-- CreateIndex
CREATE UNIQUE INDEX "GovernanceMotion_meetingId_motionNumber_key" ON "GovernanceMotion"("meetingId", "motionNumber");

-- CreateIndex
CREATE INDEX "GovernanceAnnotation_targetType_targetId_idx" ON "GovernanceAnnotation"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "GovernanceAnnotation_motionId_idx" ON "GovernanceAnnotation"("motionId");

-- CreateIndex
CREATE INDEX "GovernanceAnnotation_createdById_idx" ON "GovernanceAnnotation"("createdById");

-- CreateIndex
CREATE INDEX "GovernanceAnnotation_isPublished_idx" ON "GovernanceAnnotation"("isPublished");

-- CreateIndex
CREATE INDEX "GovernanceReviewFlag_targetType_targetId_idx" ON "GovernanceReviewFlag"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "GovernanceReviewFlag_flagType_idx" ON "GovernanceReviewFlag"("flagType");

-- CreateIndex
CREATE INDEX "GovernanceReviewFlag_status_idx" ON "GovernanceReviewFlag"("status");

-- CreateIndex
CREATE INDEX "GovernanceReviewFlag_dueDate_idx" ON "GovernanceReviewFlag"("dueDate");

-- CreateIndex
CREATE INDEX "GovernanceReviewFlag_createdById_idx" ON "GovernanceReviewFlag"("createdById");

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMeeting" ADD CONSTRAINT "GovernanceMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "GovernanceMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMinutes" ADD CONSTRAINT "GovernanceMinutes_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMotion" ADD CONSTRAINT "GovernanceMotion_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "GovernanceMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMotion" ADD CONSTRAINT "GovernanceMotion_movedById_fkey" FOREIGN KEY ("movedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMotion" ADD CONSTRAINT "GovernanceMotion_secondedById_fkey" FOREIGN KEY ("secondedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceMotion" ADD CONSTRAINT "GovernanceMotion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceAnnotation" ADD CONSTRAINT "GovernanceAnnotation_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "GovernanceMotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceAnnotation" ADD CONSTRAINT "GovernanceAnnotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceReviewFlag" ADD CONSTRAINT "GovernanceReviewFlag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceReviewFlag" ADD CONSTRAINT "GovernanceReviewFlag_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
