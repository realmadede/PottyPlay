import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionService } from "@/features/sessions/session-service";
import { requireOperator } from "@/lib/auth-guards";

const revokeSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().min(3, "Revocation reason is required"),
  cinemaId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
    }

    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const guard = await requireOperator(req, {
      requestedCinemaId: parsed.data.cinemaId ?? null,
    });
    if (!guard.ok) return guard.response;

    // Operators are always scoped to their own cinema. Admins may act on any cinema (no scope).
    const scopeCinemaId = guard.ctx.kind === "operator" ? guard.ctx.cinemaId : null;

    try {
      await SessionService.revokeSession(
        parsed.data.sessionId,
        parsed.data.reason,
        scopeCinemaId ?? undefined
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Session not found.") {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      throw err;
    }

    return NextResponse.json({ success: true, message: "Session revoked successfully." });
  } catch (err: unknown) {
    console.error("[OPERATOR-REVOKE] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
