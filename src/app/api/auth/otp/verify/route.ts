import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OtpService } from "@/features/messaging/otp-service";

const verifyOtpSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain digits only"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid code format.",
        },
        { status: 400 }
      );
    }

    const result = await OtpService.verifyOtp(
      parsed.data.challengeId,
      parsed.data.code
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 401,
    });
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
