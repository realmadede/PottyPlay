import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ScreeningService } from "@/features/screenings/screening-service";
import { prisma } from "@/lib/db";
import { ScreeningStatus } from "@prisma/client";

const simulatorActionSchema = z.object({
  screeningId: z.string().optional(),
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedScreeningId = searchParams.get("screeningId");

    let screening = null;
    if (requestedScreeningId) {
      screening = await prisma.screening.findUnique({
        where: { id: requestedScreeningId },
      });
    }

    if (!screening) {
      // Find currently playing or scheduled screening, or first screening
      screening = await prisma.screening.findFirst({
        where: {
          status: { in: [ScreeningStatus.PLAYING, ScreeningStatus.PAUSED, ScreeningStatus.SCHEDULED] },
        },
        orderBy: { scheduledStart: "asc" },
      });

      if (!screening) {
        screening = await prisma.screening.findFirst({
          orderBy: { scheduledStart: "asc" },
        });
      }
    }

    if (!screening) {
      return NextResponse.json({
        success: true,
        playback: null,
        activeViewers: [],
        message: "No active auditorium screening found.",
      });
    }

    const state = await ScreeningService.getAuthoritativePlaybackState(screening.id);

    // Fetch active viewers currently synchronized with this screening
    const now = new Date();
    const activeSessions = await prisma.breakSession.findMany({
      where: {
        screeningId: screening.id,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      include: {
        ticket: {
          select: {
            seatNumber: true,
            customerName: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const activeViewers = activeSessions.map((s) => ({
      id: s.id,
      seatNumber: s.ticket.seatNumber,
      customerName: s.ticket.customerName,
      phoneNumber: s.phoneNumber || "",
      startedAt: s.startedAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      status: s.status,
    }));

    return NextResponse.json({
      success: true,
      playback: state,
      activeViewers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    let targetScreeningId = parsed.data.screeningId;
    if (!targetScreeningId) {
      const activeScreening = await prisma.screening.findFirst({
        orderBy: { scheduledStart: "asc" },
      });
      targetScreeningId = activeScreening?.id;
    }

    if (!targetScreeningId) {
      return NextResponse.json(
        { error: "No demonstration screening available to control." },
        { status: 404 }
      );
    }

    const { action, positionSeconds, delayMinutes } = parsed.data;

    let updatedState;

    switch (action) {
      case "pause":
        updatedState = await ScreeningService.pausePlayback(targetScreeningId);
        break;

      case "resume":
        updatedState = await ScreeningService.resumePlayback(targetScreeningId);
        break;

      case "seek":
        if (typeof positionSeconds !== "number") {
          return NextResponse.json(
            { error: "positionSeconds is required for seek action." },
            { status: 400 }
          );
        }
        updatedState = await ScreeningService.seekPlayback(
          targetScreeningId,
          positionSeconds
        );
        break;

      case "simulate_delay": {
        const delay = (delayMinutes || 10) * 60 * 1000;
        const now = new Date();
        const newActualStart = new Date(now.getTime() - delay);
        await prisma.screening.update({
          where: { id: targetScreeningId },
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
            entityId: targetScreeningId,
            actor: "SIMULATOR",
            details: JSON.stringify({ delayMinutes: delayMinutes || 10 }),
          },
        });
        updatedState = await ScreeningService.getAuthoritativePlaybackState(
          targetScreeningId
        );
        break;
      }

      case "simulate_sync_failure": {
        await prisma.auditEvent.create({
          data: {
            eventType: "SIMULATED_SYNC_FAILURE",
            entityType: "SCREENING",
            entityId: targetScreeningId,
            actor: "SIMULATOR",
            details: JSON.stringify({
              reason: "Synthetic network jitter and projection drift reproduction",
            }),
          },
        });
        const current = await ScreeningService.getAuthoritativePlaybackState(
          targetScreeningId
        );
        return NextResponse.json({
          ...current,
          playback: current,
          unreliableSync: true,
          canFollow: false,
          statusMessage:
            "Authoritative sync reproduction: Cinema projection clock connection interrupted.",
        });
      }
    }

    return NextResponse.json({
      ...updatedState,
      playback: updatedState,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
