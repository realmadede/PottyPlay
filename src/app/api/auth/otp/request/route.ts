import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OtpService } from "@/features/messaging/otp-service";

const requestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(8, "Phone number is too short")
    .max(20, "Phone number is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid phone number input.",
        },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const result = await OtpService.requestOtp(
      parsed.data.phoneNumber,
      ipAddress
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
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
