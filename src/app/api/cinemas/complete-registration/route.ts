import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { z } from "zod";

const completeSchema = z.object({
  token: z.string().min(1, "Invitation token required"),
  venueLocation: z.string().min(2, "Venue location required"),
  contactPhone: z.string().min(6, "Contact phone required"),
  ticketingSystem: z.string().default("Vista Cinema POS"),
  screeningSystem: z.string().default("Dolby IMS3000 TMS"),
  screenName: z.string().default("Main Auditorium Screen 1"),
  totalSeats: z.number().int().positive().default(120),
  managerName: z.string().min(2, "Manager full name required"),
  managerPassword: z.string().min(8, "Security password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = completeSchema.parse(body);

    const invitation = await prisma.cinemaRegistrationInvitation.findUnique({
      where: { token: data.token },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found." },
        { status: 404 }
      );
    }

    if (invitation.isUsed) {
      return NextResponse.json(
        { success: false, error: "This invitation has already been completed." },
        { status: 410 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Invitation link has expired." },
        { status: 410 }
      );
    }

    const cleanEmail = invitation.contactEmail.toLowerCase().trim();

    // Check if operator account already exists
    const existingOp = await prisma.operatorUser.findUnique({
      where: { email: cleanEmail },
    });

    if (existingOp) {
      return NextResponse.json(
        { success: false, error: "An operator account with this email already exists." },
        { status: 400 }
      );
    }

    // 1. Create Cinema
    const cinema = await prisma.cinema.create({
      data: {
        name: invitation.organizationName.trim(),
        location: data.venueLocation.trim(),
        status: "APPROVED",
        organizationName: invitation.organizationName.trim(),
        contactEmail: cleanEmail,
        contactPhone: data.contactPhone.trim(),
        ticketingSystem: data.ticketingSystem,
        screeningSystem: data.screeningSystem,
      },
    });

    // 2. Create primary screen
    const screen = await prisma.screen.create({
      data: {
        cinemaId: cinema.id,
        name: data.screenName.trim(),
        totalSeats: data.totalSeats,
      },
    });

    // 3. Create active pricing rule
    await prisma.cinemaPricingRule.create({
      data: {
        cinemaId: cinema.id,
        currency: "TZS",
        pricePerSession: 500,
        status: "ACTIVE",
        notes: "Agreed platform commercial pricing provisioned upon invitation registration.",
      },
    });

    // 4. Create Manager OperatorUser
    const operator = await prisma.operatorUser.create({
      data: {
        cinemaId: cinema.id,
        email: cleanEmail,
        name: data.managerName.trim(),
        passwordHash: hashPassword(data.managerPassword),
        role: "MANAGER",
        isActive: true,
      },
    });

    // 5. Mark invitation used
    await prisma.cinemaRegistrationInvitation.update({
      where: { id: invitation.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        cinemaId: cinema.id,
      },
    });

    // 6. Audit event
    await prisma.auditEvent.create({
      data: {
        cinemaId: cinema.id,
        eventType: "CINEMA_REGISTERED_VIA_INVITATION",
        entityType: "CINEMA",
        entityId: cinema.id,
        actor: cleanEmail,
        details: JSON.stringify({
          invitationId: invitation.id,
          cinemaName: cinema.name,
          screenId: screen.id,
          operatorId: operator.id,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      cinema: {
        id: cinema.id,
        name: cinema.name,
      },
      message: "Cinema circuit registered successfully. You may now sign in to your operator workspace.",
      redirectUrl: "/operator",
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
        error: err instanceof Error ? err.message : "Error completing registration.",
      },
      { status: 500 }
    );
  }
}
