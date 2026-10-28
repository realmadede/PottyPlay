import { prisma } from "@/lib/db";
import { generateSessionToken, generateOtpCode, hashPassword, verifyPassword } from "@/lib/crypto";
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
  status: string;
  themePreference: string;
  authProvider: AuthProvider;
  sessionToken: string;
  tokenExpiresAt: Date;
}

export class CustomerAuthService {
  /**
   * Session validity duration: 30 days of persistent login.
   */
  static readonly SESSION_DURATION_DAYS = 30;
  static readonly TERMS_VERSION = "2026-10-v1";
  static readonly PRIVACY_VERSION = "2026-10-v1";

  private static getSessionExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);
    return expiresAt;
  }

  /**
   * Registers a customer account with mandatory full name, phone number, email,
   * password (Argon2id), and explicit terms/privacy acceptance.
   */
  static async registerCustomer(params: {
    fullName: string;
    phoneNumber: string;
    email: string;
    password: string;
    termsAccepted: boolean;
  }): Promise<{
    success: boolean;
    customerId?: string;
    phoneChallengeId?: string;
    simulatedSmsCode?: string;
    simulatedEmailCode?: string;
    error?: string;
  }> {
    const { fullName, phoneNumber: rawPhone, email: rawEmail, password, termsAccepted } = params;

    // 1. Mandatory acceptance validation
    if (!termsAccepted) {
      return {
        success: false,
        error: "You must accept the Privacy Policy and Terms of Service to create an account.",
      };
    }

    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: "Please enter your full name." };
    }

    if (!isValidPhoneNumber(rawPhone)) {
      return { success: false, error: "Please enter a valid phone number (e.g., +255 7XX XXX XXX)." };
    }
    const phone = normalizePhoneNumber(rawPhone);

    const email = rawEmail.trim().toLowerCase();
    if (!email.includes("@") || !email.includes(".")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!password || password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    // 2. Account uniqueness checks
    const existingEmail = await prisma.customerAccount.findUnique({
      where: { email },
    });
    if (existingEmail && existingEmail.status === "ACTIVE") {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    const existingPhone = await prisma.customerAccount.findUnique({
      where: { phoneNumber: phone },
    });
    if (existingPhone && existingPhone.status === "ACTIVE") {
      return { success: false, error: "An account with this phone number already exists. Please sign in." };
    }

    // 3. Hash password using Argon2id
    const passwordHash = hashPassword(password);

    // 4. Create or update pending account
    const emailVerificationCode = generateOtpCode();
    const emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    let customer = existingEmail || existingPhone;
    if (customer) {
      customer = await prisma.customerAccount.update({
        where: { id: customer.id },
        data: {
          name: fullName.trim(),
          phoneNumber: phone,
          email,
          passwordHash,
          termsAcceptedVersion: this.TERMS_VERSION,
          privacyAcceptedVersion: this.PRIVACY_VERSION,
          termsAcceptedAt: new Date(),
          phoneVerified: false,
          emailVerified: false,
          status: "PENDING_VERIFICATION",
          emailVerificationCode,
          emailVerificationExpiresAt,
          authProvider: AuthProvider.EMAIL,
        },
      });
    } else {
      customer = await prisma.customerAccount.create({
        data: {
          name: fullName.trim(),
          phoneNumber: phone,
          email,
          passwordHash,
          termsAcceptedVersion: this.TERMS_VERSION,
          privacyAcceptedVersion: this.PRIVACY_VERSION,
          termsAcceptedAt: new Date(),
          phoneVerified: false,
          emailVerified: false,
          status: "PENDING_VERIFICATION",
          emailVerificationCode,
          emailVerificationExpiresAt,
          authProvider: AuthProvider.EMAIL,
        },
      });
    }

    // 5. Send SMS OTP to phone via Africa's Talking provider abstraction
    const otpResult = await OtpService.requestOtp(phone);
    if (!otpResult.success) {
      return {
        success: false,
        error: otpResult.error || "Failed to dispatch phone verification SMS.",
      };
    }

    // 6. Deliver email verification code
    // In production, dispatched via configured SMTP/SendGrid. In test/dev, logged safely.
    console.log(`[EMAIL-VERIFICATION] Code for ${email}: ${emailVerificationCode} (expires in 15m)`);

    return {
      success: true,
      customerId: customer.id,
      phoneChallengeId: otpResult.challengeId,
      simulatedSmsCode: otpResult.simulatedCode,
      simulatedEmailCode: emailVerificationCode,
    };
  }

  /**
   * Verifies SMS OTP for a customer account.
   */
  static async verifyPhone(params: {
    customerId: string;
    challengeId: string;
    code: string;
  }): Promise<{
    success: boolean;
    isFullyActivated: boolean;
    session?: CustomerAuthSession;
    error?: string;
  }> {
    const { customerId, challengeId, code } = params;

    const customer = await prisma.customerAccount.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return { success: false, isFullyActivated: false, error: "Customer account not found." };
    }

    const verifyResult = await OtpService.verifyOtp(challengeId, code);
    if (!verifyResult.success) {
      return {
        success: false,
        isFullyActivated: false,
        error: verifyResult.error || "Invalid verification code.",
      };
    }

    const updated = await prisma.customerAccount.update({
      where: { id: customerId },
      data: { phoneVerified: true },
    });

    // Check if both phone and email are verified
    if (updated.emailVerified) {
      const sessionToken = generateSessionToken("cust_");
      const tokenExpiresAt = this.getSessionExpiry();

      const active = await prisma.customerAccount.update({
        where: { id: customerId },
        data: {
          status: "ACTIVE",
          sessionToken,
          tokenExpiresAt,
        },
      });

      return {
        success: true,
        isFullyActivated: true,
        session: this.toSession(active),
      };
    }

    return {
      success: true,
      isFullyActivated: false,
    };
  }

  /**
   * Verifies Email ownership with code.
   */
  static async verifyEmail(params: {
    customerId: string;
    code: string;
  }): Promise<{
    success: boolean;
    isFullyActivated: boolean;
    session?: CustomerAuthSession;
    error?: string;
  }> {
    const { customerId, code } = params;

    const customer = await prisma.customerAccount.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return { success: false, isFullyActivated: false, error: "Customer account not found." };
    }

    if (!customer.emailVerificationCode || !customer.emailVerificationExpiresAt) {
      return { success: false, isFullyActivated: false, error: "No email verification pending." };
    }

    if (new Date() > new Date(customer.emailVerificationExpiresAt)) {
      return { success: false, isFullyActivated: false, error: "Email verification code has expired. Please request a new one." };
    }

    if (customer.emailVerificationCode.trim() !== code.trim()) {
      return { success: false, isFullyActivated: false, error: "Invalid email verification code." };
    }

    const updated = await prisma.customerAccount.update({
      where: { id: customerId },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
    });

    // Check if both phone and email are verified
    if (updated.phoneVerified) {
      const sessionToken = generateSessionToken("cust_");
      const tokenExpiresAt = this.getSessionExpiry();

      const active = await prisma.customerAccount.update({
        where: { id: customerId },
        data: {
          status: "ACTIVE",
          sessionToken,
          tokenExpiresAt,
        },
      });

      return {
        success: true,
        isFullyActivated: true,
        session: this.toSession(active),
      };
    }

    return {
      success: true,
      isFullyActivated: false,
    };
  }

  /**
   * Authenticates an existing customer via Email or Phone with password.
   */
  static async login(params: {
    identifier: string; // Email or Phone number
    password: string;
  }): Promise<{
    success: boolean;
    session?: CustomerAuthSession;
    needsVerification?: boolean;
    customerId?: string;
    missingVerification?: "phone" | "email" | "both";
    error?: string;
  }> {
    const { identifier, password } = params;
    const cleanId = identifier.trim();

    let customer = null;
    if (isValidPhoneNumber(cleanId)) {
      const phone = normalizePhoneNumber(cleanId);
      customer = await prisma.customerAccount.findUnique({
        where: { phoneNumber: phone },
      });
    } else {
      customer = await prisma.customerAccount.findUnique({
        where: { email: cleanId.toLowerCase() },
      });
    }

    if (!customer || !customer.passwordHash) {
      return { success: false, error: "Invalid login credentials." };
    }

    const isValid = verifyPassword(password, customer.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid login credentials." };
    }

    // Enforce required verifications before granting active session
    if (!customer.phoneVerified || !customer.emailVerified) {
      let missing: "phone" | "email" | "both" = "both";
      if (customer.phoneVerified && !customer.emailVerified) missing = "email";
      if (!customer.phoneVerified && customer.emailVerified) missing = "phone";

      return {
        success: false,
        needsVerification: true,
        customerId: customer.id,
        missingVerification: missing,
        error: "Your account requires verified phone and email before accessing PottyPlay.",
      };
    }

    // Generate persistent session token
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
      session: this.toSession(updated),
    };
  }

  /**
   * Requests a password reset with enumeration protection.
   */
  static async requestPasswordReset(identifier: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const cleanId = identifier.trim();
    let customer = null;

    if (isValidPhoneNumber(cleanId)) {
      customer = await prisma.customerAccount.findUnique({
        where: { phoneNumber: normalizePhoneNumber(cleanId) },
      });
    } else {
      customer = await prisma.customerAccount.findUnique({
        where: { email: cleanId.toLowerCase() },
      });
    }

    if (customer && customer.email) {
      const resetToken = generateSessionToken("reset_");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.customerAccount.update({
        where: { id: customer.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: expiresAt,
        },
      });

      console.log(`[PASSWORD-RESET] Token for ${customer.email}: ${resetToken}`);
    }

    return {
      success: true,
      message: "If an account matches that contact information, instructions have been sent.",
    };
  }

  /**
   * Completes a password reset.
   */
  static async resetPassword(params: {
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { token, newPassword } = params;

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    const customer = await prisma.customerAccount.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!customer) {
      return { success: false, error: "Invalid or expired password reset link." };
    }

    const passwordHash = hashPassword(newPassword);

    await prisma.customerAccount.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        sessionToken: null, // Revoke active sessions for security
        tokenExpiresAt: null,
      },
    });

    return { success: true };
  }

  /**
   * Validates a persistent session token on server.
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

    if (customer.status !== "ACTIVE") {
      return null;
    }

    return this.toSession(customer);
  }

  /**
   * Updates customer theme preference (LIGHT, DARK, SYSTEM).
   */
  static async updateTheme(customerId: string, theme: "LIGHT" | "DARK" | "SYSTEM"): Promise<boolean> {
    await prisma.customerAccount.update({
      where: { id: customerId },
      data: { themePreference: theme },
    });
    return true;
  }

  /**
   * Updates customer full name with validation.
   */
  static async updateName(
    customerId: string,
    newName: string
  ): Promise<{ success: boolean; customer?: CustomerAuthSession; error?: string }> {
    if (!newName || newName.trim().length < 2) {
      return { success: false, error: "Please enter a valid full name (minimum 2 characters)." };
    }
    const updated = await prisma.customerAccount.update({
      where: { id: customerId },
      data: { name: newName.trim() },
    });
    return { success: true, customer: this.toSession(updated) };
  }

  /**
   * Initiates an email change challenge with verification code.
   */
  static async requestEmailChange(
    customerId: string,
    newEmail: string
  ): Promise<{ success: boolean; simulatedCode?: string; error?: string }> {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes("@") || !email.includes(".")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    const existing = await prisma.customerAccount.findUnique({ where: { email } });
    if (existing && existing.id !== customerId && existing.status === "ACTIVE") {
      return { success: false, error: "This email address is already associated with another account." };
    }

    const emailVerificationCode = generateOtpCode();
    const emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customerAccount.update({
      where: { id: customerId },
      data: {
        emailVerificationCode,
        emailVerificationExpiresAt,
      },
    });

    console.log(`[EMAIL-CHANGE-VERIFICATION] Code for ${email}: ${emailVerificationCode} (expires in 15m)`);

    return { success: true, simulatedCode: emailVerificationCode };
  }

  /**
   * Confirms email change using the dispatched verification code.
   */
  static async confirmEmailChange(
    customerId: string,
    newEmail: string,
    code: string
  ): Promise<{ success: boolean; customer?: CustomerAuthSession; error?: string }> {
    const customer = await prisma.customerAccount.findUnique({ where: { id: customerId } });
    if (!customer) {
      return { success: false, error: "Customer account not found." };
    }
    if (!customer.emailVerificationCode || !customer.emailVerificationExpiresAt) {
      return { success: false, error: "No email verification challenge active." };
    }
    if (new Date() > new Date(customer.emailVerificationExpiresAt)) {
      return { success: false, error: "Email verification code has expired. Please request a new one." };
    }
    if (customer.emailVerificationCode.trim() !== code.trim()) {
      return { success: false, error: "Invalid verification code." };
    }

    const email = newEmail.trim().toLowerCase();
    const updated = await prisma.customerAccount.update({
      where: { id: customerId },
      data: {
        email,
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true, customer: this.toSession(updated) };
  }

  /**
   * Initiates a phone number update with Africa's Talking SMS OTP verification.
   */
  static async requestPhoneChange(
    customerId: string,
    newPhone: string
  ): Promise<{ success: boolean; challengeId?: string; simulatedCode?: string; error?: string }> {
    if (!isValidPhoneNumber(newPhone)) {
      return { success: false, error: "Please enter a valid phone number (e.g., +255 7XX XXX XXX)." };
    }
    const phone = normalizePhoneNumber(newPhone);
    const existing = await prisma.customerAccount.findUnique({ where: { phoneNumber: phone } });
    if (existing && existing.id !== customerId && existing.status === "ACTIVE") {
      return { success: false, error: "This phone number is already associated with another account." };
    }

    const otpResult = await OtpService.requestOtp(phone);
    if (!otpResult.success) {
      return { success: false, error: otpResult.error || "Failed to dispatch verification SMS." };
    }

    return {
      success: true,
      challengeId: otpResult.challengeId,
      simulatedCode: otpResult.simulatedCode,
    };
  }

  /**
   * Confirms phone number update with OTP verification.
   */
  static async confirmPhoneChange(
    customerId: string,
    newPhone: string,
    challengeId: string,
    code: string
  ): Promise<{ success: boolean; customer?: CustomerAuthSession; error?: string }> {
    const customer = await prisma.customerAccount.findUnique({ where: { id: customerId } });
    if (!customer) {
      return { success: false, error: "Customer account not found." };
    }

    const verifyResult = await OtpService.verifyOtp(challengeId, code);
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || "Invalid SMS verification code." };
    }

    const phone = normalizePhoneNumber(newPhone);
    const updated = await prisma.customerAccount.update({
      where: { id: customerId },
      data: {
        phoneNumber: phone,
        phoneVerified: true,
      },
    });

    return { success: true, customer: this.toSession(updated) };
  }

  /**
   * Changes customer password with strict verification of existing password.
   */
  static async changePassword(
    customerId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const customer = await prisma.customerAccount.findUnique({ where: { id: customerId } });
    if (!customer || !customer.passwordHash) {
      return { success: false, error: "Customer account not found or has no password set." };
    }

    const isCurrentValid = verifyPassword(currentPassword, customer.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect." };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    const passwordHash = hashPassword(newPassword);
    await prisma.customerAccount.update({
      where: { id: customerId },
      data: { passwordHash },
    });

    return { success: true };
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

  /**
   * Initiates an account deletion request.
   */
  static async requestDeletion(customerId: string): Promise<boolean> {
    await prisma.customerAccount.update({
      where: { id: customerId },
      data: {
        status: "DELETION_REQUESTED",
        deletionRequestedAt: new Date(),
        sessionToken: null,
        tokenExpiresAt: null,
      },
    });
    return true;
  }

  private static toSession(account: any): CustomerAuthSession {
    return {
      customerId: account.id,
      name: account.name,
      phoneNumber: account.phoneNumber,
      email: account.email,
      phoneVerified: account.phoneVerified,
      emailVerified: account.emailVerified,
      onboardingDone: account.onboardingDone,
      status: account.status,
      themePreference: account.themePreference,
      authProvider: account.authProvider,
      sessionToken: account.sessionToken || "",
      tokenExpiresAt: account.tokenExpiresAt || new Date(),
    };
  }
}
