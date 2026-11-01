-- AlterTable Cinema: In-Auditorium Local Edge Streaming & Venue Wi-Fi configuration
ALTER TABLE "Cinema" ADD COLUMN IF NOT EXISTS "edgeStreamingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Cinema" ADD COLUMN IF NOT EXISTS "edgeServerUrl" TEXT;
ALTER TABLE "Cinema" ADD COLUMN IF NOT EXISTS "venueWifiSsid" TEXT;
ALTER TABLE "Cinema" ADD COLUMN IF NOT EXISTS "lanIpSubnets" TEXT;

-- AlterTable ContentAsset: Relative path for on-prem edge micro-cache
ALTER TABLE "ContentAsset" ADD COLUMN IF NOT EXISTS "edgeRelativePath" TEXT;

-- AlterTable OperatorUser: Zero-trust SHA-256 session token hashing at rest
ALTER TABLE "OperatorUser" ADD COLUMN IF NOT EXISTS "sessionTokenHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "OperatorUser_sessionTokenHash_key" ON "OperatorUser"("sessionTokenHash");
CREATE INDEX IF NOT EXISTS "OperatorUser_sessionTokenHash_idx" ON "OperatorUser"("sessionTokenHash");

-- AlterTable BreakSession: Zero-trust SHA-256 session token hashing at rest
ALTER TABLE "BreakSession" ADD COLUMN IF NOT EXISTS "sessionTokenHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "BreakSession_sessionTokenHash_key" ON "BreakSession"("sessionTokenHash");
CREATE INDEX IF NOT EXISTS "BreakSession_sessionTokenHash_idx" ON "BreakSession"("sessionTokenHash");
