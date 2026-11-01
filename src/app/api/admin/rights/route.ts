import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

const newAssetSchema = z.object({
  title: z.string().trim().min(2),
  durationSeconds: z.number().int().positive(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  licenseType: z.string().trim().min(2),
  licenseSource: z.string().trim().min(2),
});

const grantSchema = z
  .object({
    cinemaId: z.string().min(1),
    contentAssetId: z.string().min(1).optional(),
    asset: newAssetSchema.optional(),
    validFrom: z.string().datetime({ offset: true }),
    validUntil: z.string().datetime({ offset: true }),
    maxSessionDurationSeconds: z.number().int().min(60).max(900).default(900),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((d) => Boolean(d.contentAssetId) !== Boolean(d.asset), {
    message: "Provide exactly one of contentAssetId or asset.",
  });

/**
 * Platform administration: lists content rights, optionally for a single cinema.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const cinemaId = req.nextUrl.searchParams.get("cinemaId");
  const rights = await prisma.rightsAuthorization.findMany({
    where: cinemaId ? { cinemaId } : {},
    include: { contentAsset: { select: { id: true, title: true, licenseType: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ success: true, rights });
}

/**
 * Platform administration: grants a cinema rights to a content asset.
 * This is the only way content rights are created; operators cannot grant themselves rights.
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.response;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Malformed JSON body." }, { status: 400 });
    }

    const parsed = grantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);
    if (validUntil <= validFrom) {
      return NextResponse.json(
        { success: false, error: "validUntil must be after validFrom." },
        { status: 400 }
      );
    }

    const cinema = await prisma.cinema.findUnique({ where: { id: data.cinemaId } });
    if (!cinema) {
      return NextResponse.json({ success: false, error: "Cinema not found." }, { status: 404 });
    }

    if (data.contentAssetId) {
      const existing = await prisma.contentAsset.findUnique({ where: { id: data.contentAssetId } });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Content asset not found." },
          { status: 404 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const contentAssetId =
        data.contentAssetId ?? (await tx.contentAsset.create({ data: data.asset! })).id;

      const authorization = await tx.rightsAuthorization.create({
        data: {
          cinemaId: data.cinemaId,
          contentAssetId,
          isAuthorized: true,
          validFrom,
          validUntil,
          maxSessionDurationSeconds: data.maxSessionDurationSeconds,
          notes: data.notes || null,
        },
      });

      await tx.auditEvent.create({
        data: {
          cinemaId: data.cinemaId,
          eventType: "CONTENT_RIGHTS_GRANTED",
          entityType: "RIGHTS_AUTHORIZATION",
          entityId: authorization.id,
          actor: "PLATFORM_ADMIN",
          details: JSON.stringify({
            contentAssetId,
            validFrom: validFrom.toISOString(),
            validUntil: validUntil.toISOString(),
            maxSessionDurationSeconds: data.maxSessionDurationSeconds,
          }),
        },
      });

      return authorization;
    });

    return NextResponse.json({ success: true, authorization: result }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN-RIGHTS] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to grant content rights." }, { status: 500 });
  }
}
