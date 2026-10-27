import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { generateSessionToken } from "@/lib/crypto";
import { SessionStatus, TicketStatus } from "@prisma/client";
import { ScreeningService } from "@/features/screenings/screening-service";
import { BillingService } from "@/features/billing/billing-service";
import { smsService } from "@/features/messaging/sms-service";
import { RightsService } from "@/features/rights/rights-service";

export interface ActivateSessionInput {
  ticketNumber?: string;
  claimToken?: string;
  challengeId?: string;
  phoneNumber?: string;
  deviceInfo?: string;
}

export interface ActivateSessionResult {
  success: boolean;
  sessionToken?: string;
  sessionId?: string;
  startedAt?: Date;
  expiresAt?: Date;
  durationSeconds?: number;
  ticketNumber?: string;
  claimToken?: string | null;
  seatNumber?: string;
  customerName?: string;
  screeningId?: string;
  screeningTitle?: string;
  cinemaName?: string;
  screenName?: string;
  initialPlaybackPositionSeconds?: number;
  videoUrl?: string;
  error?: string;
}

export interface SessionVerificationResult {
  isValid: boolean;
  status: SessionStatus;
  remainingSeconds: number;
  session?: {
    id: string;
    phoneNumber?: string | null;
    startedAt: Date;
    expiresAt: Date;
    ticketNumber: string;
    seatNumber: string;
    customerName: string;
  };
  screening?: {
    id: string;
    title: string;
    cinemaName: string;
    screenName: string;
    playbackPositionSeconds: number;
    durationSeconds: number;
    isPaused: boolean;
    videoUrl: string;
    licenseType: string;
  };
  reason?: string;
}

