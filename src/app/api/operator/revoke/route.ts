import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionService } from "@/features/sessions/session-service";

const revokeSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().min(3, "Revocation reason is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = revokeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    await SessionService.revokeSession(
      parsed.data.sessionId,
      parsed.data.reason
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
