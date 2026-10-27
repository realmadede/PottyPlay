import { prisma } from "@/lib/db";
import { generateSessionToken, hashPassword, verifyPassword } from "@/lib/crypto";
import { OtpService } from "@/features/messaging/otp-service";
import { normalizePhoneNumber, isValidPhoneNumber } from "@/lib/phone";
import { AuthProvider } from "@prisma/client";

export interface CustomerAuthSession {
  customerId: string;
  name: string | null;
  phoneNumber: string | null;
  email: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingDone: boolean;
  authProvider: AuthProvider;
  sessionToken: string;
  tokenExpiresAt: Date;
}

export class CustomerAuthService {
  /**
   * Session validity duration: 30 days of persistent login.
   */
  static readonly SESSION_DURATION_DAYS = 30;

  /**
   * Generates expiration date for customer persistent login.
   */
  private static getSessionExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);
    return expiresAt;
  }

  /**
   * Verifies an OTP code and either logs in existing customer or creates a new one.
   */
  static async authenticateWithPhone(
    rawPhone: string,
    code: string,
    name?: string
  ): Promise<{ success: boolean; session?: CustomerAuthSession; error?: string }> {
    if (!isValidPhoneNumber(rawPhone)) {
      return { success: false, error: "Please enter a valid phone number." };
    }
    const phone = normalizePhoneNumber(rawPhone);

    // Verify OTP against OtpChallenge
    const latestChallenge = await prisma.otpChallenge.findFirst({
      where: {
        phoneNumber: phone,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestChallenge) {
      return { success: false, error: "No active verification challenge found. Please request a new code." };
    }

    const verifyResult = await OtpService.verifyOtp(latestChallenge.id, code);
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || "Invalid verification code." };
    }

    const sessionToken = generateSessionToken("cust_");
    const tokenExpiresAt = this.getSessionExpiry();

    // Find or create customer account
    let customer = await prisma.customerAccount.findUnique({
      where: { phoneNumber: phone },
    });

    if (customer) {
      customer = await prisma.customerAccount.update({
        where: { id: customer.id },
        data: {
          phoneVerified: true,
          sessionToken,
          tokenExpiresAt,
          name: name ? name.trim() : customer.name,
        },
      });
    } else {
      customer = await prisma.customerAccount.create({
        data: {
          phoneNumber: phone,
          phoneVerified: true,
          name: name?.trim() || null,
          authProvider: AuthProvider.PHONE,
          sessionToken,
          tokenExpiresAt,
          onboardingDone: false,
        },
      });
    }

    return {
      success: true,
      session: {
        customerId: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        phoneVerified: customer.phoneVerified,
        emailVerified: customer.emailVerified,
        onboardingDone: customer.onboardingDone,
        authProvider: customer.authProvider,
        sessionToken: customer.sessionToken!,
        tokenExpiresAt: customer.tokenExpiresAt!,
      },
    };
  }

  /**
   * Registers a customer account with email and password.
   * Note: Phone verification is still required before viewing features are authorized.
   */
  static async registerWithEmail(
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; session?: CustomerAuthSession; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    const existing = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const sessionToken = generateSessionToken("cust_");
    const tokenExpiresAt = this.getSessionExpiry();
    const passwordHash = hashPassword(password);

    const customer = await prisma.customerAccount.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: name.trim(),
        emailVerified: true, // Auto-verified for standard setup; phone verification remains mandatory
        phoneVerified: false,
        authProvider: AuthProvider.EMAIL,
        sessionToken,
        tokenExpiresAt,
        onboardingDone: false,
      },
    });

    return {
      success: true,
      session: {
        customerId: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        phoneVerified: customer.phoneVerified,
        emailVerified: customer.emailVerified,
        onboardingDone: customer.onboardingDone,
        authProvider: customer.authProvider,
        sessionToken: customer.sessionToken!,
        tokenExpiresAt: customer.tokenExpiresAt!,
      },
    };
  }

  /**
   * Authenticates with email and password.
   */
  static async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; session?: CustomerAuthSession; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const customer = await prisma.customerAccount.findUnique({
      where: { email: cleanEmail },
    });

    if (!customer || !customer.passwordHash) {
      return { success: false, error: "Invalid email or password." };
    }

    const isValid = verifyPassword(password, customer.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    const sessionToken = generateSessionToken("cust_");
    const tokenExpiresAt = this.getSessionExpiry();

    const updated = await prisma.customerAccount.update({
      where: { id: customer.id },
      data: {
        sessionToken,
        tokenExpiresAt,
      },
    });

    return {
      success: true,
      session: {
        customerId: updated.id,
        name: updated.name,
        phoneNumber: updated.phoneNumber,
        email: updated.email,
        phoneVerified: updated.phoneVerified,
        emailVerified: updated.emailVerified,
        onboardingDone: updated.onboardingDone,
        authProvider: updated.authProvider,
        sessionToken: updated.sessionToken!,
        tokenExpiresAt: updated.tokenExpiresAt!,
      },
    };
  }

  /**
   * Binds and verifies a phone number for an existing authenticated account.
   */
  static async verifyCustomerPhone(
    customerId: string,
    rawPhone: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isValidPhoneNumber(rawPhone)) {
      return { success: false, error: "Please enter a valid phone number." };
    }
    const phone = normalizePhoneNumber(rawPhone);

    const latestChallenge = await prisma.otpChallenge.findFirst({
      where: {
        phoneNumber: phone,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestChallenge) {
      return { success: false, error: "No active verification challenge found." };
    }

    const verifyResult = await OtpService.verifyOtp(latestChallenge.id, code);
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || "Invalid code." };
    }

    await prisma.customerAccount.update({
      where: { id: customerId },
      data: {
        phoneNumber: phone,
        phoneVerified: true,
      },
    });

    return { success: true };
  }

  /**
   * Validates a persistent session token.
   */
  static async validateSession(
    token: string
  ): Promise<CustomerAuthSession | null> {
    if (!token || !token.startsWith("cust_")) return null;

    const customer = await prisma.customerAccount.findUnique({
      where: { sessionToken: token },
    });

    if (!customer || !customer.tokenExpiresAt) return null;

    if (new Date(customer.tokenExpiresAt).getTime() < Date.now()) {
      return null;
    }

    return {
      customerId: customer.id,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      phoneVerified: customer.phoneVerified,
      emailVerified: customer.emailVerified,
      onboardingDone: customer.onboardingDone,
      authProvider: customer.authProvider,
      sessionToken: customer.sessionToken!,
      tokenExpiresAt: customer.tokenExpiresAt,
    };
  }

  /**
   * Marks onboarding sequence complete for customer.
   */
  static async markOnboardingDone(customerId: string): Promise<boolean> {
    await prisma.customerAccount.update({
      where: { id: customerId },
      data: { onboardingDone: true },
    });
    return true;
  }

  /**
   * Revokes customer session token upon logout.
   */
  static async logout(token: string): Promise<void> {
    if (!token) return;
    await prisma.customerAccount.updateMany({
      where: { sessionToken: token },
      data: { sessionToken: null, tokenExpiresAt: null },
    });
  }
}
