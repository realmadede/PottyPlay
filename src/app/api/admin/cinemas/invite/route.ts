import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resendService } from "@/features/email/resend-service";
import { AdminAuthService } from "@/features/admin/admin-auth-service";
import { randomBytes } from "crypto";
import { z } from "zod";

const inviteSchema = z.object({
  applicationId: z.string().optional(),
  organizationName: z.string().min(2, "Organization name required"),
  contactName: z.string().min(2, "Contact name required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Tanzania"),
  screensCount: z.number().int().positive().default(1),
  ticketingSystem: z.string().default("Vista Cinema POS"),
  screeningServer: z.string().default("Dolby IMS3000 TMS"),
  expiresInHours: z.number().int().positive().default(48),
});

export async function POST(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("pp_admin_token")?.value;

    const isValid = token ? await AdminAuthService.validateSession(token) : false;
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized administrative access." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = inviteSchema.parse(body);

    const inviteToken = "cin_inv_" + randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);

    const invitation = await prisma.cinemaRegistrationInvitation.create({
      data: {
        token: inviteToken,
        organizationName: data.organizationName.trim(),
        contactName: data.contactName.trim(),
        contactEmail: data.contactEmail.trim().toLowerCase(),
        contactPhone: data.contactPhone?.trim() || null,
        city: data.city?.trim() || null,
        country: data.country.trim(),
        screensCount: data.screensCount,
        ticketingSystem: data.ticketingSystem,
        screeningServer: data.screeningServer,
        expiresAt,
      },
    });

    if (data.applicationId) {
      await prisma.partnerApplication.update({
        where: { id: data.applicationId },
        data: {
          status: "INVITATION_SENT",
          reviewedAt: new Date(),
          reviewedBy: "SUPERADMIN",
        },
      });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const inviteUrl = `${protocol}://${host}/register/cinema?token=${inviteToken}`;

    // Dispatch official email notification via Resend
    await resendService.sendCinemaInvitation({
      to: data.contactEmail,
      organizationName: data.organizationName,
      inviteUrl,
      expiresInHours: data.expiresInHours,
      expiresAt,
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        eventType: "CINEMA_INVITATION_DISPATCHED",
        entityType: "CINEMA_INVITATION",
        entityId: invitation.id,
        actor: "PLATFORM_ADMIN",
        details: JSON.stringify({
          organization: data.organizationName,
          email: data.contactEmail,
          expiresAt: expiresAt.toISOString(),
          inviteUrl,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      token: inviteToken,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
      message: `Registration invitation dispatched to ${data.contactEmail}. Link expires in ${data.expiresInHours} hours.`,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message || "Validation error." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Error generating invitation.",
      },
      { status: 500 }
    );
  }
}
