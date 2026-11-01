import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { generateSessionToken, hashToken } from "@/lib/crypto";
import { SessionStatus, TicketStatus } from "@prisma/client";
import { ScreeningService } from "@/features/screenings/screening-service";
import { BillingService } from "@/features/billing/billing-service";
import { smsService } from "@/features/messaging/sms-service";
import { RightsService } from "@/features/rights/rights-service";
import { maskPhoneNumber, maskToken } from "@/lib/auth-guards";
import { resolvePlaybackStreamUrls } from "@/lib/edge-streaming";

export interface ActivateSessionInput {
  ticketNumber?: string;
  claimToken?: string;
  challengeId?: string;
  phoneNumber?: string;
  deviceInfo?: string;
  customerId?: string;
  phoneAlreadyVerified?: boolean;
  clientIp?: string | null;
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
  totalDurationSeconds?: number;
  videoUrl?: string;
  primaryVideoUrl?: string;
  edgeVideoUrl?: string | null;
  venueWifiSsid?: string | null;
  preferredRoute?: "LAN_EDGE" | "WAN_CDN";
  isLanClient?: boolean;
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
    primaryVideoUrl?: string;
    edgeVideoUrl?: string | null;
    venueWifiSsid?: string | null;
    preferredRoute?: "LAN_EDGE" | "WAN_CDN";
    isLanClient?: boolean;
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
    const rawIdentifier = (input.claimToken || input.ticketNumber || "").trim();

    if (!rawIdentifier) {
      return {
        success: false,
        error: "Ticket number or claim token is required.",
      };
    }

    const upperIdentifier = rawIdentifier.toUpperCase();

    let verifiedPhoneNumber: string | null = null;

