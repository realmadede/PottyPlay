import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionService } from "@/features/sessions/session-service";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";

const revokeSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().min(3, "Revocation reason is required"),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("pp_operator_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized operator access. Valid session token required." },
        { status: 401 }
      );
    }

    const isOperator = await OperatorAuthService.verifySession(token);
    const isAdmin = token.startsWith("adm_");

    if (!isOperator && !isAdmin) {
      return NextResponse.json(
        { error: "Invalid or expired operator authorization." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = revokeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    await SessionService.revokeSession(
      parsed.data.sessionId,
      parsed.data.reason
    );

    return NextResponse.json({ success: true, message: "Session revoked successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
