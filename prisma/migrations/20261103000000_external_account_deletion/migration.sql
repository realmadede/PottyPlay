ALTER TABLE "CustomerAccount"
ADD COLUMN "deletionConfirmationTokenHash" TEXT,
ADD COLUMN "deletionConfirmationExpiresAt" TIMESTAMP(3),
ADD COLUMN "deletionConfirmationRequestedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CustomerAccount_deletionConfirmationTokenHash_key"
ON "CustomerAccount"("deletionConfirmationTokenHash");
