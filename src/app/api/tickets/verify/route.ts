import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketService } from "@/features/tickets/ticket-service";

const verifySchema = z
  .object({
    ticketNumber: z.string().min(3).max(50).optional(),
    claimToken: z.string().min(3).max(50).optional(),
    identifier: z.string().min(3).max(50).optional(),
    screeningId: z.string().optional(),
  })
  .refine((data) => data.ticketNumber || data.claimToken || data.identifier, {
    message: "Ticket number or claim token is required",
  });

// Rate limiting: maximum 30 verification attempts per minute per IP address
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipAttempts.get(ip);
  if (!record || now > record.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (record.count >= 30) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          status: "RATE_LIMITED",
          isEligible: false,
          message: "Too many ticket verification attempts. Please wait a minute.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "INVALID_TICKET",
          isEligible: false,
          message: parsed.error.issues[0]?.message || "Invalid input parameters.",
        },
        { status: 400 }
      );
    }

    const code =
      parsed.data.identifier ||
      parsed.data.claimToken ||
      parsed.data.ticketNumber!;

    const result = await TicketService.verifyTicket(
      code,
      parsed.data.screeningId
    );

    return NextResponse.json(result, {
      status: result.isEligible ? 200 : 422,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        status: "INVALID_TICKET",
        isEligible: false,
        message,
      },
      { status: 500 }
    );
  }
}
