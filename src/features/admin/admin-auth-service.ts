import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createHmac, timingSafeEqual } from "crypto";

// In-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || "pottyplay_admin_supersecret_key_2026";
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

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
   * Authenticates administrator and returns a cryptographically signed HMAC token.
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

    const timestamp = Date.now().toString();
    const payload = `${admin.id}.${timestamp}`;
    const signature = createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
    const token = `adm_${admin.id}.${timestamp}.${signature}`;

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
   * Validates admin session using HMAC signature verification, expiry check, and database lookup.
   */
  static async validateSession(token: string): Promise<boolean> {
    if (!token || !token.startsWith("adm_")) return false;

    const raw = token.slice(4);
    const parts = raw.split(".");
    if (parts.length !== 3) return false;

    const [adminId, timestampStr, candidateSig] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check expiration (8 hours)
    if (Date.now() - timestamp > ADMIN_SESSION_DURATION_MS) return false;

    const payload = `${adminId}.${timestampStr}`;
    const expectedSig = createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");

    if (candidateSig.length !== expectedSig.length) return false;
    try {
      const match = timingSafeEqual(
        Buffer.from(candidateSig, "hex"),
        Buffer.from(expectedSig, "hex")
      );
      if (!match) return false;
    } catch {
      return false;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, isActive: true },
    });

    return Boolean(admin && admin.isActive);
  }
}
