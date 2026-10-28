export type SmsProviderType = "AFRICAS_TALKING" | "DEV_SIMULATOR";

export interface SendSmsRequest {
  to: string;
  message: string;
  messageType:
    | "OTP_VERIFICATION"
    | "SESSION_CONFIRMATION"
    | "SESSION_REMINDER"
    | "SCREENING_REMINDER";
  otpChallengeId?: string;
}

export interface SendSmsResult {
  success: boolean;
  provider: SmsProviderType;
  providerMessageId?: string;
  cost?: string;
  status: "SENT" | "DELIVERED" | "FAILED" | "QUEUED";
  errorDetails?: string;
  simulatedCode?: string; // Only returned in dev simulator mode for seamless testing
}

export interface ISmsProvider {
  name: SmsProviderType;
  sendSms(request: SendSmsRequest): Promise<SendSmsResult>;
}
