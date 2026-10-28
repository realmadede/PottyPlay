import { NextRequest, NextResponse } from "next/server";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("pp_operator_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await OperatorAuthService.verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session expired or invalid" }, { status: 401 });
    }

    return NextResponse.json({ success: true, operator: session });
  } catch {
    return NextResponse.json({ success: false, error: "Session verification error" }, { status: 500 });
  }
}
