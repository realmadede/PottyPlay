-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('SCHEDULED', 'PLAYING', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID_ADMITTED', 'CANCELLED_REFUNDED', 'INVALID', 'ALREADY_ACTIVATED', 'INELIGIBLE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ELIGIBLE', 'VERIFIED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'FAILED');

-- CreateTable
CREATE TABLE "Cinema" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cinema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screen" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "licenseType" TEXT NOT NULL,
    "licenseSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightsAuthorization" (
    "id" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "maxSessionDurationSeconds" INTEGER NOT NULL DEFAULT 900,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RightsAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screening" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "status" "ScreeningStatus" NOT NULL DEFAULT 'SCHEDULED',
    "playbackPositionSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastPositionUpdatedAt" TIMESTAMP(3),
    "totalPausedDurationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Screening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemonstrationTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "screeningId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID_ADMITTED',
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemonstrationTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "screeningId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "revokedReason" TEXT,
    "deviceInfo" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPositionSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreakSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "otpChallengeId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "cost" TEXT,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageBillingEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "priceTzs" INTEGER NOT NULL DEFAULT 500,
    "qualifying" BOOLEAN NOT NULL DEFAULT true,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "disclaimer" TEXT NOT NULL DEFAULT 'Simulated hackathon business assumption, not an agreed Century Cinemax rate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageBillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actor" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Screen_cinemaId_idx" ON "Screen"("cinemaId");

-- CreateIndex
CREATE INDEX "RightsAuthorization_contentAssetId_cinemaId_idx" ON "RightsAuthorization"("contentAssetId", "cinemaId");

-- CreateIndex
CREATE INDEX "Screening_cinemaId_idx" ON "Screening"("cinemaId");

-- CreateIndex
CREATE INDEX "Screening_screenId_idx" ON "Screening"("screenId");

-- CreateIndex
CREATE INDEX "Screening_contentAssetId_idx" ON "Screening"("contentAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "DemonstrationTicket_ticketNumber_key" ON "DemonstrationTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "DemonstrationTicket_screeningId_idx" ON "DemonstrationTicket"("screeningId");

-- CreateIndex
CREATE INDEX "OtpChallenge_phoneNumber_idx" ON "OtpChallenge"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BreakSession_sessionToken_key" ON "BreakSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "BreakSession_ticketId_key" ON "BreakSession"("ticketId");

-- CreateIndex
CREATE INDEX "BreakSession_screeningId_idx" ON "BreakSession"("screeningId");

-- CreateIndex
CREATE INDEX "BreakSession_sessionToken_idx" ON "BreakSession"("sessionToken");

-- CreateIndex
CREATE INDEX "BreakSession_phoneNumber_idx" ON "BreakSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "SmsDeliveryAttempt_phoneNumber_idx" ON "SmsDeliveryAttempt"("phoneNumber");

-- CreateIndex
CREATE INDEX "SmsDeliveryAttempt_otpChallengeId_idx" ON "SmsDeliveryAttempt"("otpChallengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageBillingEvent_sessionId_key" ON "UsageBillingEvent"("sessionId");

-- CreateIndex
CREATE INDEX "UsageBillingEvent_cinemaId_idx" ON "UsageBillingEvent"("cinemaId");

-- CreateIndex
CREATE INDEX "UsageBillingEvent_ticketNumber_idx" ON "UsageBillingEvent"("ticketNumber");

-- CreateIndex
CREATE INDEX "AuditEvent_sessionId_idx" ON "AuditEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Screen" ADD CONSTRAINT "Screen_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightsAuthorization" ADD CONSTRAINT "RightsAuthorization_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightsAuthorization" ADD CONSTRAINT "RightsAuthorization_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screening" ADD CONSTRAINT "Screening_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screening" ADD CONSTRAINT "Screening_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screening" ADD CONSTRAINT "Screening_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemonstrationTicket" ADD CONSTRAINT "DemonstrationTicket_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "Screening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakSession" ADD CONSTRAINT "BreakSession_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "DemonstrationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakSession" ADD CONSTRAINT "BreakSession_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "Screening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsDeliveryAttempt" ADD CONSTRAINT "SmsDeliveryAttempt_otpChallengeId_fkey" FOREIGN KEY ("otpChallengeId") REFERENCES "OtpChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageBillingEvent" ADD CONSTRAINT "UsageBillingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BreakSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageBillingEvent" ADD CONSTRAINT "UsageBillingEvent_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BreakSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
