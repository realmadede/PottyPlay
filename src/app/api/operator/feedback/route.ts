import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/auth-guards";
import { FeedbackService } from "@/features/feedback/feedback-service";
import { FeedbackStatus } from "@prisma/client";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  feedbackId: z.string().min(1, "Feedback ID is required"),
  status: z.nativeEnum(FeedbackStatus),
  operatorNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedCinemaId = searchParams.get("cinemaId");
    const guard = await requireOperator(req, { requestedCinemaId });
    if (!guard.ok) return guard.response;

    const cinemaId = guard.ctx.cinemaId;
    if (!cinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema ID is required." },
        { status: 400 }
      );
    }

    const statusParam = searchParams.get("status") as FeedbackStatus | null;
    const feedbacks = await FeedbackService.listByCinema(cinemaId, {
      status: statusParam || undefined,
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error: any) {
    console.error("[OPERATOR-FEEDBACK-GET-ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve patron feedback queue." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await requireOperator(req);
    if (!guard.ok) return guard.response;

    const cinemaId = guard.ctx.cinemaId;
    if (!cinemaId) {
      return NextResponse.json(
        { success: false, error: "Cinema ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const updated = await FeedbackService.updateStatus(
      parsed.data.feedbackId,
      cinemaId,
      parsed.data.status,
      parsed.data.operatorNotes
    );

    return NextResponse.json({
      success: true,
      feedback: updated,
    });
  } catch (error: any) {
    console.error("[OPERATOR-FEEDBACK-PATCH-ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update feedback item." },
      { status: 500 }
    );
  }
}
