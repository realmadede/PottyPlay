import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketService } from "@/features/tickets/ticket-service";

const verifySchema = z.object({
  ticketNumber: z
    .string()
    .min(3, "Ticket number must be at least 3 characters")
    .max(50, "Ticket number too long"),
  screeningId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
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

    const result = await TicketService.verifyTicket(
      parsed.data.ticketNumber,
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
