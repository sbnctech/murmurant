-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('BOARD_OFFICER', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER', 'EVENT_HOST');

-- CreateEnum
CREATE TYPE "TransitionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'APPLIED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MemberServiceHistory" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "committeeId" UUID,
    "committeeName" TEXT,
    "eventId" UUID,
    "eventTitle" TEXT,
    "termId" UUID,
    "termName" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "transitionPlanId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "MemberServiceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransitionPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetTermId" UUID NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "status" "TransitionStatus" NOT NULL DEFAULT 'DRAFT',
    "presidentApprovedAt" TIMESTAMP(3),
    "presidentApprovedById" UUID,
    "vpActivitiesApprovedAt" TIMESTAMP(3),
    "vpActivitiesApprovedById" UUID,
    "appliedAt" TIMESTAMP(3),
    "appliedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,

    CONSTRAINT "TransitionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransitionAssignment" (
    "id" UUID NOT NULL,
    "transitionPlanId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "committeeId" UUID,
    "isOutgoing" BOOLEAN NOT NULL DEFAULT false,
    "existingServiceId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransitionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberServiceHistory_memberId_idx" ON "MemberServiceHistory"("memberId");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_committeeId_idx" ON "MemberServiceHistory"("committeeId");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_eventId_idx" ON "MemberServiceHistory"("eventId");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_termId_idx" ON "MemberServiceHistory"("termId");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_serviceType_idx" ON "MemberServiceHistory"("serviceType");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_startAt_idx" ON "MemberServiceHistory"("startAt");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_endAt_idx" ON "MemberServiceHistory"("endAt");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_memberId_endAt_idx" ON "MemberServiceHistory"("memberId", "endAt");

-- CreateIndex
CREATE INDEX "MemberServiceHistory_transitionPlanId_idx" ON "MemberServiceHistory"("transitionPlanId");

-- CreateIndex
CREATE INDEX "TransitionPlan_status_idx" ON "TransitionPlan"("status");

-- CreateIndex
CREATE INDEX "TransitionPlan_effectiveAt_idx" ON "TransitionPlan"("effectiveAt");

-- CreateIndex
CREATE INDEX "TransitionPlan_targetTermId_idx" ON "TransitionPlan"("targetTermId");

-- CreateIndex
CREATE INDEX "TransitionAssignment_transitionPlanId_idx" ON "TransitionAssignment"("transitionPlanId");

-- CreateIndex
CREATE INDEX "TransitionAssignment_memberId_idx" ON "TransitionAssignment"("memberId");

-- CreateIndex
CREATE INDEX "TransitionAssignment_committeeId_idx" ON "TransitionAssignment"("committeeId");

-- AddForeignKey
ALTER TABLE "MemberServiceHistory" ADD CONSTRAINT "MemberServiceHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberServiceHistory" ADD CONSTRAINT "MemberServiceHistory_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberServiceHistory" ADD CONSTRAINT "MemberServiceHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberServiceHistory" ADD CONSTRAINT "MemberServiceHistory_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberServiceHistory" ADD CONSTRAINT "MemberServiceHistory_transitionPlanId_fkey" FOREIGN KEY ("transitionPlanId") REFERENCES "TransitionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberServiceHistory" ADD CONSTRAINT "MemberServiceHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionPlan" ADD CONSTRAINT "TransitionPlan_targetTermId_fkey" FOREIGN KEY ("targetTermId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionPlan" ADD CONSTRAINT "TransitionPlan_presidentApprovedById_fkey" FOREIGN KEY ("presidentApprovedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionPlan" ADD CONSTRAINT "TransitionPlan_vpActivitiesApprovedById_fkey" FOREIGN KEY ("vpActivitiesApprovedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionPlan" ADD CONSTRAINT "TransitionPlan_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionPlan" ADD CONSTRAINT "TransitionPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionAssignment" ADD CONSTRAINT "TransitionAssignment_transitionPlanId_fkey" FOREIGN KEY ("transitionPlanId") REFERENCES "TransitionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionAssignment" ADD CONSTRAINT "TransitionAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionAssignment" ADD CONSTRAINT "TransitionAssignment_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionAssignment" ADD CONSTRAINT "TransitionAssignment_existingServiceId_fkey" FOREIGN KEY ("existingServiceId") REFERENCES "MemberServiceHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