export class SessionService {
  /**
   * Activates a new break companion session atomically using a transaction.
   * Supports:
   * 1. Direct claim token or ticket entitlement activation for one-time patrons
   * 2. Challenge-verified activation (Africa's Talking SMS OTP) for phone registration
   * 3. Atomic ticket status update
   * 4. Idempotent billing event creation
   * 5. Server-authoritative synchronization initialization
   */
  static async activateSession(
    input: ActivateSessionInput
  ): Promise<ActivateSessionResult> {
    const rawIdentifier = (input.claimToken || input.ticketNumber || "").trim().toUpperCase();

    if (!rawIdentifier) {
      return {
        success: false,
        error: "Ticket number or claim token is required.",
      };
    }

    let verifiedPhoneNumber: string | null = null;

    // 1. If challengeId is provided, verify it
    if (input.challengeId) {
      const challenge = await prisma.otpChallenge.findUnique({
        where: { id: input.challengeId },
      });

      if (!challenge || !challenge.isUsed || !challenge.verifiedAt) {
        return {
          success: false,
          error: "Phone verification is required before session activation.",
        };
      }
      verifiedPhoneNumber = challenge.phoneNumber;
    } else if (input.phoneNumber) {
      verifiedPhoneNumber = input.phoneNumber.trim();
    }

    // 2. Perform atomic activation inside a transaction
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        // Fetch ticket with locks
        const ticket = await tx.demonstrationTicket.findFirst({
          where: {
            OR: [
              { ticketNumber: rawIdentifier },
              { claimToken: rawIdentifier },
            ],
          },
          include: {
            screening: {
              include: {
                cinema: true,
                screen: true,
                contentAsset: true,
              },
            },
            breakSessions: true,
          },
        });

        if (!ticket) {
          throw new Error("Ticket not found.");
        }

        const activeSession = ticket.breakSessions?.find(
          (s) =>
            s.status === SessionStatus.ACTIVE &&
            new Date(s.expiresAt).getTime() > Date.now()
        );

        if (activeSession) {
          throw new Error(
            "This ticket has already been activated for an ongoing companion viewing break."
          );
        }

        const completedBreaksCount = ticket.breakSessions?.length || ticket.breakCount;

        if (ticket.status === TicketStatus.ALREADY_ACTIVATED || completedBreaksCount >= (ticket.maxBreaks || 2)) {
          throw new Error(
            "This ticket has already been activated for a companion viewing break."
          );
        }

        if (ticket.status === TicketStatus.CANCELLED_REFUNDED) {
          throw new Error("This ticket has been cancelled or refunded.");
        }

        if (ticket.status === TicketStatus.INELIGIBLE) {
          throw new Error("This ticket is ineligible for companion viewing.");
        }

        if (ticket.status !== TicketStatus.VALID_ADMITTED && completedBreaksCount === 0) {
          throw new Error("Ticket status does not allow admission.");
        }

        // Verify content rights within the transaction boundary
        const rightsCheck = await RightsService.verifyScreeningRights(
          ticket.screeningId,
          ticket.screening.cinemaId
        );

        if (!rightsCheck.isAuthorized) {
          throw new Error(
            rightsCheck.reason ||
              "Content rights authorization missing or expired for this screening."
          );
        }

        const now = new Date();
        const durationSeconds = Math.min(
          config.maxSessionDurationSeconds,
          rightsCheck.maxSessionDurationSeconds || 900
        );
        const expiresAt = new Date(now.getTime() + durationSeconds * 1000);
        const sessionToken = generateSessionToken();

        const nextBreakCount = completedBreaksCount + 1;
        const willExhaustBreaks = nextBreakCount >= (ticket.maxBreaks || 2);

        // Update ticket break count and status if max reached
        await tx.demonstrationTicket.update({
          where: { id: ticket.id },
          data: {
            breakCount: nextBreakCount,
            status: willExhaustBreaks ? TicketStatus.ALREADY_ACTIVATED : ticket.status,
            activatedAt: now,
          },
        });

        // Compute current authoritative playback position
        const currentPosition = ScreeningService.computePlaybackPosition(
          ticket.screening
        );

        // Create the break session
        const session = await tx.breakSession.create({
          data: {
            sessionToken,
            ticketId: ticket.id,
            screeningId: ticket.screeningId,
            phoneNumber: verifiedPhoneNumber,
            breakNumber: nextBreakCount,
            startedAt: now,
            expiresAt,
            status: SessionStatus.ACTIVE,
            deviceInfo: input.deviceInfo || "Web Browser (Mobile/Desktop)",
            lastPositionSeconds: currentPosition,
            lastHeartbeatAt: now,
          },
        });

        // Record qualifying billing event idempotently
        await BillingService.recordActivationBilling(
          session.id,
          ticket.screening.cinemaId,
          ticket.ticketNumber,
          tx
        );

        // Record audit event
        await tx.auditEvent.create({
          data: {
            sessionId: session.id,
            eventType: "SESSION_ACTIVATED",
            entityType: "BREAK_SESSION",
            entityId: session.id,
            actor: "CUSTOMER",
            details: JSON.stringify({
              ticketNumber: ticket.ticketNumber,
              claimToken: ticket.claimToken,
              seatNumber: ticket.seatNumber,
              phoneNumber: verifiedPhoneNumber,
              startedAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
              initialPosition: currentPosition,
            }),
          },
        });

        return {
          session,
          ticket,
          currentPosition,
          durationSeconds,
        };
      });

      // Send confirmation SMS asynchronously if phone number is available
      if (verifiedPhoneNumber) {
        smsService
          .sendSessionConfirmation(
            verifiedPhoneNumber,
            transactionResult.ticket.seatNumber,
            transactionResult.session.expiresAt
          )
          .catch((err) => {
            console.error("Failed to send session confirmation SMS:", err);
          });
      }

      return {
        success: true,
        sessionToken: transactionResult.session.sessionToken,
        sessionId: transactionResult.session.id,
        startedAt: transactionResult.session.startedAt,
        expiresAt: transactionResult.session.expiresAt,
        durationSeconds: transactionResult.durationSeconds,
        ticketNumber: transactionResult.ticket.ticketNumber,
        claimToken: transactionResult.ticket.claimToken,
        seatNumber: transactionResult.ticket.seatNumber,
        customerName: transactionResult.ticket.customerName,
        screeningId: transactionResult.ticket.screening.id,
        screeningTitle: transactionResult.ticket.screening.title,
        cinemaName: transactionResult.ticket.screening.cinema.name,
        screenName: transactionResult.ticket.screening.screen.name,
        initialPlaybackPositionSeconds:
          Math.round(transactionResult.currentPosition * 10) / 10,
        videoUrl: transactionResult.ticket.screening.contentAsset.videoUrl,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Authoritative session state check and synchronization heartbeat.
   * Calculates remaining time and enforces hard server-side expiration.
   */
  static async getSessionState(
    sessionToken: string
  ): Promise<SessionVerificationResult> {
    const session = await prisma.breakSession.findUnique({
      where: { sessionToken },
      include: {
        ticket: true,
        screening: {
          include: {
            cinema: true,
            screen: true,
            contentAsset: true,
          },
        },
      },
    });

    if (!session) {
      return {
        isValid: false,
        status: SessionStatus.FAILED,
        remainingSeconds: 0,
        reason: "Invalid session credentials. Please start a new session.",
      };
    }

    const now = new Date();

    // Check if session has expired based on server authoritative clock
    if (session.status === SessionStatus.ACTIVE && session.expiresAt <= now) {
      await prisma.breakSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.EXPIRED,
          endedAt: now,
        },
      });

      await prisma.auditEvent.create({
        data: {
          sessionId: session.id,
          eventType: "SESSION_EXPIRED",
          entityType: "BREAK_SESSION",
          entityId: session.id,
          actor: "SYSTEM",
          details: JSON.stringify({
            expiredAt: now.toISOString(),
            maxLimit: "900 seconds reached",
          }),
        },
      });

      return {
        isValid: false,
        status: SessionStatus.EXPIRED,
        remainingSeconds: 0,
        reason:
          "Your companion viewing break has expired (15-minute maximum limit reached). Please return to your cinema auditorium.",
      };
    }

    if (session.status === SessionStatus.EXPIRED) {
      return {
        isValid: false,
        status: SessionStatus.EXPIRED,
        remainingSeconds: 0,
        reason:
          "Your companion viewing break has expired. Please return to your cinema auditorium.",
      };
    }

    if (session.status === SessionStatus.REVOKED) {
      return {
        isValid: false,
        status: SessionStatus.REVOKED,
        remainingSeconds: 0,
        reason:
          session.revokedReason ||
          "This session has been revoked by the cinema operator.",
      };
    }

    if (session.status !== SessionStatus.ACTIVE) {
      return {
        isValid: false,
        status: session.status,
        remainingSeconds: 0,
        reason: "Session is not currently active.",
      };
    }

    // Active session: compute playback position and remaining time
    const currentPosition = ScreeningService.computePlaybackPosition(
      session.screening
    );
    const remainingSeconds = Math.max(
      0,
      Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000)
    );

    // Update heartbeat
    await prisma.breakSession.update({
      where: { id: session.id },
      data: {
        lastHeartbeatAt: now,
        lastPositionSeconds: currentPosition,
      },
    });

    return {
      isValid: true,
      status: SessionStatus.ACTIVE,
      remainingSeconds,
      session: {
        id: session.id,
        phoneNumber: session.phoneNumber,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        ticketNumber: session.ticket.ticketNumber,
        seatNumber: session.ticket.seatNumber,
        customerName: session.ticket.customerName,
      },
      screening: {
        id: session.screening.id,
        title: session.screening.title,
        cinemaName: session.screening.cinema.name,
        screenName: session.screening.screen.name,
        playbackPositionSeconds: Math.round(currentPosition * 10) / 10,
        durationSeconds: session.screening.contentAsset.durationSeconds,
        isPaused: session.screening.isPaused,
        videoUrl: session.screening.contentAsset.videoUrl,
        licenseType: session.screening.contentAsset.licenseType,
      },
    };
  }

  /**
   * Operator action: Revokes an active session immediately.
   */
  static async revokeSession(sessionId: string, reason: string) {
    const session = await prisma.breakSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new Error("Session not found.");

    const now = new Date();
    await prisma.breakSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.REVOKED,
        endedAt: now,
        revokedReason: reason,
      },
    });

    await prisma.auditEvent.create({
      data: {
        sessionId,
        eventType: "SESSION_REVOKED",
        entityType: "BREAK_SESSION",
        entityId: sessionId,
        actor: "OPERATOR",
        details: JSON.stringify({ reason }),
      },
    });

    return true;
  }
}
