import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOperator, maskToken } from "@/lib/auth-guards";
import { randomBytes } from "crypto";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";

const createTicketSchema = z.object({
  screeningId: z.string().min(1, "Screening ID is required"),
  seatNumber: z.string().min(1, "Seat number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  ticketNumber: z.string().optional(),
  claimToken: z.string().optional(),
});

async function getAuthorizedCinemaId(
  req: NextRequest,
  requestedCinemaId?: string | null
): Promise<{ cinemaId: string | null; errorResponse?: NextResponse }> {
  const guard = await requireOperator(req, { requestedCinemaId });
  if (!guard.ok) {
    return { cinemaId: null, errorResponse: guard.response };
  }
  return { cinemaId: guard.ctx.cinemaId };
}

export async function GET(req: NextRequest) {
  try {
    const { cinemaId, errorResponse } = await getAuthorizedCinemaId(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const targetCinemaId = cinemaId || searchParams.get("cinemaId");
    const screeningId = searchParams.get("screeningId");
    const search = searchParams.get("search");

    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema ID is required." },
        { status: 400 }
      );
    }

    const whereClause: any = {
      screening: {
        cinemaId: targetCinemaId,
      },
    };

    if (screeningId) {
      whereClause.screeningId = screeningId;
    }

    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { seatNumber: { contains: search, mode: "insensitive" } },
        { claimToken: { contains: search, mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.demonstrationTicket.findMany({
      where: whereClause,
      include: {
        screening: {
          select: {
            id: true,
            title: true,
            scheduledStart: true,
            status: true,
            screen: { select: { id: true, name: true } },
          },
        },
        breakSessions: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            expiresAt: true,
          },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error: any) {
    console.error("[OPERATOR-TICKETS-GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load tickets." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cinemaId, errorResponse } = await getAuthorizedCinemaId(
      req,
      typeof body?.cinemaId === "string" ? body.cinemaId : null
    );
    if (errorResponse) return errorResponse;

    const validated = createTicketSchema.parse(body);

    const targetCinemaId = cinemaId;
    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Target cinema ID required." },
        { status: 400 }
      );
    }

    // Verify screening exists and belongs to cinema
    const screening = await prisma.screening.findFirst({
      where: {
        id: validated.screeningId,
        cinemaId: targetCinemaId,
      },
      include: { screen: true, cinema: true },
    });

    if (!screening) {
      return NextResponse.json(
        { success: false, error: "Screening not found or not authorized for this cinema circuit." },
        { status: 404 }
      );
    }

    const ticketNumber =
      validated.ticketNumber?.trim().toUpperCase() ||
      `PP-TK-${Math.floor(100000 + Math.random() * 900000)}`;

    const claimToken =
      validated.claimToken?.trim().toUpperCase() ||
      `CLM-${randomBytes(8).toString("hex").toUpperCase()}`;

    const ticket = await prisma.demonstrationTicket.create({
      data: {
        screeningId: screening.id,
        seatNumber: validated.seatNumber.trim().toUpperCase(),
        customerName: validated.customerName.trim(),
        ticketNumber,
        claimToken,
        status: TicketStatus.VALID_ADMITTED,
        maxBreaks: 2,
      },
      include: {
        screening: {
          select: {
            id: true,
            title: true,
            screen: { select: { name: true } },
          },
        },
      },
    });

    await prisma.auditEvent.create({
      data: {
        cinemaId: screening.cinemaId,
        eventType: "TICKET_ISSUED",
        entityType: "TICKET",
        entityId: ticket.id,
        actor: "OPERATOR",
        details: JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.customerName,
          seatNumber: ticket.seatNumber,
          claimToken: maskToken(ticket.claimToken),
          screeningTitle: screening.title,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      ticket,
      watchClaimUrl: `/watch?claim=${encodeURIComponent(ticket.claimToken || "")}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Invalid ticket payload." },
        { status: 400 }
      );
    }
    console.error("[OPERATOR-TICKETS-POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create demonstration ticket." },
      { status: 500 }
    );
  }
}
