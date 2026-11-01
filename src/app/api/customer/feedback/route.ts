import { NextRequest, NextResponse } from "next/server";
import { FeedbackService } from "@/features/feedback/feedback-service";
import { FeedbackCategory } from "@prisma/client";
import { z } from "zod";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";
import { extractToken } from "@/lib/auth-guards";

async function getAuthenticatedCustomer(req: NextRequest) {
  const token = extractToken(req, ["pp_cust_token"]);
  if (!token) return null;
  return await CustomerAuthService.validateSession(token);
}

const FeedbackSubmissionSchema = z.object({
  cinemaId: z.string().optional().nullable(),
  screeningId: z.string().optional().nullable(),
  ticketNumber: z.string().optional().nullable(),
  category: z.nativeEnum(FeedbackCategory).default(FeedbackCategory.GENERAL_FEEDBACK),
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
  deviceInfo: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    const body = await req.json();
    const parsed = FeedbackSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const feedback = await FeedbackService.submitFeedback({
      ...parsed.data,
      customerId: session?.customerId || null,
      deviceInfo: parsed.data.deviceInfo || req.headers.get("user-agent") || null,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully. Thank you for helping improve cinema companion streaming.",
      feedbackId: feedback.id,
    });
  } catch (error: any) {
    console.error("[CUSTOMER-FEEDBACK-ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit feedback." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view feedback history." },
        { status: 401 }
      );
    }

    const feedbacks = await FeedbackService.listByCustomer(session.customerId);
    return NextResponse.json({ success: true, feedbacks });
  } catch (error: any) {
    console.error("[CUSTOMER-FEEDBACK-GET-ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve feedback items." },
      { status: 500 }
    );
  }
}
