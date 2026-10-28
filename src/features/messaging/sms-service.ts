import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { ISmsProvider, SendSmsResult } from "./types";
import { AfricasTalkingSmsAdapter } from "./africas-talking-adapter";
import { DevSimulatorSmsAdapter } from "./dev-simulator-adapter";

class SmsService {
  private provider: ISmsProvider;

  constructor() {
    if (config.africasTalking.isSimulatorMode) {
      this.provider = new DevSimulatorSmsAdapter();
    } else {
      this.provider = new AfricasTalkingSmsAdapter();
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  isSimulator(): boolean {
    return this.provider.name === "DEV_SIMULATOR";
  }

  async sendOtp(
    phoneNumber: string,
    code: string,
    otpChallengeId: string
  ): Promise<SendSmsResult> {
    const message = `Your PottyPlay break verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;

    const result = await this.provider.sendSms({
      to: phoneNumber,
      message,
      messageType: "OTP_VERIFICATION",
      otpChallengeId,
    });

    // Record delivery attempt in database
    await prisma.smsDeliveryAttempt.create({
      data: {
        otpChallengeId,
        phoneNumber,
        messageType: "OTP_VERIFICATION",
        messageBody: `Verification code sent to customer (masked for privacy)`,
        provider: result.provider,
        status: result.status,
        providerMessageId: result.providerMessageId || null,
        cost: result.cost || null,
        errorDetails: result.errorDetails || null,
      },
    });

    return result;
  }

  async sendSessionConfirmation(
    phoneNumber: string,
    seatNumber: string,
    expiresAt: Date
  ): Promise<SendSmsResult> {
    const timeStr = expiresAt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Dar_es_Salaam",
    });
    const message = `PottyPlay: Your break stream is active for Seat ${seatNumber}. Session ends at ${timeStr}. Enjoy your break!`;

    const result = await this.provider.sendSms({
      to: phoneNumber,
      message,
      messageType: "SESSION_CONFIRMATION",
    });

    await prisma.smsDeliveryAttempt.create({
      data: {
        phoneNumber,
        messageType: "SESSION_CONFIRMATION",
        messageBody: `Session confirmation sent for seat ${seatNumber}`,
        provider: result.provider,
        status: result.status,
        providerMessageId: result.providerMessageId || null,
        cost: result.cost || null,
        errorDetails: result.errorDetails || null,
      },
    });

    return result;
  }

  async sendSessionReminder(
    phoneNumber: string,
    minutesRemaining: number
  ): Promise<SendSmsResult> {
    const message = `PottyPlay Reminder: Your companion viewing break ends in ${minutesRemaining} minute(s). Please return to your auditorium.`;

    const result = await this.provider.sendSms({
      to: phoneNumber,
      message,
      messageType: "SESSION_REMINDER",
    });

    await prisma.smsDeliveryAttempt.create({
      data: {
        phoneNumber,
        messageType: "SESSION_REMINDER",
        messageBody: `Reminder sent: ${minutesRemaining} minutes remaining`,
        provider: result.provider,
        status: result.status,
        providerMessageId: result.providerMessageId || null,
        cost: result.cost || null,
        errorDetails: result.errorDetails || null,
      },
    });

    return result;
  }

  async sendScreeningUpcomingReminder(
    phoneNumber: string,
    screeningTitle: string,
    minutesRemaining: number,
    cinemaName: string
  ): Promise<SendSmsResult> {
    const message = `PottyPlay Reminder: Screening "${screeningTitle}" at ${cinemaName} begins in ${minutesRemaining} minute(s). Get your seat ready!`;

    const result = await this.provider.sendSms({
      to: phoneNumber,
      message,
      messageType: "SCREENING_REMINDER",
    });

    await prisma.smsDeliveryAttempt.create({
      data: {
        phoneNumber,
        messageType: "SCREENING_REMINDER",
        messageBody: `Screening reminder sent for ${screeningTitle} (${minutesRemaining}m)`,
        provider: result.provider,
        status: result.status,
        providerMessageId: result.providerMessageId || null,
        cost: result.cost || null,
        errorDetails: result.errorDetails || null,
      },
    });

    return result;
  }
}

export const smsService = new SmsService();
