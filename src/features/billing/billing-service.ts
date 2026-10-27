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
   */
  static async recordActivationBilling(
    sessionId: string,
    cinemaId: string,
    ticketNumber: string,
    tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ) {
    const client = tx || prisma;

    // Check if already billed for this session
    const existing = await client.usageBillingEvent.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return existing;
    }

    return client.usageBillingEvent.create({
      data: {
        sessionId,
        cinemaId,
        ticketNumber,
        priceTzs: config.demoPricePerSessionTzs,
        qualifying: true,
        isSimulated: true,
        disclaimer:
          "Simulated commercial pricing model for cinema partner evaluation, not an agreed commercial rate",
      },
    });
  }

  /**
   * Returns the aggregate billing summary for the operator dashboard.
   */
  static async getBillingSummary(): Promise<BillingSummary> {
    const [totalCount, events] = await Promise.all([
      prisma.usageBillingEvent.count({
        where: { qualifying: true },
      }),
      prisma.usageBillingEvent.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          cinema: { select: { name: true } },
        },
      }),
    ]);

    const totalRevenue = totalCount * config.demoPricePerSessionTzs;

    return {
      totalBillableActivations: totalCount,
      totalEstimatedRevenueTzs: totalRevenue,
      pricePerSessionTzs: config.demoPricePerSessionTzs,
      disclaimer:
        "Simulated commercial pricing model for cinema partner evaluation, not an agreed commercial rate",
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
