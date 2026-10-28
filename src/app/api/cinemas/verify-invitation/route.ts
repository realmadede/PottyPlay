import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || !token.startsWith("cin_inv_")) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token." },
        { status: 400 }
      );
    }

    const invitation = await prisma.cinemaRegistrationInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found or invalid." },
        { status: 404 }
      );
    }

    if (invitation.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "This registration invitation has already been completed.",
          isUsed: true,
        },
        { status: 410 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "This registration invitation link has expired (48-hour limit exceeded).",
          isExpired: true,
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        organizationName: invitation.organizationName,
        contactName: invitation.contactName,
        contactEmail: invitation.contactEmail,
        contactPhone: invitation.contactPhone,
        city: invitation.city,
        country: invitation.country,
        screensCount: invitation.screensCount,
        ticketingSystem: invitation.ticketingSystem,
        screeningServer: invitation.screeningServer,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error verifying registration invitation." },
      { status: 500 }
    );
  }
}
