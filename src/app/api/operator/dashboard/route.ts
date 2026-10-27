import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ScreeningService } from "@/features/screenings/screening-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedCinemaId =
      searchParams.get("cinemaId") ||
      req.headers.get("x-cinema-id") ||
      "cinema_mlimani_01";

    // 1. Fetch authorized Cinema organization
    const cinema = await prisma.cinema.findUnique({
      where: { id: requestedCinemaId },
      include: {
        screens: {
          select: { id: true, name: true, totalSeats: true },
        },
        pricingRules: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!cinema) {
      return NextResponse.json(
        { success: false, error: "Cinema organization not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Tenant-isolated queries strictly constrained to this cinema organization
    const [screenings, sessions, billingEvents, auditEvents, smsAttempts] =
      await Promise.all([
        prisma.screening.findMany({
          where: { cinemaId: cinema.id },
          include: {
            screen: true,
            contentAsset: true,
          },
          orderBy: { scheduledStart: "asc" },
        }),
        prisma.breakSession.findMany({
          where: { screening: { cinemaId: cinema.id } },
          take: 30,
          orderBy: { startedAt: "desc" },
          include: {
            ticket: true,
            screening: {
              include: { screen: true },
            },
            billingEvents: true,
          },
        }),
        prisma.usageBillingEvent.findMany({
          where: { cinemaId: cinema.id },
          take: 50,
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditEvent.findMany({
          where: {
            OR: [
              { cinemaId: cinema.id },
              { session: { screening: { cinemaId: cinema.id } } },
            ],
          },
          take: 30,
          orderBy: { createdAt: "desc" },
        }),
        prisma.smsDeliveryAttempt.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Compute live authoritative position for screenings
    const enrichedScreenings = screenings.map((s) => ({
      ...s,
      currentPositionSeconds:
        Math.round(ScreeningService.computePlaybackPosition(s) * 10) / 10,
    }));

    // Session statistics
    const activeCount = sessions.filter((s) => s.status === "ACTIVE").length;
    const expiredCount = sessions.filter((s) => s.status === "EXPIRED").length;
    const revokedCount = sessions.filter((s) => s.status === "REVOKED").length;

    // Current active commercial pricing
    const currentPriceTzs =
      cinema.pricingRules[0]?.pricePerSession ?? 500;
    const currentCurrency = cinema.pricingRules[0]?.currency ?? "TZS";
    const pricingStatus = cinema.pricingRules[0]?.status ?? "ACTIVE";

    // Accurate billing aggregation from real persisted records
    const billableActivations = billingEvents.filter((b) => b.qualifying).length;
    const totalRecordedAmount = billingEvents.reduce(
      (sum, b) => sum + (b.qualifying ? b.priceTzs : 0),
      0
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cinema: {
        id: cinema.id,
        name: cinema.name,
        location: cinema.location,
        timezone: cinema.timezone,
        ticketingSystem: cinema.ticketingSystem || "Vista",
        screeningSystem: cinema.screeningSystem || "Dolby TMS",
        status: cinema.status,
        screens: cinema.screens,
      },
      pricing: {
        currentPrice: currentPriceTzs,
        currency: currentCurrency,
        status: pricingStatus,
        configuredAt: cinema.pricingRules[0]?.createdAt || cinema.createdAt,
      },
      stats: {
        activeSessions: activeCount,
        expiredSessions: expiredCount,
        revokedSessions: revokedCount,
        totalSessionsTracked: sessions.length,
        totalBillableActivations: billableActivations,
        totalRecordedAmount,
      },
      screenings: enrichedScreenings,
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionTokenMasked: s.sessionToken.slice(0, 10) + "...",
        ticketNumber: s.ticket.ticketNumber,
        seatNumber: s.ticket.seatNumber,
        customerName: s.ticket.customerName,
        phoneNumber: s.phoneNumber,
        breakNumber: s.breakNumber,
        screeningTitle: s.screening.title,
        cinemaName: cinema.name,
        screenName: s.screening.screen.name,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        endedAt: s.endedAt,
        status: s.status,
        revokedReason: s.revokedReason,
        lastHeartbeatAt: s.lastHeartbeatAt,
        billed: s.billingEvents.length > 0,
      })),
      billing: {
        totalBillableActivations: billableActivations,
        totalEstimatedRevenueTzs: totalRecordedAmount,
        currency: currentCurrency,
        pricePerSessionTzs: currentPriceTzs,
        disclaimer:
          "Recorded qualifying usage per negotiated cinema commercial schedule. Invoicing is processed per billing cycle.",
        recentBillingEvents: billingEvents.slice(0, 15).map((b) => ({
          id: b.id,
          sessionId: b.sessionId,
          ticketNumber: b.ticketNumber,
          priceTzs: b.priceTzs,
          currency: b.currency,
          createdAt: b.createdAt,
        })),
      },
      auditEvents: auditEvents.map((a) => ({
        id: a.id,
        eventType: a.eventType,
        entityType: a.entityType,
        entityId: a.entityId,
        actor: a.actor,
        details: a.details,
        createdAt: a.createdAt,
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
    });
  } catch (error) {
    console.error("Failed to load operator dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load operator workspace telemetry." },
      { status: 500 }
    );
  }
}
