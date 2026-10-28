import { NextRequest, NextResponse } from "next/server";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("pp_operator_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (token) {
      await OperatorAuthService.logout(token);
    }

    const response = NextResponse.json({ success: true, message: "Logged out." });
    response.cookies.delete("pp_operator_token");
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Logout error" }, { status: 500 });
  }
}
