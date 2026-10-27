import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const pricingSchema = z.object({
  cinemaId: z.string().min(1, "Cinema ID is required"),
  currency: z.string().default("TZS"),
  pricePerSession: z.number().int().nonnegative("Price must be 0 or positive"),
  status: z.enum(["ACTIVE", "PENDING_AGREEMENT", "DEPRECATED"]).default("ACTIVE"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cinemaId = searchParams.get("cinemaId") || req.headers.get("x-cinema-id");

    if (!cinemaId) {
      return NextResponse.json({ success: false, error: "Cinema ID is required." }, { status: 400 });
    }

    const rules = await prisma.cinemaPricingRule.findMany({
      where: { cinemaId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      pricingRules: rules,
    });
  } catch (error) {
    console.error("Failed to load pricing rules:", error);
    return NextResponse.json({ success: false, error: "Failed to load pricing rules." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = pricingSchema.parse(body);

    // Verify cinema exists
    const cinema = await prisma.cinema.findUnique({
      where: { id: validated.cinemaId },
    });
    if (!cinema) {
      return NextResponse.json({ success: false, error: "Cinema not found." }, { status: 404 });
    }

    // If new rule is ACTIVE, deprecate older active rules
    if (validated.status === "ACTIVE") {
      await prisma.cinemaPricingRule.updateMany({
        where: { cinemaId: validated.cinemaId, status: "ACTIVE" },
        data: { status: "DEPRECATED", effectiveUntil: new Date() },
      });
    }

    const newRule = await prisma.cinemaPricingRule.create({
      data: {
        cinemaId: validated.cinemaId,
        currency: validated.currency,
        pricePerSession: validated.pricePerSession,
        status: validated.status,
        notes: validated.notes?.trim() || null,
        effectiveFrom: new Date(),
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        cinemaId: validated.cinemaId,
        eventType: "PRICING_RULE_CONFIGURED",
        entityType: "CINEMA_PRICING",
        entityId: newRule.id,
        actor: "CINEMA_ADMINISTRATOR",
        details: JSON.stringify({
          price: validated.pricePerSession,
          currency: validated.currency,
          status: validated.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      rule: newRule,
      message: "Cinema commercial pricing rule created successfully.",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Failed to create pricing rule:", error);
    return NextResponse.json({ success: false, error: "Failed to configure pricing." }, { status: 500 });
  }
}
