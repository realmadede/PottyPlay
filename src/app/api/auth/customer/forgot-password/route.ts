import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode 1: Request reset instructions
    if (body.action === "request") {
      const { identifier } = body;
      if (!identifier) {
        return NextResponse.json(
          { success: false, error: "Please provide your email or phone number." },
          { status: 400 }
        );
      }
      const result = await CustomerAuthService.requestPasswordReset(identifier);
      return NextResponse.json({ success: true, message: result.message });
    }

    // Mode 2: Complete reset with token
    if (body.action === "reset") {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        return NextResponse.json(
          { success: false, error: "Missing reset token or new password." },
          { status: 400 }
        );
      }
      const result = await CustomerAuthService.resetPassword({
        token,
        newPassword,
      });
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Password reset successful. Please sign in with your new password.",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process password reset." },
      { status: 500 }
    );
  }
}
