-- CreateEnum
CREATE TYPE "CinemaStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INVITATION_SENT');

-- CreateEnum
CREATE TYPE "PricingStatus" AS ENUM ('ACTIVE', 'PENDING_AGREEMENT', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "OperatorRole" AS ENUM ('ADMIN', 'MANAGER', 'PROJECTIONIST');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('PHONE', 'EMAIL', 'GOOGLE', 'APPLE');

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'COMPLETED';

-- DropIndex
DROP INDEX "BreakSession_ticketId_key";

-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "cinemaId" TEXT;

-- AlterTable
ALTER TABLE "BreakSession" ADD COLUMN     "breakNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "durationSeconds" INTEGER;

-- AlterTable
ALTER TABLE "Cinema" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "organizationName" TEXT,
ADD COLUMN     "screeningSystem" TEXT DEFAULT 'Dolby TMS',
ADD COLUMN     "status" "CinemaStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "ticketingSystem" TEXT DEFAULT 'Vista',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DemonstrationTicket" ADD COLUMN     "breakCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxBreaks" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "UsageBillingEvent" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'TZS',
ALTER COLUMN "isSimulated" SET DEFAULT false,
ALTER COLUMN "disclaimer" SET DEFAULT 'Standard billing event recorded for verified session';

-- CreateTable
CREATE TABLE "CinemaPricingRule" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "pricePerSession" INTEGER NOT NULL DEFAULT 500,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "status" "PricingStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CinemaPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorUser" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "OperatorRole" NOT NULL DEFAULT 'MANAGER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "sessionToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPERADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerApplication" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Tanzania',
    "venueCount" INTEGER NOT NULL DEFAULT 1,
    "screensCount" INTEGER NOT NULL DEFAULT 1,
    "ticketingSystem" TEXT NOT NULL DEFAULT 'Vista',
    "screeningServer" TEXT NOT NULL DEFAULT 'Dolby TMS',
    "technicalContactEmail" TEXT,
    "notes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CinemaRegistrationInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Tanzania',
    "screensCount" INTEGER NOT NULL DEFAULT 1,
    "ticketingSystem" TEXT DEFAULT 'Vista',
    "screeningServer" TEXT DEFAULT 'Dolby TMS',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "cinemaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CinemaRegistrationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "sessionToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "termsAcceptedVersion" TEXT,
    "privacyAcceptedVersion" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "emailVerificationCode" TEXT,
    "emailVerificationExpiresAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "themePreference" TEXT NOT NULL DEFAULT 'SYSTEM',
    "notificationPreferences" JSONB,
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningReminder" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "screeningId" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "offsetMinutes" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CinemaPricingRule_cinemaId_idx" ON "CinemaPricingRule"("cinemaId");

-- CreateIndex
CREATE INDEX "CinemaPricingRule_status_idx" ON "CinemaPricingRule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorUser_email_key" ON "OperatorUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorUser_sessionToken_key" ON "OperatorUser"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorUser_passwordResetToken_key" ON "OperatorUser"("passwordResetToken");

-- CreateIndex
CREATE INDEX "OperatorUser_cinemaId_idx" ON "OperatorUser"("cinemaId");

-- CreateIndex
CREATE INDEX "OperatorUser_email_idx" ON "OperatorUser"("email");

-- CreateIndex
CREATE INDEX "OperatorUser_sessionToken_idx" ON "OperatorUser"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_username_idx" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "PartnerApplication_contactEmail_idx" ON "PartnerApplication"("contactEmail");

-- CreateIndex
CREATE INDEX "PartnerApplication_status_idx" ON "PartnerApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CinemaRegistrationInvitation_token_key" ON "CinemaRegistrationInvitation"("token");

-- CreateIndex
CREATE INDEX "CinemaRegistrationInvitation_token_idx" ON "CinemaRegistrationInvitation"("token");

-- CreateIndex
CREATE INDEX "CinemaRegistrationInvitation_contactEmail_idx" ON "CinemaRegistrationInvitation"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_phoneNumber_key" ON "CustomerAccount"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_email_key" ON "CustomerAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_sessionToken_key" ON "CustomerAccount"("sessionToken");

-- CreateIndex
CREATE INDEX "CustomerAccount_phoneNumber_idx" ON "CustomerAccount"("phoneNumber");

-- CreateIndex
CREATE INDEX "CustomerAccount_email_idx" ON "CustomerAccount"("email");

-- CreateIndex
CREATE INDEX "ScreeningReminder_customerId_idx" ON "ScreeningReminder"("customerId");

-- CreateIndex
CREATE INDEX "ScreeningReminder_screeningId_idx" ON "ScreeningReminder"("screeningId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningReminder_customerId_screeningId_offsetMinutes_key" ON "ScreeningReminder"("customerId", "screeningId", "offsetMinutes");

-- CreateIndex
CREATE INDEX "AuditEvent_cinemaId_idx" ON "AuditEvent"("cinemaId");

-- CreateIndex
CREATE INDEX "BreakSession_ticketId_idx" ON "BreakSession"("ticketId");

-- CreateIndex
CREATE INDEX "BreakSession_customerId_idx" ON "BreakSession"("customerId");

-- CreateIndex
CREATE INDEX "DemonstrationTicket_claimToken_idx" ON "DemonstrationTicket"("claimToken");

-- AddForeignKey
ALTER TABLE "CinemaPricingRule" ADD CONSTRAINT "CinemaPricingRule_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorUser" ADD CONSTRAINT "OperatorUser_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningReminder" ADD CONSTRAINT "ScreeningReminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningReminder" ADD CONSTRAINT "ScreeningReminder_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "Screening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakSession" ADD CONSTRAINT "BreakSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

