-- AlterTable
ALTER TABLE "DemonstrationTicket" ADD COLUMN "claimToken" TEXT;

-- AlterTable
ALTER TABLE "BreakSession" ALTER COLUMN "phoneNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UsageBillingEvent" ALTER COLUMN "disclaimer" SET DEFAULT 'Simulated standard billing assumption per qualifying session';

-- CreateIndex
CREATE UNIQUE INDEX "DemonstrationTicket_claimToken_key" ON "DemonstrationTicket"("claimToken");
