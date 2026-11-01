import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOperator } from "@/lib/auth-guards";
import { z } from "zod";
import { ScreeningStatus } from "@prisma/client";

const createScreeningSchema = z.object({
  screenId: z.string().min(1, "Screen ID is required"),
  title: z.string().min(2, "Screening title is required"),
  contentAssetId: z.string().optional(),
  scheduledStart: z.string().datetime({ offset: true }).or(z.string().min(1)),
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

    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema ID is required." },
        { status: 400 }
      );
    }

    const screenings = await prisma.screening.findMany({
      where: { cinemaId: targetCinemaId },
      include: {
        screen: { select: { id: true, name: true, totalSeats: true } },
        contentAsset: true,
        _count: {
          select: {
            tickets: true,
            sessions: true,
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return NextResponse.json({
      success: true,
      screenings,
    });
  } catch (error: any) {
    console.error("[OPERATOR-SCREENINGS-GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load screenings." },
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

    const validated = createScreeningSchema.parse(body);

    const targetCinemaId = cinemaId;
    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Target cinema ID required." },
        { status: 400 }
      );
    }

    // Verify screen belongs to this cinema
    const screen = await prisma.screen.findFirst({
      where: { id: validated.screenId, cinemaId: targetCinemaId },
    });
    if (!screen) {
      return NextResponse.json(
        { success: false, error: "Screen does not exist or does not belong to this cinema circuit." },
        { status: 400 }
      );
    }

    const scheduledStartDate = new Date(validated.scheduledStart);
    if (Number.isNaN(scheduledStartDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid scheduled start time." },
        { status: 400 }
      );
    }

    // Content must already be licensed to THIS cinema for the screening time.
    // Operators can never create content assets or grant themselves rights; platform administration does.
    const licensedWindow = {
      cinemaId: targetCinemaId,
      isAuthorized: true,
      validFrom: { lte: scheduledStartDate },
      validUntil: { gte: scheduledStartDate },
    };

    let contentAssetId: string | undefined;
    if (validated.contentAssetId) {
      const authorization = await prisma.rightsAuthorization.findFirst({
        where: { ...licensedWindow, contentAssetId: validated.contentAssetId },
      });
      if (!authorization) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This cinema holds no valid content rights for the selected asset at the scheduled time.",
          },
          { status: 403 }
        );
      }
      contentAssetId = authorization.contentAssetId;
    } else {
      const authorization = await prisma.rightsAuthorization.findFirst({
        where: licensedWindow,
        orderBy: { createdAt: "desc" },
      });
      if (!authorization) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No licensed content is available for this cinema at the scheduled time. Contact platform administration to provision content rights.",
          },
          { status: 403 }
        );
      }
      contentAssetId = authorization.contentAssetId;
    }

    const screening = await prisma.screening.create({
      data: {
        cinemaId: targetCinemaId,
        screenId: validated.screenId,
        contentAssetId,
        title: validated.title.trim(),
        scheduledStart: scheduledStartDate,
        status: ScreeningStatus.SCHEDULED,
      },
      include: {
        screen: true,
        contentAsset: true,
      },
    });

    await prisma.auditEvent.create({
      data: {
        cinemaId: targetCinemaId,
        eventType: "SCREENING_SCHEDULED",
        entityType: "SCREENING",
        entityId: screening.id,
        actor: "OPERATOR",
        details: JSON.stringify({
          title: screening.title,
          screen: screen.name,
          scheduledStart: scheduledStartDate.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      screening,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }
    console.error("[OPERATOR-SCREENINGS-POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create screening." },
      { status: 500 }
    );
  }
}
