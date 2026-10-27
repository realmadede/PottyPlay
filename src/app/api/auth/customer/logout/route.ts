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

    if (token) {
      await CustomerAuthService.logout(token);
    }

    const res = NextResponse.json({ success: true, message: "Logged out successfully" });
    res.cookies.delete("pp_cust_token");
    return res;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
