const isProd = process.env.NODE_ENV === "production";

function getSecret(envKey: string, fallbackDev: string): string {
  const val = process.env[envKey];
  if (val && val.trim().length >= 8) {
    return val.trim();
  }
  if (isProd) {
    // In production runtime, throw when a secret is accessed but unconfigured
    throw new Error(
      `[CONFIG-SECURITY-ERROR] Mandatory environment variable ${envKey} must be configured in production.`
    );
  }
  return fallbackDev;
}

export const config = {
  appName: "PottyPlay",
  env: process.env.NODE_ENV || "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  maxSessionDurationSeconds: parseInt(
    process.env.MAX_SESSION_DURATION_SECONDS || "900",
    10
  ),
  otpExpirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || "300", 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || "3", 10),
  demoPricePerSessionTzs: parseInt(
    process.env.DEMO_PRICE_PER_SESSION_TZS || "500",
    10
  ),
  deductionPercentDefault: parseFloat(
    process.env.DEDUCTION_PERCENT || "15.0"
  ),
  africasTalking: {
    // In production, simulator mode is strictly disallowed
    isSimulatorMode: isProd
      ? false
      : process.env.AT_SIMULATOR_MODE === "true" || !process.env.AT_API_KEY,
    apiKey: process.env.AT_API_KEY || "",
    username: process.env.AT_USERNAME || "sandbox",
    senderId: process.env.AT_SENDER_ID || "",
    baseUrl:
      (process.env.AT_USERNAME || "sandbox") === "sandbox"
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.EMAIL_FROM || "PottyPlay <onboarding@resend.dev>",
  },
  get posWebhookSecret(): string {
    return getSecret("POS_WEBHOOK_SECRET", "pottyplay_pos_webhook_dev_secret");
  },
  get adminSessionSecret(): string {
    return getSecret("ADMIN_SESSION_SECRET", "pottyplay_admin_dev_secret_insecure");
  },
  get cronSecret(): string | undefined {
    return process.env.CRON_SECRET || (isProd ? undefined : "pottyplay_dev_cron_secret");
  },
};
