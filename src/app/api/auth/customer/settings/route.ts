import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    const cookieToken = req.cookies.get("pp_cust_token")?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await CustomerAuthService.validateSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session invalid or expired" }, { status: 401 });
    }

    const body = await req.json();

    // Action 1: Theme update
    if (body.action === "theme") {
      const { theme } = body;
      if (!["LIGHT", "DARK", "SYSTEM"].includes(theme)) {
        return NextResponse.json({ success: false, error: "Invalid theme" }, { status: 400 });
      }
      await CustomerAuthService.updateTheme(session.customerId, theme);
      return NextResponse.json({ success: true, theme });
    }

    // Action 2: Deletion request
    if (body.action === "delete_account") {
      await CustomerAuthService.requestDeletion(session.customerId);
      const res = NextResponse.json({
        success: true,
        message: "Account deletion request submitted. Session revoked.",
      });
      res.cookies.delete("pp_cust_token");
      return res;
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Customer settings error:", error);
    return NextResponse.json({ success: false, error: "Settings update failed" }, { status: 500 });
  }
}
