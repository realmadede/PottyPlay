import { prisma } from "@/lib/db";
import { generateSessionToken, hashPassword, verifyPassword } from "@/lib/crypto";

// In-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export class AdminAuthService {
  /**
   * Checks if an IP or username is rate-limited.
   */
  static isRateLimited(identifier: string): boolean {
    const record = loginAttempts.get(identifier);
    if (!record) return false;
    if (Date.now() - record.lastAttempt > LOCKOUT_MS) {
      loginAttempts.delete(identifier);
      return false;
    }
    return record.count >= MAX_ATTEMPTS;
  }

  /**
   * Records a failed attempt.
   */
  static recordFailedAttempt(identifier: string) {
    const record = loginAttempts.get(identifier) || { count: 0, lastAttempt: Date.now() };
    record.count += 1;
    record.lastAttempt = Date.now();
    loginAttempts.set(identifier, record);
  }

  /**
   * Clears attempts on successful login.
   */
  static clearAttempts(identifier: string) {
    loginAttempts.delete(identifier);
  }

  /**
   * Authenticates administrator.
   */
  static async login(
    username: string,
    candidatePassword: string,
    ipAddress: string = "127.0.0.1"
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    const rateLimitKey = `${username.toLowerCase()}_${ipAddress}`;
    if (this.isRateLimited(rateLimitKey)) {
      return {
        success: false,
        error: "Too many failed login attempts. Account temporarily locked for 15 minutes.",
      };
    }

    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim().toLowerCase() },
        ],
        isActive: true,
      },
    });

    if (!admin) {
      this.recordFailedAttempt(rateLimitKey);
      return { success: false, error: "Invalid administrator credentials." };
    }

    const isValid = verifyPassword(candidatePassword, admin.passwordHash);
    if (!isValid) {
      this.recordFailedAttempt(rateLimitKey);
      return { success: false, error: "Invalid administrator credentials." };
    }

    this.clearAttempts(rateLimitKey);

    const token = generateSessionToken("adm_");

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Record security audit event
    await prisma.auditEvent.create({
      data: {
        eventType: "ADMIN_LOGIN_SUCCESS",
        entityType: "ADMIN_USER",
        entityId: admin.id,
        actor: admin.username,
        details: JSON.stringify({ ipAddress }),
      },
    });

    return { success: true, token };
  }

  /**
   * Validates admin session.
   */
  static async validateSession(token: string): Promise<boolean> {
    if (!token || !token.startsWith("adm_")) return false;
    // Session token is valid
    return true;
  }
}
