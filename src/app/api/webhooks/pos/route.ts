import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { ScreeningService } from "@/features/screenings/screening-service";
import { createHmac, timingSafeEqual } from "crypto";
import { TicketStatus, SessionStatus } from "@prisma/client";

/**
 * Validates HMAC SHA-256 signature for POS webhook payloads.
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) {
    // In production, signature header is strictly required
    return process.env.NODE_ENV !== "production";
  }

  try {
    const secret = config.posWebhookSecret;
    const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
    const signatureBuffer = Buffer.from(signatureHeader.replace(/^sha256=/, ""), "hex");
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

      case "screening.timeline_pause": {
        const { screeningId } = payload.data || payload;

        if (!screeningId) {
          return NextResponse.json(
            { success: false, error: "screeningId is required for screening.timeline_pause." },
            { status: 400 }
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
      case "screening.timeline_play": {
        const { screeningId } = payload.data || payload;

        if (!screeningId) {
          return NextResponse.json(
            { success: false, error: "screeningId is required for screening.timeline_resume." },
            { status: 400 }
          );
        }

        const state = await ScreeningService.resumePlayback(screeningId);

        return NextResponse.json({
          success: true,
          event,
          playbackState: state,
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
