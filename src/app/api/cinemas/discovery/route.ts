import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    // Only return genuinely registered and APPROVED cinemas
    const cinemas = await prisma.cinema.findMany({
      where: {
        status: "APPROVED",
      },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "asc" },
      include: {
        screens: {
          select: {
            id: true,
            name: true,
            totalSeats: true,
          },
        },
        screenings: {
          where: {
            status: { in: ["PLAYING", "SCHEDULED"] },
          },
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStart: true,
            actualStart: true,
            contentAsset: {
              select: {
                title: true,
                durationSeconds: true,
              },
            },
          },
          take: 3,
        },
      },
    });

    let nextCursor: string | null = null;
    let items = cinemas;
    if (cinemas.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    const formatted = items.map((cinema) => ({
      id: cinema.id,
      name: cinema.name,
      location: cinema.location,
      timezone: cinema.timezone,
      status: cinema.status,
      screensCount: cinema.screens.length,
      screens: cinema.screens,
      activeScreenings: cinema.screenings.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        scheduledStart: s.scheduledStart,
        durationMinutes: Math.round(s.contentAsset.durationSeconds / 60),
      })),
      supportedFeatures: [
        "15-Minute Synchronized Companion Break",
        "Authoritative Dolby Atmos Timeline Lock",
        "Ticket-Linked Advance Screening Reminders",
        "Direct In-App One-Tap Bathroom Mode",
      ],
    }));

    return NextResponse.json({
      success: true,
      cinemas: formatted,
      nextCursor,
    });
  } catch (error) {
    console.error("Failed to discover cinemas:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load cinema discovery list." },
      { status: 500 }
    );
  }
}
