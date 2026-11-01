import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { ScreeningService } from "@/features/screenings/screening-service";
import { createHmac, timingSafeEqual } from "crypto";
import { TicketStatus, SessionStatus, ScreeningStatus } from "@prisma/client";

/**
 * Validates HMAC SHA-256 signature for POS webhook payloads.
 * Strictly required in ALL environments to prevent unauthorized ticket forgery.
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) {
    return false;
  }

  try {
    const secret = config.posWebhookSecret;
    const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
    const cleanHeader = signatureHeader.replace(/^sha256=/, "").trim();
    const signatureBuffer = Buffer.from(cleanHeader, "hex");
    const computedBuffer = Buffer.from(computed, "hex");

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, computedBuffer);
  } catch (error) {
    console.error("[POS-WEBHOOK] Signature verification failure:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-pos-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-hub-signature-256");

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing webhook signature." },
        { status: 401 }
      );
    }

    // Replay attack protection: optional timestamp verification
    const timestampHeader =
      req.headers.get("x-pos-timestamp") || req.headers.get("x-timestamp");
    if (timestampHeader) {
      const ts = parseInt(timestampHeader, 10);
      if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
        return NextResponse.json(
          { success: false, error: "Webhook request timestamp is expired or invalid." },
          { status: 401 }
        );
      }
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    const event = payload.event || payload.type;
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Missing event type in webhook payload." },
        { status: 400 }
      );
    }

    const xCinemaId = req.headers.get("x-cinema-id");

    switch (event) {
      case "ticket.admitted":
      case "ticket.issued": {
        const { ticketNumber, screeningId, seatNumber, customerName, claimToken } = payload.data || payload;

        if (!ticketNumber || !screeningId) {
          return NextResponse.json(
            { success: false, error: "ticketNumber and screeningId are required for ticket.admitted." },
            { status: 400 }
          );
        }

        // Verify screening exists and matches tenant scope if provided
        const screening = await prisma.screening.findUnique({
          where: { id: screeningId },
        });

        if (!screening) {
          return NextResponse.json(
            { success: false, error: `Screening ${screeningId} not found.` },
            { status: 404 }
          );
        }

        if (xCinemaId && screening.cinemaId !== xCinemaId) {
          return NextResponse.json(
            { success: false, error: "Screening does not belong to the authorized cinema." },
            { status: 403 }
          );
        }

        // Check if ticket exists under another screening
        const existingTicket = await prisma.demonstrationTicket.findUnique({
          where: { ticketNumber },
        });

        if (existingTicket && existingTicket.screeningId !== screeningId) {
          return NextResponse.json(
            { success: false, error: `Ticket ${ticketNumber} is already bound to another screening.` },
            { status: 409 }
          );
        }

        const ticket = await prisma.demonstrationTicket.upsert({
          where: { ticketNumber },
          update: {
            status: TicketStatus.VALID_ADMITTED,
            seatNumber: seatNumber || undefined,
            customerName: customerName || undefined,
            claimToken: claimToken || undefined,
          },
          create: {
            ticketNumber,
            screeningId,
            seatNumber: seatNumber || "General",
            customerName: customerName || "Cinema Patron",
            claimToken: claimToken || null,
            status: TicketStatus.VALID_ADMITTED,
          },
        });

        await prisma.auditEvent.create({
          data: {
            cinemaId: screening.cinemaId,
            eventType: "POS_TICKET_ADMITTED",
            entityType: "TICKET",
            entityId: ticket.id,
            actor: "POS_SYSTEM",
            details: JSON.stringify({ ticketNumber, screeningId, seatNumber }),
          },
        });

        return NextResponse.json({
          success: true,
          event,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
        });
      }

      case "ticket.refunded":
      case "ticket.voided":
      case "ticket.cancelled": {
        const { ticketNumber } = payload.data || payload;

        if (!ticketNumber) {
          return NextResponse.json(
            { success: false, error: "ticketNumber is required for ticket refund/void." },
            { status: 400 }
          );
        }

        const ticket = await prisma.demonstrationTicket.findUnique({
          where: { ticketNumber },
        });

        if (!ticket) {
          return NextResponse.json(
            { success: false, error: `Ticket ${ticketNumber} not found.` },
            { status: 404 }
          );
        }

        // Update ticket status to cancelled/refunded
        await prisma.demonstrationTicket.update({
          where: { id: ticket.id },
          data: { status: TicketStatus.CANCELLED_REFUNDED },
        });

        // Immediately revoke any active break session for this refunded ticket
        const revokedSessions = await prisma.breakSession.updateMany({
          where: {
            ticketId: ticket.id,
            status: SessionStatus.ACTIVE,
          },
          data: {
            status: SessionStatus.REVOKED,
            revokedReason: "Ticket cancelled or refunded at POS box office.",
            endedAt: new Date(),
          },
        });

        await prisma.auditEvent.create({
          data: {
            eventType: "POS_TICKET_REFUNDED",
            entityType: "TICKET",
            entityId: ticket.id,
            actor: "POS_SYSTEM",
            details: JSON.stringify({ ticketNumber, revokedSessionsCount: revokedSessions.count }),
          },
        });

        return NextResponse.json({
          success: true,
          event,
          ticketNumber,
          status: TicketStatus.CANCELLED_REFUNDED,
          revokedSessions: revokedSessions.count,
        });
      }

      case "screening.timeline_pause":
      case "screening.playback_paused":
      case "tms.playback_paused": {
        const { screeningId } = payload.data || payload;

        if (!screeningId) {
          return NextResponse.json(
            { success: false, error: "screeningId is required for screening.timeline_pause." },
            { status: 400 }
          );
        }

        const screening = await prisma.screening.findUnique({ where: { id: screeningId } });
        if (!screening) {
          return NextResponse.json(
            { success: false, error: `Screening ${screeningId} not found.` },
            { status: 404 }
          );
        }
        if (xCinemaId && screening.cinemaId !== xCinemaId) {
          return NextResponse.json(
            { success: false, error: "Screening does not belong to the authorized cinema." },
            { status: 403 }
          );
        }

        const state = await ScreeningService.pausePlayback(screeningId);

        return NextResponse.json({
          success: true,
          event,
          playbackState: state,
        });
      }

      case "screening.timeline_resume":
      case "screening.timeline_play":
      case "screening.playback_started":
      case "screening.playback_resumed":
      case "tms.playback_started":
      case "tms.playback_resumed": {
        const { screeningId } = payload.data || payload;

        if (!screeningId) {
          return NextResponse.json(
            { success: false, error: "screeningId is required for screening.timeline_resume." },
            { status: 400 }
          );
        }

        const screening = await prisma.screening.findUnique({ where: { id: screeningId } });
        if (!screening) {
          return NextResponse.json(
            { success: false, error: `Screening ${screeningId} not found.` },
            { status: 404 }
          );
        }
        if (xCinemaId && screening.cinemaId !== xCinemaId) {
          return NextResponse.json(
            { success: false, error: "Screening does not belong to the authorized cinema." },
            { status: 403 }
          );
        }

        const state = await ScreeningService.resumePlayback(screeningId);

        return NextResponse.json({
          success: true,
          event,
          playbackState: state,
        });
      }

      case "screening.playback_stopped":
      case "screening.ended":
      case "tms.playback_stopped": {
        const { screeningId } = payload.data || payload;

        if (!screeningId) {
          return NextResponse.json(
            { success: false, error: "screeningId is required for playback stop event." },
            { status: 400 }
          );
        }

        const screening = await prisma.screening.findUnique({ where: { id: screeningId } });
        if (!screening) {
          return NextResponse.json(
            { success: false, error: `Screening ${screeningId} not found.` },
            { status: 404 }
          );
        }
        if (xCinemaId && screening.cinemaId !== xCinemaId) {
          return NextResponse.json(
            { success: false, error: "Screening does not belong to the authorized cinema." },
            { status: 403 }
          );
        }

        await prisma.screening.update({
          where: { id: screeningId },
          data: {
            status: ScreeningStatus.COMPLETED,
            isPaused: true,
            pausedAt: new Date(),
          },
        });

        await prisma.auditEvent.create({
          data: {
            cinemaId: screening.cinemaId,
            eventType: "TMS_PLAYBACK_STOPPED",
            entityType: "SCREENING",
            entityId: screening.id,
            actor: "TMS_SYSTEM",
            details: JSON.stringify({ screeningId, event }),
          },
        });

        return NextResponse.json({
          success: true,
          event,
          screeningId,
          status: ScreeningStatus.COMPLETED,
        });
      }

      case "screening.timeline_seek": {
        const { screeningId, positionSeconds } = payload.data || payload;

        if (!screeningId || typeof positionSeconds !== "number") {
          return NextResponse.json(
            { success: false, error: "screeningId and positionSeconds are required for screening.timeline_seek." },
            { status: 400 }
          );
        }

        const screening = await prisma.screening.findUnique({ where: { id: screeningId } });
        if (!screening) {
          return NextResponse.json(
            { success: false, error: `Screening ${screeningId} not found.` },
            { status: 404 }
          );
        }
        if (xCinemaId && screening.cinemaId !== xCinemaId) {
          return NextResponse.json(
            { success: false, error: "Screening does not belong to the authorized cinema." },
            { status: 403 }
          );
        }

        const state = await ScreeningService.seekPlayback(screeningId, positionSeconds);

        return NextResponse.json({
          success: true,
          event,
          playbackState: state,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported POS event type: ${event}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[POS-WEBHOOK-ROUTE] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process POS webhook." },
      { status: 500 }
    );
  }
}
