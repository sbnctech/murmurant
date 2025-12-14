-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventChairId" UUID;

-- CreateIndex
CREATE INDEX "Event_eventChairId_idx" ON "Event"("eventChairId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventChairId_fkey" FOREIGN KEY ("eventChairId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
