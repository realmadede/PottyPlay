import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOperator } from "@/lib/auth-guards";

const createAssetSchema = z.object({
  title: z.string().trim().min(2, "Film title must be at least 2 characters"),
  durationMinutes: z.number().positive("Duration must be positive").optional(),
  durationSeconds: z.number().int().positive("Duration must be positive").optional(),
  videoUrl: z.string().trim().min(3, "Stream URL is required"),
  thumbnailUrl: z.string().trim().optional(),
  licenseType: z.string().trim().min(2).default("COMMERCIAL_EXHIBITION_RIGHTS"),
  licenseSource: z.string().trim().min(2).default("Theatrical Distributor"),
  validFrom: z.string().datetime({ offset: true }).optional(),
  validUntil: z.string().datetime({ offset: true }).optional(),
  maxSessionDurationSeconds: z.number().int().min(60).max(900).default(900),
  notes: z.string().trim().optional(),
}).refine((data) => data.durationMinutes !== undefined || data.durationSeconds !== undefined, {
  message: "Either durationMinutes or durationSeconds is required",
});

/**
 * Lists all content assets and associated rights authorizations for the operator's cinema.
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await requireOperator(req);
    if (!guard.ok) return guard.response;

    const cinemaId = guard.ctx.cinemaId;
    if (!cinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema ID is required." },
        { status: 400 }
      );
    }

    const authorizations = await prisma.rightsAuthorization.findMany({
      where: { cinemaId },
      include: {
        contentAsset: {
          include: {
            _count: {
              select: {
                screenings: {
                  where: { cinemaId },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const assets = authorizations.map((auth) => ({
      id: auth.contentAsset.id,
      authorizationId: auth.id,
      title: auth.contentAsset.title,
      durationSeconds: auth.contentAsset.durationSeconds,
      durationMinutes: Math.round(auth.contentAsset.durationSeconds / 60),
      videoUrl: auth.contentAsset.videoUrl,
      thumbnailUrl: auth.contentAsset.thumbnailUrl,
      licenseType: auth.contentAsset.licenseType,
      licenseSource: auth.contentAsset.licenseSource,
      isAuthorized: auth.isAuthorized,
      validFrom: auth.validFrom.toISOString(),
      validUntil: auth.validUntil.toISOString(),
      maxSessionDurationSeconds: auth.maxSessionDurationSeconds,
      notes: auth.notes,
      screeningsCount: auth.contentAsset._count.screenings,
      createdAt: auth.contentAsset.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("[OPERATOR-ASSETS-GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load content assets." },
      { status: 500 }
    );
  }
}

/**
 * Registers a new content asset and provisions a rights authorization for the operator's cinema.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON body." },
        { status: 400 }
      );
    }

    const validated = createAssetSchema.parse(body);

    const guard = await requireOperator(req, {
      roles: ["ADMIN", "MANAGER"],
    });
    if (!guard.ok) return guard.response;

    const targetCinemaId = guard.ctx.cinemaId;
    if (!targetCinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema ID is required." },
        { status: 400 }
      );
    }

    const durationSeconds =
      validated.durationSeconds ??
      Math.round((validated.durationMinutes || 0) * 60);

    const now = new Date();
    const validFrom = validated.validFrom ? new Date(validated.validFrom) : now;
    const validUntil = validated.validUntil
      ? new Date(validated.validUntil)
      : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

    if (validUntil <= validFrom) {
      return NextResponse.json(
        { success: false, error: "License end date must be after start date." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.contentAsset.create({
        data: {
          title: validated.title.trim(),
          durationSeconds,
          videoUrl: validated.videoUrl.trim(),
          thumbnailUrl: validated.thumbnailUrl?.trim() || null,
          licenseType: validated.licenseType.trim(),
          licenseSource: validated.licenseSource.trim(),
        },
      });

      const authorization = await tx.rightsAuthorization.create({
        data: {
          cinemaId: targetCinemaId,
          contentAssetId: asset.id,
          isAuthorized: true,
          validFrom,
          validUntil,
          maxSessionDurationSeconds: validated.maxSessionDurationSeconds || 900,
          notes: validated.notes?.trim() || `Asset uploaded by cinema operator.`,
        },
      });

      await tx.auditEvent.create({
        data: {
          cinemaId: targetCinemaId,
          eventType: "OPERATOR_CONTENT_ASSET_REGISTERED",
          entityType: "CONTENT_ASSET",
          entityId: asset.id,
          actor: "OPERATOR",
          details: JSON.stringify({
            title: asset.title,
            durationSeconds,
            licenseType: asset.licenseType,
            licenseSource: asset.licenseSource,
            authorizationId: authorization.id,
          }),
        },
      });

      return { asset, authorization };
    });

    return NextResponse.json(
      {
        success: true,
        asset: result.asset,
        authorization: result.authorization,
        message: "Content asset registered and rights authorization provisioned.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }
    console.error("[OPERATOR-ASSETS-POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register content asset." },
      { status: 500 }
    );
  }
}
