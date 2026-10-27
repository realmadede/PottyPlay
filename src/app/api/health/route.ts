import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "unhealthy";
    console.error("Health check database failure:", error);
  }

  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "pass" : "fail",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      service: "PottyPlay Cinema Companion",
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        messaging: {
          mode: config.africasTalking.isSimulatorMode ? "simulator" : "production",
          provider: config.africasTalking.isSimulatorMode
            ? "Development SMS Simulator"
            : "Africa's Talking SMS",
          configured: !config.africasTalking.isSimulatorMode || true,
        },
      },
      durationMs: Date.now() - startTime,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
