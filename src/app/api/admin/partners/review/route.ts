import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  applicationId: z.string().min(1, "Application ID required"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("pp_admin_token")?.value;

    if (!token || !token.startsWith("adm_")) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, decision, reviewNotes } = reviewSchema.parse(body);

    const application = await prisma.partnerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Partner application not found." }, { status: 404 });
    }

    if (decision === "APPROVED") {
      // 1. Create Cinema record
      const cinema = await prisma.cinema.create({
        data: {
          name: application.organizationName,
          location: `${application.city}, ${application.country}`,
          status: "APPROVED",
          organizationName: application.organizationName,
          contactEmail: application.contactEmail,
          contactPhone: application.contactPhone,
          ticketingSystem: application.ticketingSystem,
          screeningSystem: application.screeningServer,
        },
      });

      // 2. Create default screen
      await prisma.screen.create({
        data: {
          cinemaId: cinema.id,
          name: "Main Auditorium Screen 1",
          totalSeats: 120,
        },
      });

      // 3. Create initial pricing rule
      await prisma.cinemaPricingRule.create({
        data: {
          cinemaId: cinema.id,
          currency: "TZS",
          pricePerSession: 500,
          status: "ACTIVE",
          notes: "Initial standard commercial tier provisioned upon partner approval.",
        },
      });

      // 4. Update application status
      await prisma.partnerApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewNotes: reviewNotes?.trim() || null,
          reviewedAt: new Date(),
          reviewedBy: "SUPERADMIN",
        },
      });

      // 5. Audit event
      await prisma.auditEvent.create({
        data: {
          cinemaId: cinema.id,
          eventType: "PARTNER_APPLICATION_APPROVED",
          entityType: "CINEMA",
          entityId: cinema.id,
          actor: "PLATFORM_ADMIN",
          details: JSON.stringify({
            applicationId,
            organization: application.organizationName,
            provisionedCinemaId: cinema.id,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        decision: "APPROVED",
        provisionedCinemaId: cinema.id,
        message: "Cinema approved and operational workspace provisioned.",
      });
    } else {
      // REJECTED
      await prisma.partnerApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          reviewNotes: reviewNotes?.trim() || "Application declined during administrative review.",
          reviewedAt: new Date(),
          reviewedBy: "SUPERADMIN",
        },
      });

      await prisma.auditEvent.create({
        data: {
          eventType: "PARTNER_APPLICATION_REJECTED",
          entityType: "PARTNER_APPLICATION",
          entityId: applicationId,
          actor: "PLATFORM_ADMIN",
          details: JSON.stringify({
            organization: application.organizationName,
            reason: reviewNotes,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        decision: "REJECTED",
        message: "Application rejected.",
      });
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Partner review error:", error);
    return NextResponse.json({ success: false, error: "Review processing failed." }, { status: 500 });
  }
}
