import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.trim().length < 32) {
      console.error("[CRON-PURGE-DELETED] CRON_SECRET is missing or too short.");
      return NextResponse.json(
        { success: false, error: "Scheduled deletion is not configured." },
        { status: 503 }
      );
    }

    const providedAuth =
      req.headers.get("x-cron-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!providedAuth || providedAuth !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized cron execution." },
        { status: 401 }
      );
    }

    const gracePeriodDays = 30;
    const result = await CustomerAuthService.purgeExpiredDeletionRequests(gracePeriodDays);

    return NextResponse.json({
      success: true,
      message: "Expired account deletion requests were processed.",
      purgedCount: result.purgedCount,
      gracePeriodDays,
      executedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON-PURGE-DELETED-ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to purge deleted accounts." },
      { status: 500 }
    );
  }
}
