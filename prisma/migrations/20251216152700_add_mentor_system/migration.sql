-- CreateEnum
CREATE TYPE "MentorSignalType" AS ENUM ('MENTOR_ASSIGNED', 'REGISTERED_SAME_EVENT', 'ATTENDED_SAME_EVENT', 'FIRST_CONTACT', 'MENTOR_UNASSIGNED');

-- CreateTable
CREATE TABLE "MentorAssignment" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "newbieId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,
    "endedAt" TIMESTAMP(3),
    "endedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSignal" (
    "id" UUID NOT NULL,
    "mentorAssignmentId" UUID NOT NULL,
    "signalType" "MentorSignalType" NOT NULL,
    "eventId" UUID,
    "summary" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "yearNumber" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentorAssignment_mentorId_idx" ON "MentorAssignment"("mentorId");

-- CreateIndex
CREATE INDEX "MentorAssignment_newbieId_idx" ON "MentorAssignment"("newbieId");

-- CreateIndex
CREATE INDEX "MentorAssignment_assignedAt_idx" ON "MentorAssignment"("assignedAt");

-- CreateIndex
CREATE INDEX "MentorAssignment_endedAt_idx" ON "MentorAssignment"("endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorAssignment_newbieId_endedAt_key" ON "MentorAssignment"("newbieId", "endedAt");

-- CreateIndex
CREATE INDEX "MentorSignal_signalType_idx" ON "MentorSignal"("signalType");

-- CreateIndex
CREATE INDEX "MentorSignal_eventId_idx" ON "MentorSignal"("eventId");

-- CreateIndex
CREATE INDEX "MentorSignal_createdAt_idx" ON "MentorSignal"("createdAt");

-- CreateIndex
CREATE INDEX "MentorSignal_weekNumber_yearNumber_idx" ON "MentorSignal"("weekNumber", "yearNumber");

-- CreateIndex
CREATE INDEX "MentorSignal_mentorAssignmentId_idx" ON "MentorSignal"("mentorAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSignal_mentorAssignmentId_signalType_eventId_key" ON "MentorSignal"("mentorAssignmentId", "signalType", "eventId");

-- AddForeignKey
ALTER TABLE "MentorAssignment" ADD CONSTRAINT "MentorAssignment_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAssignment" ADD CONSTRAINT "MentorAssignment_newbieId_fkey" FOREIGN KEY ("newbieId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAssignment" ADD CONSTRAINT "MentorAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSignal" ADD CONSTRAINT "MentorSignal_mentorAssignmentId_fkey" FOREIGN KEY ("mentorAssignmentId") REFERENCES "MentorAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
