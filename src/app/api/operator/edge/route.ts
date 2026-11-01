import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOperator } from "@/lib/auth-guards";

const edgeConfigSchema = z.object({
  cinemaId: z.string().optional(),
  edgeStreamingEnabled: z.boolean(),
  edgeServerUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  venueWifiSsid: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  lanIpSubnets: z.string().trim().max(250).optional().nullable().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  try {
    const guard = await requireOperator(req);
    if (!guard.ok) return guard.response;

    let targetCinemaId = guard.ctx.cinemaId;
    if (guard.ctx.kind === "admin") {
      const requestedId = req.nextUrl.searchParams.get("cinemaId");
      if (requestedId) {
        targetCinemaId = requestedId;
      }
    }

    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema identifier is required." },
        { status: 400 }
      );
    }

    const cinema = await prisma.cinema.findUnique({
      where: { id: targetCinemaId },
      select: {
        id: true,
        name: true,
        edgeStreamingEnabled: true,
        edgeServerUrl: true,
        venueWifiSsid: true,
        lanIpSubnets: true,
      },
    });

    if (!cinema) {
      return NextResponse.json(
        { success: false, error: "Cinema not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cinema,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireOperator(req);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const parsed = edgeConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid configuration parameters.",
        },
        { status: 400 }
      );
    }

    const { edgeStreamingEnabled, edgeServerUrl, venueWifiSsid, lanIpSubnets } = parsed.data;

    let targetCinemaId = guard.ctx.cinemaId;
    if (guard.ctx.kind === "admin" && parsed.data.cinemaId) {
      targetCinemaId = parsed.data.cinemaId;
    }

    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema identifier is required." },
        { status: 400 }
      );
    }

    // Verify cinema exists
    const existingCinema = await prisma.cinema.findUnique({
      where: { id: targetCinemaId },
      select: { id: true, name: true },
    });

    if (!existingCinema) {
      return NextResponse.json(
        { success: false, error: "Cinema not found." },
        { status: 404 }
      );
    }

    // Clean empty string inputs to null
    const sanitizedServerUrl = edgeServerUrl && edgeServerUrl.trim() !== "" ? edgeServerUrl.trim() : null;
    const sanitizedWifiSsid = venueWifiSsid && venueWifiSsid.trim() !== "" ? venueWifiSsid.trim() : null;
    const sanitizedSubnets = lanIpSubnets && lanIpSubnets.trim() !== "" ? lanIpSubnets.trim() : null;

    const updatedCinema = await prisma.cinema.update({
      where: { id: targetCinemaId },
      data: {
        edgeStreamingEnabled,
        edgeServerUrl: sanitizedServerUrl,
        venueWifiSsid: sanitizedWifiSsid,
        lanIpSubnets: sanitizedSubnets,
      },
      select: {
        id: true,
        name: true,
        edgeStreamingEnabled: true,
        edgeServerUrl: true,
        venueWifiSsid: true,
        lanIpSubnets: true,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        cinemaId: targetCinemaId,
        eventType: "CINEMA_EDGE_CONFIG_UPDATED",
        entityType: "CINEMA",
        entityId: targetCinemaId,
        actor: guard.ctx.kind === "admin" ? "PLATFORM_ADMIN" : "OPERATOR",
        details: JSON.stringify({
          edgeStreamingEnabled,
          edgeServerUrl: sanitizedServerUrl,
          venueWifiSsid: sanitizedWifiSsid,
          lanIpSubnets: sanitizedSubnets,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      cinema: updatedCinema,
      message: "In-Auditorium local edge streaming configuration saved successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
