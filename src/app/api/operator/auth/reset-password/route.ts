import { NextRequest, NextResponse } from "next/server";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = resetSchema.parse(body);

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const result = await OperatorAuthService.resetPassword(token, newPassword, ip);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error during password reset." },
      { status: 500 }
    );
  }
}
