import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";
import { SessionService } from "@/features/sessions/session-service";
import { z } from "zod";

const activateSchema = z.object({
  ticketNumber: z.string().min(1, "Ticket number required"),
  deviceInfo: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("pp_cust_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const customerSession = await CustomerAuthService.validateSession(token);
    if (!customerSession) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // 1. Check if there's currently an ACTIVE session for this customer
    const activeSession = await prisma.breakSession.findFirst({
      where: {
        OR: [
          { customerId: customerSession.customerId },
          ...(customerSession.phoneNumber ? [{ phoneNumber: customerSession.phoneNumber }] : []),
        ],
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      include: {
        ticket: { select: { ticketNumber: true, seatNumber: true, breakCount: true, maxBreaks: true } },
        screening: {
          include: {
            cinema: { select: { name: true, location: true } },
            screen: { select: { name: true } },
            contentAsset: { select: { durationSeconds: true, videoUrl: true } },
          },
        },
      },
    });

    if (activeSession) {
      const now = Date.now();
      const expires = new Date(activeSession.expiresAt).getTime();
      const remainingSeconds = Math.max(0, Math.floor((expires - now) / 1000));

      return NextResponse.json({
        success: true,
        hasActiveSession: true,
        session: {
          sessionToken: activeSession.sessionToken,
          sessionId: activeSession.id,
          remainingSeconds,
          breakNumber: activeSession.breakNumber,
          ticketNumber: activeSession.ticket.ticketNumber,
          seatNumber: activeSession.ticket.seatNumber,
          screening: {
            id: activeSession.screening.id,
            title: activeSession.screening.title,
            cinemaName: activeSession.screening.cinema.name,
            screenName: activeSession.screening.screen.name,
            playbackPositionSeconds: activeSession.screening.playbackPositionSeconds,
            durationSeconds: activeSession.screening.contentAsset.durationSeconds,
            isPaused: activeSession.screening.isPaused,
            videoUrl: activeSession.screening.contentAsset.videoUrl,
          },
        },
      });
    }

    // 2. Check for confirmed ticket entitlement linked to this customer
    let eligibleTicket = null;

    // A. Check for ticket linked via active screening reminder
    const customerReminder = await prisma.screeningReminder.findFirst({
      where: {
        customerId: customerSession.customerId,
        ticketNumber: { not: null },
        isEnabled: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (customerReminder?.ticketNumber) {
      eligibleTicket = await prisma.demonstrationTicket.findFirst({
        where: {
          ticketNumber: customerReminder.ticketNumber,
          status: "VALID_ADMITTED",
          breakCount: { lt: 2 },
          screening: {
            status: { in: ["PLAYING", "SCHEDULED"] },
          },
        },
        include: {
          screening: {
            include: {
              cinema: { select: { name: true, location: true } },
              screen: { select: { name: true } },
            },
          },
          breakSessions: true,
        },
      });
    }

    // B. Check for ticket linked by customer name if not found via reminder
    if (!eligibleTicket && customerSession.name) {
      eligibleTicket = await prisma.demonstrationTicket.findFirst({
        where: {
          customerName: { equals: customerSession.name, mode: "insensitive" },
          status: "VALID_ADMITTED",
          breakCount: { lt: 2 },
          screening: {
            status: { in: ["PLAYING", "SCHEDULED"] },
          },
        },
        include: {
          screening: {
            include: {
              cinema: { select: { name: true, location: true } },
              screen: { select: { name: true } },
            },
          },
          breakSessions: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveSession: false,
      eligibleTicket: eligibleTicket
        ? {
            ticketNumber: eligibleTicket.ticketNumber,
            seatNumber: eligibleTicket.seatNumber,
            customerName: eligibleTicket.customerName,
            breaksUsed: eligibleTicket.breakCount,
            maxBreaks: eligibleTicket.maxBreaks,
            breaksRemaining: Math.max(0, eligibleTicket.maxBreaks - eligibleTicket.breakCount),
            screening: {
              id: eligibleTicket.screening.id,
              title: eligibleTicket.screening.title,
              cinemaName: eligibleTicket.screening.cinema.name,
              screenName: eligibleTicket.screening.screen.name,
            },
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to check bathroom status:", error);
    return NextResponse.json({ success: false, error: "Failed to query bathroom status." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("pp_cust_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const customerSession = await CustomerAuthService.validateSession(token);
    if (!customerSession) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // Phone verification is mandatory for protected viewing access
    if (!customerSession.phoneVerified && !customerSession.phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone verification is required before activating Bathroom Mode.",
          requiresPhoneVerification: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ticketNumber, deviceInfo } = activateSchema.parse(body);

    const activationResult = await SessionService.activateSession({
      ticketNumber: ticketNumber.trim().toUpperCase(),
      phoneNumber: customerSession.phoneNumber || undefined,
      deviceInfo: deviceInfo || "Customer Mobile Application",
    });

    if (!activationResult.success) {
      return NextResponse.json(
        { success: false, error: activationResult.error || "Failed to activate session." },
        { status: 400 }
      );
    }

    // Link customerId to session
    if (activationResult.sessionId) {
      await prisma.breakSession.update({
        where: { id: activationResult.sessionId },
        data: { customerId: customerSession.customerId },
      });
    }

    return NextResponse.json({
      success: true,
      session: activationResult,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Failed to activate bathroom session:", error);
    return NextResponse.json({ success: false, error: "Activation failed." }, { status: 500 });
  }
}
