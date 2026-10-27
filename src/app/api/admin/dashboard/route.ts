import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("pp_admin_token")?.value;

    if (!token || !token.startsWith("adm_")) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 401 });
    }

    const [
      cinemas,
      partnerApplications,
      screenings,
      sessions,
      billingEvents,
      auditEvents,
      smsAttempts,
    ] = await Promise.all([
      prisma.cinema.findMany({
        include: {
          screens: { select: { id: true, name: true, totalSeats: true } },
          pricingRules: { where: { status: "ACTIVE" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partnerApplication.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.screening.findMany({
        include: {
          cinema: { select: { name: true } },
          screen: { select: { name: true } },
        },
        orderBy: { scheduledStart: "desc" },
        take: 30,
      }),
      prisma.breakSession.findMany({
        take: 50,
        orderBy: { startedAt: "desc" },
        include: {
          ticket: { select: { ticketNumber: true, seatNumber: true } },
          screening: {
            select: {
              title: true,
              cinema: { select: { name: true } },
              screen: { select: { name: true } },
            },
          },
        },
      }),
      prisma.usageBillingEvent.findMany({
        include: {
          cinema: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.auditEvent.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma.smsDeliveryAttempt.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Financial ledger breakdown from real persisted records
    const totalUsageCount = sessions.length;
    const billableUsageCount = billingEvents.filter((b) => b.qualifying).length;
    const accruedChargesTzs = billingEvents.reduce(
      (sum, b) => sum + (b.qualifying ? b.priceTzs : 0),
      0
    );
    // Real accounting categories
    const invoicedAmountsTzs = 0; // Not invoiced until monthly billing settlement run
    const paymentsReceivedTzs = 0; // Real accounting separation: recorded usage != payment received
    const outstandingBalancesTzs = accruedChargesTzs - paymentsReceivedTzs;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      accounting: {
        totalUsageEvents: totalUsageCount,
        billableUsageEvents: billableUsageCount,
        accruedChargesTzs,
        invoicedAmountsTzs,
        paymentsReceivedTzs,
        outstandingBalancesTzs,
        currency: "TZS",
        disclaimer:
          "Real accounting ledger. Accrued charges represent recorded billable companion sessions. Invoicing and settlements occur per contractual billing cycles.",
      },
      stats: {
        totalCinemas: cinemas.length,
        approvedCinemas: cinemas.filter((c) => c.status === "APPROVED").length,
        pendingApplications: partnerApplications.filter((a) => a.status === "PENDING").length,
        activeSessions: sessions.filter((s) => s.status === "ACTIVE").length,
        completedSessions: sessions.filter((s) => s.status === "COMPLETED" || s.status === "EXPIRED").length,
      },
      cinemas: cinemas.map((c) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        status: c.status,
        screensCount: c.screens.length,
        ticketingSystem: c.ticketingSystem,
        screeningSystem: c.screeningSystem,
        activePriceTzs: c.pricingRules[0]?.pricePerSession ?? 500,
        createdAt: c.createdAt,
      })),
      partnerApplications: partnerApplications.map((a) => ({
        id: a.id,
        organizationName: a.organizationName,
        contactName: a.contactName,
        contactEmail: a.contactEmail,
        contactPhone: a.contactPhone,
        city: a.city,
        venueCount: a.venueCount,
        screensCount: a.screensCount,
        ticketingSystem: a.ticketingSystem,
        screeningServer: a.screeningServer,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
      screenings: screenings.map((s) => ({
        id: s.id,
        title: s.title,
        cinemaName: s.cinema.name,
        screenName: s.screen.name,
        status: s.status,
        scheduledStart: s.scheduledStart,
      })),
      sessions: sessions.map((s) => ({
        id: s.id,
        ticketNumber: s.ticket.ticketNumber,
        seatNumber: s.ticket.seatNumber,
        cinemaName: s.screening.cinema.name,
        screenName: s.screening.screen.name,
        screeningTitle: s.screening.title,
        breakNumber: s.breakNumber,
        status: s.status,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
      })),
      billingEvents: billingEvents.slice(0, 30).map((b) => ({
        id: b.id,
        cinemaName: b.cinema.name,
        ticketNumber: b.ticketNumber,
        priceTzs: b.priceTzs,
        currency: b.currency,
        qualifying: b.qualifying,
        createdAt: b.createdAt,
      })),
      auditEvents: auditEvents.slice(0, 30).map((a) => ({
        id: a.id,
        eventType: a.eventType,
        actor: a.actor,
        details: a.details,
        createdAt: a.createdAt,
      })),
      smsAttempts: smsAttempts.slice(0, 20).map((m) => ({
        id: m.id,
        phoneNumber: m.phoneNumber,
        status: m.status,
        provider: m.provider,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ success: false, error: "Failed to load admin dashboard." }, { status: 500 });
  }
}
