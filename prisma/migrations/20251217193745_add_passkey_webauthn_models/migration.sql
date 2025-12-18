-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_REGISTERED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_USED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSKEY_LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_LINK_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_LINK_USED';

-- CreateTable
CREATE TABLE "PasskeyCredential" (
    "id" UUID NOT NULL,
    "userAccountId" UUID NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "deviceName" TEXT,
    "aaguid" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedById" UUID,
    "revokedReason" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" UUID NOT NULL,
    "challenge" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userAccountId" UUID,
    "email" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMagicLink" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userAccountId" UUID,
    "purpose" TEXT NOT NULL DEFAULT 'login',
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyCredential_credentialId_key" ON "PasskeyCredential"("credentialId");

-- CreateIndex
CREATE INDEX "PasskeyCredential_userAccountId_idx" ON "PasskeyCredential"("userAccountId");

-- CreateIndex
CREATE INDEX "PasskeyCredential_credentialId_idx" ON "PasskeyCredential"("credentialId");

-- CreateIndex
CREATE INDEX "PasskeyCredential_isRevoked_idx" ON "PasskeyCredential"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "AuthChallenge_challenge_key" ON "AuthChallenge"("challenge");

-- CreateIndex
CREATE INDEX "AuthChallenge_challenge_idx" ON "AuthChallenge"("challenge");

-- CreateIndex
CREATE INDEX "AuthChallenge_userAccountId_idx" ON "AuthChallenge"("userAccountId");

-- CreateIndex
CREATE INDEX "AuthChallenge_email_idx" ON "AuthChallenge"("email");

-- CreateIndex
CREATE INDEX "AuthChallenge_expiresAt_idx" ON "AuthChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMagicLink_tokenHash_key" ON "EmailMagicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailMagicLink_tokenHash_idx" ON "EmailMagicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailMagicLink_email_idx" ON "EmailMagicLink"("email");

-- CreateIndex
CREATE INDEX "EmailMagicLink_expiresAt_idx" ON "EmailMagicLink"("expiresAt");

-- AddForeignKey
ALTER TABLE "PasskeyCredential" ADD CONSTRAINT "PasskeyCredential_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasskeyCredential" ADD CONSTRAINT "PasskeyCredential_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
