import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export interface BillingSummary {
  totalBillableActivations: number;
  totalEstimatedRevenueTzs: number;
  pricePerSessionTzs: number;
  disclaimer: string;
  recentBillingEvents: Array<{
    id: string;
    sessionId: string;
    cinemaId: string;
    cinemaName?: string;
    ticketNumber: string;
    priceTzs: number;
    createdAt: Date;
    isSimulated: boolean;
  }>;
}

export class BillingService {
  /**
   * Records a billable activation event idempotently inside a transaction.
   * If an event for this session already exists, it will not create a duplicate.
   * Uses dynamic percentage deduction if ticket face value is available,
   * otherwise uses active CinemaPricingRule or configured demo default.
   */
  static async recordActivationBilling(
    sessionId: string,
    cinemaId: string,
    ticketNumber: string,
    tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    ticketPriceTzs?: number
  ) {
    const client = tx || prisma;

    // Check if already billed for this session
    const existing = await client.usageBillingEvent.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return existing;
    }

    // Lookup active pricing rule for cinema
    const activePricing = await client.cinemaPricingRule.findFirst({
      where: {
        cinemaId,
        status: "ACTIVE",
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });

    // Determine percentage rate (from pricing rule notes or system default)
    let deductionPercent = config.deductionPercentDefault;
    if (activePricing?.notes && /percent:\s*([\d.]+)/i.test(activePricing.notes)) {
      const match = activePricing.notes.match(/percent:\s*([\d.]+)/i);
      if (match && match[1]) {
        deductionPercent = parseFloat(match[1]);
      }
    }

    let priceTzs: number;
    let disclaimer: string;

    if (ticketPriceTzs && ticketPriceTzs > 0) {
      // Dynamic percentage deduction based on ticket face value
      priceTzs = Math.round(ticketPriceTzs * (deductionPercent / 100));
      disclaimer = `Dynamic commercial deduction calculated at ${deductionPercent}% of ticket face value (${ticketPriceTzs} TZS)`;
    } else {
      priceTzs = activePricing ? activePricing.pricePerSession : config.demoPricePerSessionTzs;
      disclaimer = activePricing
        ? (activePricing.notes || `Agreed commercial rate for cinema ${cinemaId}`)
        : `Dynamic percentage model (${deductionPercent}% standard) applied with fallback base rate`;
    }

    const currency = activePricing ? activePricing.currency : "TZS";
    const isSimulated = !activePricing;

    return client.usageBillingEvent.create({
      data: {
        sessionId,
        cinemaId,
        ticketNumber,
        priceTzs,
        currency,
        qualifying: true,
        isSimulated,
        disclaimer,
      },
    });
  }

  /**
   * Returns the aggregate billing summary for the operator or admin dashboard.
   */
  static async getBillingSummary(cinemaId?: string): Promise<BillingSummary> {
    const whereClause = cinemaId
      ? { qualifying: true, cinemaId }
      : { qualifying: true };

    const [totalCount, events, activePricing] = await Promise.all([
      prisma.usageBillingEvent.count({
        where: whereClause,
      }),
      prisma.usageBillingEvent.findMany({
        where: cinemaId ? { cinemaId } : undefined,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          cinema: { select: { name: true } },
        },
      }),
      cinemaId
        ? prisma.cinemaPricingRule.findFirst({
            where: {
              cinemaId,
              status: "ACTIVE",
              effectiveFrom: { lte: new Date() },
              OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: new Date() } },
              ],
            },
            orderBy: { effectiveFrom: "desc" },
          })
        : null,
    ]);

    const pricePerSession = activePricing
      ? activePricing.pricePerSession
      : config.demoPricePerSessionTzs;

    const totalRevenue = events.reduce(
      (sum, e) => sum + (e.qualifying ? e.priceTzs : 0),
      0
    );

    return {
      totalBillableActivations: totalCount,
      totalEstimatedRevenueTzs: totalRevenue,
      pricePerSessionTzs: pricePerSession,
      disclaimer: activePricing
        ? (activePricing.notes || "Contracted commercial rate applied")
        : "Simulated commercial pricing model for cinema partner evaluation, not an agreed commercial rate",
      recentBillingEvents: events.map((e) => ({
        id: e.id,
        sessionId: e.sessionId,
        cinemaId: e.cinemaId,
        cinemaName: e.cinema.name,
        ticketNumber: e.ticketNumber,
        priceTzs: e.priceTzs,
        createdAt: e.createdAt,
        isSimulated: e.isSimulated,
      })),
    };
  }
}
