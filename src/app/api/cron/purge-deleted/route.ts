import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const providedAuth =
      req.headers.get("x-cron-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    // Secure authorization check
    if (cronSecret && providedAuth !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized cron execution." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const gracePeriodParam = searchParams.get("gracePeriodDays");
    const gracePeriodDays = gracePeriodParam ? parseInt(gracePeriodParam, 10) : 30;

    const result = await CustomerAuthService.purgeExpiredDeletionRequests(gracePeriodDays);

    return NextResponse.json({
      success: true,
      message: `Successfully executed automated account deletion purge under PDPA 2022.`,
      purgedCount: result.purgedCount,
      accountIds: result.accountIds,
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
