import { prisma } from "@/lib/db";
import { generateSessionToken, hashPassword, verifyPassword } from "@/lib/crypto";
import { randomBytes } from "crypto";

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export interface OperatorSession {
  id: string;
  cinemaId: string;
  email: string;
  name: string;
  role: string;
  cinema: {
    id: string;
    name: string;
    location: string;
  };
}

export class OperatorAuthService {
  /**
   * Checks if an IP or email is rate-limited.
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
   * Records a failed login attempt.
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
   * Authenticates cinema operator staff.
   */
  static async login(
    email: string,
    candidatePassword: string,
    ipAddress: string = "127.0.0.1"
  ): Promise<{ success: boolean; token?: string; operator?: OperatorSession; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const rateLimitKey = `${cleanEmail}_${ipAddress}`;

    if (this.isRateLimited(rateLimitKey)) {
      return {
        success: false,
        error: "Too many failed sign in attempts. Account temporarily locked for 15 minutes.",
      };
    }

    const operator = await prisma.operatorUser.findFirst({
      where: {
        email: cleanEmail,
        isActive: true,
      },
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
            location: true,
            status: true,
          },
        },
      },
    });

    if (!operator) {
      this.recordFailedAttempt(rateLimitKey);
      return { success: false, error: "Invalid operator credentials or inactive account." };
    }

    if (operator.cinema.status !== "APPROVED") {
      return {
        success: false,
        error: "Cinema organization is pending administrative review or has been suspended.",
      };
    }

    const isValid = verifyPassword(candidatePassword, operator.passwordHash);
    if (!isValid) {
      this.recordFailedAttempt(rateLimitKey);
      return { success: false, error: "Invalid operator credentials." };
    }

    this.clearAttempts(rateLimitKey);

    const token = generateSessionToken("opr_");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.operatorUser.update({
      where: { id: operator.id },
      data: {
        sessionToken: token,
        tokenExpiresAt: expiresAt,
        lastLoginAt: new Date(),
      },
    });

    // Record security audit event
    await prisma.auditEvent.create({
      data: {
        cinemaId: operator.cinemaId,
        eventType: "OPERATOR_LOGIN_SUCCESS",
        entityType: "OPERATOR_USER",
        entityId: operator.id,
        actor: operator.email,
        details: JSON.stringify({ ipAddress, role: operator.role }),
      },
    });

    return {
      success: true,
      token,
      operator: {
        id: operator.id,
        cinemaId: operator.cinemaId,
        email: operator.email,
        name: operator.name,
        role: operator.role,
        cinema: {
          id: operator.cinema.id,
          name: operator.cinema.name,
          location: operator.cinema.location,
        },
      },
    };
  }

  /**
   * Requests a password reset token for cinema operator.
   */
  static async requestPasswordReset(
    email: string,
    ipAddress: string = "127.0.0.1"
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const operator = await prisma.operatorUser.findFirst({
      where: { email: cleanEmail, isActive: true },
    });

    if (operator) {
      const resetToken = "opr_rst_" + randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.operatorUser.update({
        where: { id: operator.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: expiresAt,
        },
      });

      console.log(`[OPERATOR-PASSWORD-RESET] Token for ${cleanEmail}: ${resetToken} (expires in 15m)`);

      await prisma.auditEvent.create({
        data: {
          cinemaId: operator.cinemaId,
          eventType: "OPERATOR_PASSWORD_RESET_REQUESTED",
          entityType: "OPERATOR_USER",
          entityId: operator.id,
          actor: operator.email,
          details: JSON.stringify({ ipAddress }),
        },
      });
    }

    return {
      success: true,
      message: "If an account exists with this email address, password reset instructions have been dispatched.",
    };
  }

  /**
   * Resets operator password with verified token.
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    ipAddress: string = "127.0.0.1"
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!token || !token.startsWith("opr_rst_")) {
      return { success: false, error: "Invalid or malformed password reset token." };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters in length." };
    }

    const operator = await prisma.operatorUser.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!operator) {
      return { success: false, error: "Password reset token is invalid or has expired." };
    }

    const newHash = hashPassword(newPassword);

    await prisma.operatorUser.update({
      where: { id: operator.id },
      data: {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        sessionToken: null,
        tokenExpiresAt: null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        cinemaId: operator.cinemaId,
        eventType: "OPERATOR_PASSWORD_RESET_SUCCESS",
        entityType: "OPERATOR_USER",
        entityId: operator.id,
        actor: operator.email,
        details: JSON.stringify({ ipAddress }),
      },
    });

    return {
      success: true,
      message: "Operator password updated successfully. You may now sign in with your new credentials.",
    };
  }

  /**
   * Verifies an active operator session token.
   */
  static async verifySession(token: string): Promise<OperatorSession | null> {
    if (!token || !token.startsWith("opr_")) {
      return null;
    }

    const operator = await prisma.operatorUser.findFirst({
      where: {
        sessionToken: token,
        tokenExpiresAt: { gt: new Date() },
        isActive: true,
      },
      include: {
        cinema: {
          select: {
            id: true,
            name: true,
            location: true,
            status: true,
          },
        },
      },
    });

    if (!operator || operator.cinema.status !== "APPROVED") {
      return null;
    }

    return {
      id: operator.id,
      cinemaId: operator.cinemaId,
      email: operator.email,
      name: operator.name,
      role: operator.role,
      cinema: {
        id: operator.cinema.id,
        name: operator.cinema.name,
        location: operator.cinema.location,
      },
    };
  }

  /**
   * Invalidates active operator session.
   */
  static async logout(token: string): Promise<boolean> {
    if (!token || !token.startsWith("opr_")) return false;

    const op = await prisma.operatorUser.findFirst({
      where: { sessionToken: token },
    });

    if (op) {
      await prisma.operatorUser.update({
        where: { id: op.id },
        data: {
          sessionToken: null,
          tokenExpiresAt: null,
        },
      });
      return true;
    }

    return false;
  }
}