    // 1. Phone number verification guard
    // Disallow attaching unverified telephone numbers without an OTP challenge,
    // unless the customer is already authenticated with a verified telephone identity in-app.
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
      if (input.phoneNumber && input.phoneNumber.trim() !== challenge.phoneNumber) {
        return {
          success: false,
          error: "Phone number does not match verified OTP challenge.",
        };
      }
      verifiedPhoneNumber = challenge.phoneNumber;
    } else if (input.phoneNumber) {
      if (input.phoneAlreadyVerified && input.customerId) {
        const customer = await prisma.customerAccount.findUnique({
          where: { id: input.customerId },
          select: { phoneNumber: true, phoneVerified: true },
        });
        if (
          customer &&
          customer.phoneVerified &&
          customer.phoneNumber === input.phoneNumber.trim()
        ) {
          verifiedPhoneNumber = customer.phoneNumber;
        } else {
          return {
            success: false,
            error: "Phone verification challenge is required to attach a telephone number.",
          };
        }
      } else {
        return {
          success: false,
          error: "Phone verification challenge is required to attach a telephone number.",
        };
      }
    }

    // 2. Perform atomic activation inside a transaction with row-level locking
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        // Exclusively lock the DemonstrationTicket row in PostgreSQL to prevent concurrent double-activation
        const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "DemonstrationTicket"
          WHERE "ticketNumber" = ${rawIdentifier}
             OR LOWER("ticketNumber") = LOWER(${rawIdentifier})
             OR "claimToken" = ${rawIdentifier}
             OR LOWER("claimToken") = LOWER(${rawIdentifier})
          LIMIT 1
          FOR UPDATE
        `;

        if (!lockedRows || lockedRows.length === 0) {
          throw new Error("Ticket not found.");
        }

        const lockedTicketId = lockedRows[0].id;

        // Fetch ticket with freshly committed relation state under the lock
        const ticket = await tx.demonstrationTicket.findUnique({
          where: { id: lockedTicketId },
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

        // Verify content rights within the transaction boundary (pass tx to reuse transaction connection)
        const rightsCheck = await RightsService.verifyScreeningRights(
          ticket.screeningId,
          ticket.screening.cinemaId,
          tx
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

        // Create the break session with hashed token storage at rest
        const sessionTokenHash = hashToken(sessionToken);
        const session = await tx.breakSession.create({
          data: {
            sessionToken,
            sessionTokenHash,
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
              claimToken: maskToken(ticket.claimToken),
              seatNumber: ticket.seatNumber,
              phoneNumber: verifiedPhoneNumber ? maskPhoneNumber(verifiedPhoneNumber) : null,
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

      const resolvedStreams = resolvePlaybackStreamUrls({
        contentAsset: transactionResult.ticket.screening.contentAsset,
        cinema: transactionResult.ticket.screening.cinema,
        clientIp: input.clientIp,
      });

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
        totalDurationSeconds: transactionResult.ticket.screening.contentAsset.durationSeconds,
        videoUrl: transactionResult.ticket.screening.contentAsset.videoUrl,
        primaryVideoUrl: resolvedStreams.primaryVideoUrl,
        edgeVideoUrl: resolvedStreams.edgeVideoUrl,
        venueWifiSsid: resolvedStreams.venueWifiSsid,
        preferredRoute: resolvedStreams.preferredRoute,
        isLanClient: resolvedStreams.isLanClient,
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
    sessionToken: string,
    clientIp?: string | null
  ): Promise<SessionVerificationResult> {
    const tokenHash = hashToken(sessionToken);
    const session = await prisma.breakSession.findFirst({
      where: {
        OR: [
          { sessionTokenHash: tokenHash },
          { sessionToken },
        ],
      },
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
      const effectiveDuration = session.durationSeconds || 900;
      await prisma.$transaction(async (tx) => {
        await tx.breakSession.update({
          where: { id: session.id },
          data: {
            status: SessionStatus.EXPIRED,
            endedAt: now,
          },
        });

        await tx.auditEvent.create({
          data: {
            sessionId: session.id,
            eventType: "SESSION_EXPIRED",
            entityType: "BREAK_SESSION",
            entityId: session.id,
            actor: "SYSTEM",
            details: JSON.stringify({
              expiredAt: now.toISOString(),
              maxLimit: `${effectiveDuration} seconds reached`,
            }),
          },
        });
      });

      const durationMinutes = Math.round(effectiveDuration / 60);
      const durationLabel =
        durationMinutes > 0
          ? `${durationMinutes}-minute`
          : `${effectiveDuration}-second`;

      return {
        isValid: false,
        status: SessionStatus.EXPIRED,
        remainingSeconds: 0,
        reason: `Your companion viewing break has expired (${durationLabel} maximum limit reached). Please return to your cinema auditorium.`,
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

    const resolvedStreams = resolvePlaybackStreamUrls({
      contentAsset: session.screening.contentAsset,
      cinema: session.screening.cinema,
      clientIp,
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
        primaryVideoUrl: resolvedStreams.primaryVideoUrl,
        edgeVideoUrl: resolvedStreams.edgeVideoUrl,
        venueWifiSsid: resolvedStreams.venueWifiSsid,
        preferredRoute: resolvedStreams.preferredRoute,
        isLanClient: resolvedStreams.isLanClient,
        licenseType: session.screening.contentAsset.licenseType,
      },
    };
  }

  /**
   * Operator action: Revokes an active session immediately.
   */
  static async revokeSession(
    sessionId: string,
    reason: string,
    scopeCinemaId?: string
  ) {
    const session = await prisma.breakSession.findFirst({
      where: {
        id: sessionId,
        // When scoped, a session of another cinema is indistinguishable from a missing one
        ...(scopeCinemaId ? { screening: { cinemaId: scopeCinemaId } } : {}),
      },
    });

    if (!session) throw new Error("Session not found.");

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.breakSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.REVOKED,
          endedAt: now,
          revokedReason: reason,
        },
      });

      await tx.auditEvent.create({
        data: {
          sessionId,
          eventType: "SESSION_REVOKED",
          entityType: "BREAK_SESSION",
          entityId: sessionId,
          actor: "OPERATOR",
          details: JSON.stringify({ reason }),
        },
      });
    });

    return true;
  }

  /**
   * Patron action: Ends and completes an active break session upon returning to auditorium.
   */
  static async completeSession(sessionToken: string, reason: string = "Auditorium re-entry by patron") {
    const tokenHash = hashToken(sessionToken);
    const session = await prisma.breakSession.findFirst({
      where: {
        OR: [
          { sessionTokenHash: tokenHash },
          { sessionToken },
        ],
      },
    });

    if (!session) throw new Error("Session not found.");
    if (session.status !== SessionStatus.ACTIVE) return session;

    const now = new Date();
    const duration = Math.round((now.getTime() - session.startedAt.getTime()) / 1000);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.breakSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.COMPLETED,
          endedAt: now,
          durationSeconds: duration,
        },
      });

      await tx.auditEvent.create({
        data: {
          sessionId: session.id,
          eventType: "SESSION_COMPLETED_EARLY",
          entityType: "BREAK_SESSION",
          entityId: session.id,
          actor: "PATRON",
          details: JSON.stringify({ reason, durationSeconds: duration }),
        },
      });

      return updated;
    });
  }

  /**
   * Sweeps and transitions any expired ACTIVE sessions whose expiresAt has passed.
   * Can be invoked periodically by cron dispatch or background workers.
   */
  static async expireStaleSessions(): Promise<number> {
    const now = new Date();
    const staleSessions = await prisma.breakSession.findMany({
      where: {
        status: SessionStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        durationSeconds: true,
      },
      take: 200,
    });

    if (staleSessions.length === 0) return 0;

    let expiredCount = 0;
    for (const session of staleSessions) {
      try {
        await prisma.$transaction(async (tx) => {
          const res = await tx.breakSession.updateMany({
            where: {
              id: session.id,
              status: SessionStatus.ACTIVE,
            },
            data: {
              status: SessionStatus.EXPIRED,
              endedAt: now,
            },
          });

          if (res.count > 0) {
            await tx.auditEvent.create({
              data: {
                sessionId: session.id,
                eventType: "SESSION_EXPIRED",
                entityType: "BREAK_SESSION",
                entityId: session.id,
                actor: "BACKGROUND_WORKER",
                details: JSON.stringify({
                  expiredAt: now.toISOString(),
                  maxLimit: `${session.durationSeconds} seconds reached`,
                }),
              },
            });
            expiredCount++;
          }
        });
      } catch (err) {
        console.error(`[SESSION-SERVICE] Error expiring stale session ${session.id}:`, err);
      }
    }

    return expiredCount;
  }
}
