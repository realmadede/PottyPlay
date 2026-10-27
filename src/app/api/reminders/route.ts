import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";
import { z } from "zod";

const reminderSchema = z.object({
  screeningId: z.string().min(1, "Screening ID is required"),
  ticketNumber: z.string().optional(),
  offsetMinutes: z.number().refine((val) => [1440, 60, 30].includes(val), {
    message: "Offset must be 1440 (1 day), 60 (1 hour), or 30 (30 minutes)",
  }),
  isEnabled: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("pp_cust_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await CustomerAuthService.validateSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const reminders = await prisma.screeningReminder.findMany({
      where: { customerId: session.customerId },
      include: {
        screening: {
          include: {
            cinema: { select: { name: true, location: true, timezone: true } },
            screen: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      reminders: reminders.map((r) => ({
        id: r.id,
        screeningId: r.screeningId,
        screeningTitle: r.screening.title,
        cinemaName: r.screening.cinema.name,
        screenName: r.screening.screen.name,
        scheduledStart: r.screening.scheduledStart,
        ticketNumber: r.ticketNumber,
        offsetMinutes: r.offsetMinutes,
        isEnabled: r.isEnabled,
        sentAt: r.sentAt,
      })),
    });
  } catch (error) {
    console.error("Failed to load reminders:", error);
    return NextResponse.json({ success: false, error: "Failed to load reminders." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("pp_cust_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await CustomerAuthService.validateSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const validated = reminderSchema.parse(body);

    // Verify that screening exists
    const screening = await prisma.screening.findUnique({
      where: { id: validated.screeningId },
    });
    if (!screening) {
      return NextResponse.json({ success: false, error: "Screening not found." }, { status: 404 });
    }

    // Verify ticket entitlement if ticketNumber provided
    if (validated.ticketNumber) {
      const ticket = await prisma.demonstrationTicket.findFirst({
        where: {
          ticketNumber: validated.ticketNumber.trim().toUpperCase(),
          screeningId: validated.screeningId,
        },
      });
      if (!ticket) {
        return NextResponse.json(
          { success: false, error: "Ticket not verified for this screening." },
          { status: 400 }
        );
      }
    }

    // Upsert reminder
    const reminder = await prisma.screeningReminder.upsert({
      where: {
        customerId_screeningId_offsetMinutes: {
          customerId: session.customerId,
          screeningId: validated.screeningId,
          offsetMinutes: validated.offsetMinutes,
        },
      },
      update: {
        isEnabled: validated.isEnabled,
        ticketNumber: validated.ticketNumber?.trim().toUpperCase() || null,
      },
      create: {
        customerId: session.customerId,
        screeningId: validated.screeningId,
        ticketNumber: validated.ticketNumber?.trim().toUpperCase() || null,
        offsetMinutes: validated.offsetMinutes,
        isEnabled: validated.isEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      reminder,
      message: "Screening reminder configured.",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Failed to save reminder:", error);
    return NextResponse.json({ success: false, error: "Failed to configure reminder." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("pp_cust_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await CustomerAuthService.validateSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reminderId = searchParams.get("id");

    if (!reminderId) {
      return NextResponse.json({ success: false, error: "Reminder ID required." }, { status: 400 });
    }

    await prisma.screeningReminder.deleteMany({
      where: {
        id: reminderId,
        customerId: session.customerId,
      },
    });

    return NextResponse.json({ success: true, message: "Reminder cancelled." });
  } catch (error) {
    console.error("Failed to delete reminder:", error);
    return NextResponse.json({ success: false, error: "Failed to delete reminder." }, { status: 500 });
  }
}
