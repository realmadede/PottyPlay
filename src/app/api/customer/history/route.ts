import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

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

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 30);

    // Query genuine sessions belonging to this customer (by customerId or phoneNumber)
    const sessions = await prisma.breakSession.findMany({
      where: {
        OR: [
          { customerId: customerSession.customerId },
          ...(customerSession.phoneNumber ? [{ phoneNumber: customerSession.phoneNumber }] : []),
        ],
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { startedAt: "desc" },
      include: {
        ticket: { select: { ticketNumber: true, seatNumber: true } },
        screening: {
          select: {
            id: true,
            title: true,
            cinema: { select: { name: true, location: true } },
            screen: { select: { name: true } },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = sessions;
    if (sessions.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    const formatted = items.map((s) => {
      const duration = s.endedAt
        ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
        : Math.round((new Date(s.expiresAt).getTime() - new Date(s.startedAt).getTime()) / 1000);

      return {
        id: s.id,
        sessionToken: s.sessionToken,
        cinemaName: s.screening.cinema.name,
        screeningTitle: s.screening.title,
        screenName: s.screening.screen.name,
        ticketNumber: s.ticket.ticketNumber,
        seatNumber: s.ticket.seatNumber,
        breakNumber: s.breakNumber,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationSeconds: duration,
        status: s.status,
        revokedReason: s.revokedReason,
      };
    });

    return NextResponse.json({
      success: true,
      history: formatted,
      nextCursor,
    });
  } catch (error) {
    console.error("Failed to fetch customer history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load viewing history." },
      { status: 500 }
    );
  }
}
