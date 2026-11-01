import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { smsService } from "@/features/messaging/sms-service";
import { resendService } from "@/features/email/resend-service";
import { SessionService } from "@/features/sessions/session-service";
import { maskPhoneNumber } from "@/lib/auth-guards";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const isProd = process.env.NODE_ENV === "production";

    // Enforce CRON_SECRET configuration in production
    if (isProd && !cronSecret) {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET must be configured in production." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized cron dispatch trigger." },
        { status: 401 }
      );
    }

    const now = new Date();
    const nowMs = now.getTime();

    // 1. Sweep and expire stale companion sessions
    const expiredSessionsCount = await SessionService.expireStaleSessions();

    // 2. Query all enabled reminders that haven't been dispatched yet,
    // prioritizing screenings starting soonest to avoid starvation
    const pendingReminders = await prisma.screeningReminder.findMany({
      where: {
        isEnabled: true,
        sentAt: null,
      },
      include: {
        screening: {
          include: {
            cinema: { select: { id: true, name: true, location: true } },
            screen: { select: { id: true, name: true } },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        screening: {
          scheduledStart: "asc",
        },
      },
      take: 100,
    });

    const dispatched: Array<{
      reminderId: string;
      customerName: string;
      screeningTitle: string;
      offsetMinutes: number;
      smsDispatched: boolean;
      emailDispatched: boolean;
    }> = [];

    let skippedCount = 0;

    for (const reminder of pendingReminders) {
      const scheduledStartMs = new Date(reminder.screening.scheduledStart).getTime();
      const notifyAtMs = scheduledStartMs - reminder.offsetMinutes * 60 * 1000;

      // Check if trigger window is reached (and screening is not more than 2 hours in past)
      if (nowMs >= notifyAtMs && nowMs <= scheduledStartMs + 2 * 3600 * 1000) {
        // Atomic claim-then-send: mark sentAt immediately to prevent duplicate sends by concurrent workers
        const claim = await prisma.screeningReminder.updateMany({
          where: {
            id: reminder.id,
            sentAt: null,
          },
          data: {
            sentAt: now,
          },
        });

        if (claim.count === 0) {
          // Already claimed and dispatched by a concurrent worker instance
          continue;
        }

        let smsSuccess = false;
        let emailSuccess = false;

        // Send SMS Notification if customer has phone number
        if (reminder.customer.phoneNumber) {
          try {
            const smsRes = await smsService.sendScreeningUpcomingReminder(
              reminder.customer.phoneNumber,
              reminder.screening.title,
              reminder.offsetMinutes,
              reminder.screening.cinema.name
            );
            smsSuccess = smsRes.status === "SENT";
          } catch (smsErr) {
            console.error(
              `[REMINDER-DISPATCH] SMS dispatch error for reminder ${reminder.id}:`,
              smsErr
            );
          }
        }

        // Send Email Notification via Resend if customer has email address
        if (reminder.customer.email) {
          try {
            const emailRes = await resendService.sendScreeningReminder({
              to: reminder.customer.email,
              customerName: reminder.customer.name || "Cinema Patron",
              screeningTitle: reminder.screening.title,
              cinemaName: reminder.screening.cinema.name,
              screenName: reminder.screening.screen.name,
              scheduledStart: reminder.screening.scheduledStart,
              minutesRemaining: reminder.offsetMinutes,
              ticketNumber: reminder.ticketNumber,
            });
            emailSuccess = emailRes.success;
          } catch (emailErr) {
            console.error(
              `[REMINDER-DISPATCH] Email dispatch error for reminder ${reminder.id}:`,
              emailErr
            );
          }
        }

        // Record Audit Event with masked phone number
        await prisma.auditEvent.create({
          data: {
            eventType: "REMINDER_DISPATCHED",
            entityType: "REMINDER",
            entityId: reminder.id,
            actor: "BACKGROUND_WORKER",
            details: JSON.stringify({
              customerId: reminder.customer.id,
              screeningId: reminder.screeningId,
              offsetMinutes: reminder.offsetMinutes,
              phoneMasked: maskPhoneNumber(reminder.customer.phoneNumber),
              smsDispatched: smsSuccess,
              emailDispatched: emailSuccess,
            }),
          },
        });

        dispatched.push({
          reminderId: reminder.id,
          customerName: reminder.customer.name || "Cinema Patron",
          screeningTitle: reminder.screening.title,
          offsetMinutes: reminder.offsetMinutes,
          smsDispatched: smsSuccess,
          emailDispatched: emailSuccess,
        });
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedTotal: pendingReminders.length,
      dispatchedCount: dispatched.length,
      expiredSessionsCount,
      skippedCount,
      dispatched,
    });
  } catch (error: any) {
    console.error("[REMINDER-DISPATCH-ROUTE] Error dispatching reminders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch reminders." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
