-- Add new enum values to DeliveryStatus
ALTER TYPE "DeliveryStatus" ADD VALUE 'COMPLAINED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'UNSUBSCRIBED';

-- Add new enum values to AuditAction
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_BOUNCED';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_COMPLAINED';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_UNSUBSCRIBED';

-- Add new columns to DeliveryLog (all nullable for migration safety)
ALTER TABLE "DeliveryLog" ADD COLUMN "bounceType" TEXT;
ALTER TABLE "DeliveryLog" ADD COLUMN "complainedAt" TIMESTAMP(3);
ALTER TABLE "DeliveryLog" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);

-- CreateTable: EmailTrackingConfig
CREATE TABLE "EmailTrackingConfig" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trackOpens" BOOLEAN NOT NULL DEFAULT false,
    "trackClicks" BOOLEAN NOT NULL DEFAULT false,
    "trackBounces" BOOLEAN NOT NULL DEFAULT true,
    "trackComplaints" BOOLEAN NOT NULL DEFAULT true,
    "autoSuppressHardBounce" BOOLEAN NOT NULL DEFAULT true,
    "autoSuppressComplaint" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTrackingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmailSuppressionList
CREATE TABLE "EmailSuppressionList" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceLogId" UUID,
    "expiresAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSuppressionList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuppressionList_email_key" ON "EmailSuppressionList"("email");

-- CreateIndex
CREATE INDEX "EmailSuppressionList_email_idx" ON "EmailSuppressionList"("email");

-- CreateIndex
CREATE INDEX "EmailSuppressionList_reason_idx" ON "EmailSuppressionList"("reason");

-- CreateIndex
CREATE INDEX "EmailSuppressionList_expiresAt_idx" ON "EmailSuppressionList"("expiresAt");
