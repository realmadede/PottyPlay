import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { z } from "zod";

const registerCinemaSchema = z.object({
  name: z.string().min(2, "Cinema name must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  contactEmail: z.string().email("Valid cinema contact email required"),
  contactPhone: z.string().min(6, "Valid contact telephone required"),
  ticketingSystem: z.string().default("Vista Cinema POS"),
  screeningSystem: z.string().default("Dolby IMS3000 TMS"),
  screenName: z.string().default("Main Auditorium Screen 1"),
  totalSeats: z.number().int().positive().default(120),
  managerName: z.string().min(2, "Manager name required"),
  managerEmail: z.string().email("Valid manager login email required"),
  managerPassword: z.string().min(8, "Manager password must be at least 8 characters"),
  pricePerSession: z.number().int().nonnegative().default(500),
});

export async function POST(req: NextRequest) {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies.get("pp_admin_token")?.value;

    if (!token || !token.startsWith("adm_")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized administrative access." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = registerCinemaSchema.parse(body);

    // Verify manager email is not already taken
    const existingOp = await prisma.operatorUser.findUnique({
      where: { email: data.managerEmail.toLowerCase().trim() },
    });
    if (existingOp) {
      return NextResponse.json(
        { success: false, error: "An operator account with this email already exists." },
        { status: 400 }
      );
    }

    // Provision Cinema in database
    const cinema = await prisma.cinema.create({
      data: {
        name: data.name.trim(),
        location: data.location.trim(),
        status: "APPROVED",
        organizationName: data.name.trim(),
        contactEmail: data.contactEmail.trim().toLowerCase(),
        contactPhone: data.contactPhone.trim(),
        ticketingSystem: data.ticketingSystem,
        screeningSystem: data.screeningSystem,
      },
    });

    // Provision primary auditorium screen
    const screen = await prisma.screen.create({
      data: {
        cinemaId: cinema.id,
        name: data.screenName.trim(),
        totalSeats: data.totalSeats,
      },
    });

    // Provision active agreed pricing rule
    await prisma.cinemaPricingRule.create({
      data: {
        cinemaId: cinema.id,
        currency: "TZS",
        pricePerSession: data.pricePerSession,
        status: "ACTIVE",
        notes: "Agreed platform commercial pricing provisioned by platform administration.",
      },
    });

    // Provision initial cinema operator manager account
    const operatorUser = await prisma.operatorUser.create({
      data: {
        cinemaId: cinema.id,
        email: data.managerEmail.trim().toLowerCase(),
        name: data.managerName.trim(),
        passwordHash: hashPassword(data.managerPassword),
        role: "MANAGER",
        isActive: true,
      },
    });

    // Record administrative audit log
    await prisma.auditEvent.create({
      data: {
        cinemaId: cinema.id,
        eventType: "ADMIN_REGISTER_CINEMA",
        entityType: "CINEMA",
        entityId: cinema.id,
        actor: "PLATFORM_ADMIN",
        details: JSON.stringify({
          cinemaName: cinema.name,
          location: cinema.location,
          screenId: screen.id,
          operatorId: operatorUser.id,
          operatorEmail: operatorUser.email,
          agreedPriceTzs: data.pricePerSession,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      cinema: {
        id: cinema.id,
        name: cinema.name,
        location: cinema.location,
      },
      operator: {
        id: operatorUser.id,
        email: operatorUser.email,
        name: operatorUser.name,
      },
      message: "Cinema circuit and operator account successfully provisioned.",
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
        error: err instanceof Error ? err.message : "Internal error registering cinema.",
      },
      { status: 500 }
    );
  }
}
