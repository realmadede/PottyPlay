import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionService } from "@/features/sessions/session-service";

const activateSchema = z
  .object({
    ticketNumber: z.string().min(3).optional(),
    claimToken: z.string().min(3).optional(),
    identifier: z.string().min(3).optional(),
    challengeId: z.string().optional(),
    phoneNumber: z.string().optional(),
    deviceInfo: z.string().optional(),
  })
  .refine((data) => data.ticketNumber || data.claimToken || data.identifier, {
    message: "Ticket number or claim token is required",
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid activation parameters.",
        },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const deviceInfo = parsed.data.deviceInfo || userAgent;
    const identifier =
      parsed.data.identifier ||
      parsed.data.claimToken ||
      parsed.data.ticketNumber;

    const result = await SessionService.activateSession({
      ticketNumber: identifier,
      claimToken: parsed.data.claimToken,
      challengeId: parsed.data.challengeId,
      phoneNumber: parsed.data.phoneNumber,
      deviceInfo,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    const response = NextResponse.json(result, { status: 200 });

    // Set secure HTTP-only cookie for session token
    if (result.sessionToken) {
      response.cookies.set("pottyplay_token", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: result.durationSeconds || 900,
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
