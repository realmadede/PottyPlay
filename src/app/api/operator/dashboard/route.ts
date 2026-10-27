import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BillingService } from "@/features/billing/billing-service";
import { ScreeningService } from "@/features/screenings/screening-service";

export async function GET() {
  try {
    const [screenings, sessions, smsAttempts, billingSummary, auditEvents] =
      await Promise.all([
        prisma.screening.findMany({
          include: {
            cinema: true,
            screen: true,
            contentAsset: true,
          },
          orderBy: { scheduledStart: "asc" },
        }),
        prisma.breakSession.findMany({
          take: 30,
          orderBy: { startedAt: "desc" },
          include: {
            ticket: true,
            screening: {
              include: { cinema: true, screen: true },
            },
            billingEvents: true,
          },
        }),
        prisma.smsDeliveryAttempt.findMany({
          take: 30,
          orderBy: { createdAt: "desc" },
        }),
        BillingService.getBillingSummary(),
        prisma.auditEvent.findMany({
          take: 30,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Compute live authoritative position for screenings
    const enrichedScreenings = screenings.map((s) => ({
      ...s,
      currentPositionSeconds: Math.round(
        ScreeningService.computePlaybackPosition(s) * 10
      ) / 10,
    }));

    // Session statistics
    const activeCount = sessions.filter((s) => s.status === "ACTIVE").length;
    const expiredCount = sessions.filter((s) => s.status === "EXPIRED").length;
    const revokedCount = sessions.filter((s) => s.status === "REVOKED").length;

    // SMS statistics
    const successfulSmsCount = smsAttempts.filter(
      (m) => m.status === "SENT" || m.status === "DELIVERED"
    ).length;
    const failedSmsCount = smsAttempts.filter((m) => m.status === "FAILED").length;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      screenings: enrichedScreenings,
      stats: {
        activeSessions: activeCount,
        expiredSessions: expiredCount,
        revokedSessions: revokedCount,
        totalSessionsTracked: sessions.length,
        successfulSmsDeliveries: successfulSmsCount,
        failedSmsDeliveries: failedSmsCount,
      },
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionTokenMasked: s.sessionToken.slice(0, 10) + "...",
        ticketNumber: s.ticket.ticketNumber,
        seatNumber: s.ticket.seatNumber,
        customerName: s.ticket.customerName,
        phoneNumber: s.phoneNumber,
        screeningTitle: s.screening.title,
        cinemaName: s.screening.cinema.name,
        screenName: s.screening.screen.name,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        endedAt: s.endedAt,
        status: s.status,
        revokedReason: s.revokedReason,
        lastHeartbeatAt: s.lastHeartbeatAt,
        billed: s.billingEvents.length > 0,
      })),
      smsAttempts: smsAttempts.map((m) => ({
        id: m.id,
        phoneNumber: m.phoneNumber,
        messageType: m.messageType,
        provider: m.provider,
        status: m.status,
        cost: m.cost,
        errorDetails: m.errorDetails,
        createdAt: m.createdAt,
      })),
      billing: billingSummary,
      auditEvents: auditEvents.map((a) => ({
        id: a.id,
        eventType: a.eventType,
        entityType: a.entityType,
        entityId: a.entityId,
        actor: a.actor,
        details: a.details,
        createdAt: a.createdAt,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
