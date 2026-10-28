import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";

const createTicketSchema = z.object({
  screeningId: z.string().min(1, "Screening ID is required"),
  seatNumber: z.string().min(1, "Seat number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  ticketNumber: z.string().optional(),
  claimToken: z.string().optional(),
});

async function getAuthorizedCinemaId(req: NextRequest): Promise<{ cinemaId: string | null; errorResponse?: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("pp_operator_token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) {
    return {
      cinemaId: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized operator access." },
        { status: 401 }
      ),
    };
  }

  const session = await OperatorAuthService.verifySession(token);
  const isAdmin = token.startsWith("adm_");

  if (session) {
    return { cinemaId: session.cinemaId };
  } else if (isAdmin) {
    const { searchParams } = new URL(req.url);
    const requestedCinemaId = searchParams.get("cinemaId") || req.headers.get("x-cinema-id");
    return { cinemaId: requestedCinemaId };
  }

  return {
    cinemaId: null,
    errorResponse: NextResponse.json(
      { success: false, error: "Invalid or expired operator session." },
      { status: 401 }
    ),
  };
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
    const { cinemaId, errorResponse } = await getAuthorizedCinemaId(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validated = createTicketSchema.parse(body);

    const targetCinemaId = cinemaId || body.cinemaId;

    // Verify screening exists and belongs to cinema
    const screening = await prisma.screening.findFirst({
      where: {
        id: validated.screeningId,
        ...(targetCinemaId ? { cinemaId: targetCinemaId } : {}),
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
      `CLM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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
          claimToken: ticket.claimToken,
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
