-- AlterEnum: Add new registration status values
-- Note: Using the new values must be done in a separate transaction (migration)
ALTER TYPE "RegistrationStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "RegistrationStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "RegistrationStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';
ALTER TYPE "RegistrationStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
