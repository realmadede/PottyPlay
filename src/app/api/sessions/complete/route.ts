import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/features/sessions/session-service";
import { z } from "zod";

const completeSchema = z.object({
  sessionToken: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-session-token");
    const cookieToken = req.cookies.get("pottyplay_token")?.value;

    let bodyData: { sessionToken?: string; reason?: string } = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body may be empty if token passed in headers/cookies
    }

    const parsed = completeSchema.safeParse(bodyData);
    const bodyToken = parsed.success ? parsed.data.sessionToken : undefined;

    let token = bodyToken || customHeader || cookieToken;
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Session token is required to conclude break." },
        { status: 400 }
      );
    }

    const reason = (parsed.success && parsed.data.reason) || "Auditorium re-entry by patron";
    await SessionService.completeSession(token, reason);

    const response = NextResponse.json({
      success: true,
      message: "Break session completed. Seat entitlement released.",
    });

    response.cookies.delete("pottyplay_token");
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
