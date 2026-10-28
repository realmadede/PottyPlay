import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";
import { OtpService } from "@/features/messaging/otp-service";
import { prisma } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phone";
import { z } from "zod";

const requestPhoneSchema = z.object({
  phoneNumber: z.string().min(8, "Phone number is required"),
});

const verifyPhoneSchema = z.object({
  phoneNumber: z.string().min(8, "Phone number is required"),
  code: z.string().length(6, "6-digit code is required"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode 1: Request verification OTP
    if (body.action === "request") {
      const { phoneNumber } = requestPhoneSchema.parse(body);
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const result = await OtpService.requestOtp(phoneNumber, ip);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code dispatched via SMS.",
        challengeId: result.challengeId,
        // In simulation mode, return simulated code for non-production convenience
        simulatedCode: result.simulatedCode,
      });
    }

    // Mode 2: Verify code and login / register
    const { phoneNumber, code } = verifyPhoneSchema.parse(body);
    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        phoneNumber: normalizePhoneNumber(phoneNumber),
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "No active verification challenge found." },
        { status: 400 }
      );
    }

    const verifyResult = await OtpService.verifyOtp(challenge.id, code);
    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || "Invalid code." },
        { status: 400 }
      );
    }

    const customer = await prisma.customerAccount.findUnique({
      where: { phoneNumber: normalizePhoneNumber(phoneNumber) },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "No account registered for this phone number. Please complete registration.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Phone verification successful.",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    console.error("Phone auth error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
