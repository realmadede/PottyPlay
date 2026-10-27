import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { generateOtpCode, hashOtp, verifyOtpHash } from "@/lib/crypto";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { smsService } from "./sms-service";

export interface RequestOtpResult {
  success: boolean;
  challengeId?: string;
  phoneNumber?: string;
  expiresInSeconds?: number;
  simulatedCode?: string; // Provided only when running under development simulator
  error?: string;
  isSimulator: boolean;
}

export interface VerifyOtpResult {
  success: boolean;
  phoneNumber?: string;
  challengeId?: string;
  error?: string;
  attemptsRemaining?: number;
}

export class OtpService {
  /**
   * Creates a new OTP challenge and dispatches SMS via Africa's Talking or Simulator.
   */
  static async requestOtp(
    rawPhoneNumber: string,
    ipAddress?: string
  ): Promise<RequestOtpResult> {
    const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
    if (!isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format. Please provide a valid Tanzanian (+255...) or international number.",
        isSimulator: smsService.isSimulator(),
      };
    }

    const now = new Date();
    // Rate limit: Max 5 requests in last 10 minutes for this phone number
    const recentChallenges = await prisma.otpChallenge.count({
      where: {
        phoneNumber,
        createdAt: {
          gte: new Date(now.getTime() - 10 * 60 * 1000),
        },
      },
    });

    if (recentChallenges >= 5) {
      return {
        success: false,
        error: "Rate limit exceeded. Please wait a few minutes before requesting another verification code.",
        isSimulator: smsService.isSimulator(),
      };
    }

    const plainCode = generateOtpCode();
    const codeHash = hashOtp(plainCode);
    const expiresAt = new Date(now.getTime() + config.otpExpirySeconds * 1000);

    const challenge = await prisma.otpChallenge.create({
      data: {
        phoneNumber,
        codeHash,
        attempts: 0,
        maxAttempts: config.otpMaxAttempts,
        expiresAt,
        ipAddress: ipAddress || null,
      },
    });

    // Send SMS via Africa's Talking adapter
    const smsResult = await smsService.sendOtp(phoneNumber, plainCode, challenge.id);

    if (!smsResult.success) {
      return {
        success: false,
        error: smsResult.errorDetails || "Failed to deliver SMS verification code.",
        isSimulator: smsService.isSimulator(),
      };
    }

    // Audit event
    await prisma.auditEvent.create({
      data: {
        eventType: "OTP_REQUESTED",
        entityType: "OTP_CHALLENGE",
        entityId: challenge.id,
        actor: "CUSTOMER",
        details: JSON.stringify({
          phoneNumber,
          provider: smsResult.provider,
          ip: ipAddress || "unknown",
        }),
      },
    });

    return {
      success: true,
      challengeId: challenge.id,
      phoneNumber,
      expiresInSeconds: config.otpExpirySeconds,
      simulatedCode: smsResult.simulatedCode,
      isSimulator: smsService.isSimulator(),
    };
  }

  /**
   * Verifies the OTP code submitted by the user.
   */
  static async verifyOtp(
    challengeId: string,
    candidateCode: string
  ): Promise<VerifyOtpResult> {
    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return {
        success: false,
        error: "Verification challenge not found or expired. Please request a new code.",
      };
    }

    if (challenge.isUsed) {
      return {
        success: false,
        error: "This verification code has already been used. Please request a new code.",
      };
    }

    const now = new Date();
    if (challenge.expiresAt < now) {
      return {
        success: false,
        error: "This verification code has expired. Please request a new code.",
      };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      return {
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code.",
        attemptsRemaining: 0,
      };
    }

    // Increment attempts
    const updatedChallenge = await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        attempts: { increment: 1 },
      },
    });

    const isMatch = verifyOtpHash(candidateCode, challenge.codeHash);

    if (!isMatch) {
      const remaining = Math.max(0, updatedChallenge.maxAttempts - updatedChallenge.attempts);
      return {
        success: false,
        error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      };
    }

    // Mark as verified and used
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        isUsed: true,
        verifiedAt: now,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "OTP_VERIFIED",
        entityType: "OTP_CHALLENGE",
        entityId: challengeId,
        actor: "CUSTOMER",
        details: JSON.stringify({
          phoneNumber: challenge.phoneNumber,
        }),
      },
    });

    return {
      success: true,
      phoneNumber: challenge.phoneNumber,
      challengeId: challenge.id,
    };
  }
}
