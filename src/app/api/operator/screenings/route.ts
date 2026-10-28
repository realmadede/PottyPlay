import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";
import { z } from "zod";
import { ScreeningStatus } from "@prisma/client";

const createScreeningSchema = z.object({
  screenId: z.string().min(1, "Screen ID is required"),
  title: z.string().min(2, "Screening title is required"),
  contentAssetId: z.string().optional(),
  scheduledStart: z.string().datetime({ offset: true }).or(z.string().min(1)),
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
    const { cinemaId, errorResponse } = await getAuthorizedCinemaId(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validated = createScreeningSchema.parse(body);

    const targetCinemaId = cinemaId || body.cinemaId;
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

    // Resolve or create Content Asset
    let contentAssetId = validated.contentAssetId;
    if (!contentAssetId) {
      // Find existing asset or create a default demo content asset
      const defaultAsset = await prisma.contentAsset.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (defaultAsset) {
        contentAssetId = defaultAsset.id;
      } else {
        const createdAsset = await prisma.contentAsset.create({
          data: {
            title: validated.title,
            durationSeconds: 7200, // 2 hours standard duration
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            licenseType: "COMMERCIAL_EXHIBITION_RIGHTS",
            licenseSource: "Synthesized Demo Media Rights",
          },
        });
        contentAssetId = createdAsset.id;
      }
    }

    // Ensure rights authorization exists for this content asset and cinema
    const existingRights = await prisma.rightsAuthorization.findFirst({
      where: {
        cinemaId: targetCinemaId,
        contentAssetId,
      },
    });

    if (!existingRights) {
      await prisma.rightsAuthorization.create({
        data: {
          cinemaId: targetCinemaId,
          contentAssetId,
          isAuthorized: true,
          validFrom: new Date(Date.now() - 24 * 3600 * 1000),
          validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
          maxSessionDurationSeconds: 900,
          notes: "Automated rights authorization provisioned for cinema exhibitor",
        },
      });
    }

    const scheduledStartDate = new Date(validated.scheduledStart);

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
