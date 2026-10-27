import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ScreeningService } from "@/features/screenings/screening-service";

export async function GET(req: NextRequest) {
  try {
    const screeningId =
      req.nextUrl.searchParams.get("screeningId") || "screening_prime_01";

    let state = await ScreeningService.getAuthoritativePlaybackState(screeningId);

    // Fallback to first playing screening if default not found
    if (!state) {
      const firstScreening = await prisma.screening.findFirst({
        orderBy: { scheduledStart: "asc" },
      });
      if (firstScreening) {
        state = await ScreeningService.getAuthoritativePlaybackState(firstScreening.id);
      }
    }

    if (!state) {
      return NextResponse.json(
        { error: "No demonstration screening found." },
        { status: 404 }
      );
    }

    return NextResponse.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
