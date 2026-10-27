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
  africasTalking: {
    isSimulatorMode:
      process.env.AT_SIMULATOR_MODE === "true" || !process.env.AT_API_KEY,
    apiKey: process.env.AT_API_KEY || "",
    username: process.env.AT_USERNAME || "sandbox",
    senderId: process.env.AT_SENDER_ID || "",
    baseUrl:
      (process.env.AT_USERNAME || "sandbox") === "sandbox"
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging",
  },
};
