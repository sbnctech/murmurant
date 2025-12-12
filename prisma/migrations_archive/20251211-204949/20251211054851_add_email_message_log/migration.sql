-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SUPPRESSED');

-- CreateTable
CREATE TABLE "EmailMessageLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" TEXT,
    "eventId" TEXT,
    "email" TEXT NOT NULL,
    "direction" "EmailDirection" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "rawProviderPayload" JSONB,

    CONSTRAINT "EmailMessageLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailMessageLog" ADD CONSTRAINT "EmailMessageLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessageLog" ADD CONSTRAINT "EmailMessageLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
