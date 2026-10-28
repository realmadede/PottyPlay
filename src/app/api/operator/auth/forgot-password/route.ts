import { NextRequest, NextResponse } from "next/server";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email("Valid work email address required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotSchema.parse(body);

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const result = await OperatorAuthService.requestPasswordReset(email, ip);

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error during password reset request." },
      { status: 500 }
    );
  }
}
