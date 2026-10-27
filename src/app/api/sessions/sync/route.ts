import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/features/sessions/session-service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-session-token");
    const cookieToken = req.cookies.get("pottyplay_token")?.value;
    const searchToken = req.nextUrl.searchParams.get("token");

    let token = customHeader || cookieToken || searchToken;
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        {
          isValid: false,
          remainingSeconds: 0,
          reason: "Missing session authorization token.",
        },
        { status: 401 }
      );
    }

    const result = await SessionService.getSessionState(token);

    return NextResponse.json(result, {
      status: result.isValid ? 200 : 403,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        isValid: false,
        remainingSeconds: 0,
        reason: message,
      },
      { status: 500 }
    );
  }
}
