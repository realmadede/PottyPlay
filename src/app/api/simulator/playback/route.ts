import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ScreeningService } from "@/features/screenings/screening-service";
import { prisma } from "@/lib/db";
import { ScreeningStatus } from "@prisma/client";

const simulatorActionSchema = z.object({
  screeningId: z.string().min(1),
  action: z.enum([
    "pause",
    "resume",
    "seek",
    "simulate_delay",
    "simulate_sync_failure",
  ]),
  positionSeconds: z.number().min(0).optional(),
  delayMinutes: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = simulatorActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { screeningId, action, positionSeconds, delayMinutes } = parsed.data;

    let updatedState;

    switch (action) {
      case "pause":
        updatedState = await ScreeningService.pausePlayback(screeningId);
        break;

      case "resume":
        updatedState = await ScreeningService.resumePlayback(screeningId);
        break;

      case "seek":
        if (typeof positionSeconds !== "number") {
          return NextResponse.json(
            { error: "positionSeconds is required for seek action." },
            { status: 400 }
          );
        }
        updatedState = await ScreeningService.seekPlayback(
          screeningId,
          positionSeconds
        );
        break;

      case "simulate_delay": {
        const delay = (delayMinutes || 10) * 60 * 1000;
        const now = new Date();
        const newActualStart = new Date(now.getTime() - delay);
        await prisma.screening.update({
          where: { id: screeningId },
          data: {
            actualStart: newActualStart,
            playbackPositionSeconds: 60.0,
            lastPositionUpdatedAt: now,
            status: ScreeningStatus.PLAYING,
          },
        });
        await prisma.auditEvent.create({
          data: {
            eventType: "SIMULATOR_DELAY_APPLIED",
            entityType: "SCREENING",
            entityId: screeningId,
            actor: "SIMULATOR",
            details: JSON.stringify({ delayMinutes: delayMinutes || 10 }),
          },
        });
        updatedState = await ScreeningService.getAuthoritativePlaybackState(
          screeningId
        );
        break;
      }

      case "simulate_sync_failure": {
        await prisma.auditEvent.create({
          data: {
            eventType: "SIMULATED_SYNC_FAILURE",
            entityType: "SCREENING",
            entityId: screeningId,
            actor: "SIMULATOR",
            details: JSON.stringify({
              reason: "Synthetic network jitter and projection drift reproduction",
            }),
          },
        });
        const current = await ScreeningService.getAuthoritativePlaybackState(
          screeningId
        );
        return NextResponse.json({
          ...current,
          unreliableSync: true,
          canFollow: false,
          statusMessage:
            "Authoritative sync reproduction: Cinema projection clock connection interrupted.",
        });
      }
    }

    return NextResponse.json(updatedState);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
