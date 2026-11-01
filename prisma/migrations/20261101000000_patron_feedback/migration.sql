-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('PLAYBACK_OUT_OF_SYNC', 'AUDIO_BUFFERING', 'VIDEO_FROZEN', 'TICKET_ISSUE', 'CINEMA_FACILITY', 'GENERAL_FEEDBACK');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "PatronFeedback" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT,
    "screeningId" TEXT,
    "ticketNumber" TEXT,
    "customerId" TEXT,
    "category" "FeedbackCategory" NOT NULL DEFAULT 'GENERAL_FEEDBACK',
    "message" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "operatorNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatronFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatronFeedback_cinemaId_idx" ON "PatronFeedback"("cinemaId");

-- CreateIndex
CREATE INDEX "PatronFeedback_screeningId_idx" ON "PatronFeedback"("screeningId");

-- CreateIndex
CREATE INDEX "PatronFeedback_customerId_idx" ON "PatronFeedback"("customerId");

-- CreateIndex
CREATE INDEX "PatronFeedback_status_idx" ON "PatronFeedback"("status");

-- CreateIndex
CREATE INDEX "PatronFeedback_createdAt_idx" ON "PatronFeedback"("createdAt");

-- AddForeignKey
ALTER TABLE "PatronFeedback" ADD CONSTRAINT "PatronFeedback_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatronFeedback" ADD CONSTRAINT "PatronFeedback_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "Screening"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatronFeedback" ADD CONSTRAINT "PatronFeedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
