import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, code } = body;

    if (!customerId || !code) {
      return NextResponse.json(
        { success: false, error: "Missing customer identifier or verification code." },
        { status: 400 }
      );
    }

    const result = await CustomerAuthService.verifyEmail({
      customerId,
      code,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      isFullyActivated: result.isFullyActivated,
      session: result.session,
    });

    if (result.isFullyActivated && result.session?.sessionToken) {
      response.cookies.set("pp_cust_token", result.session.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email address." },
      { status: 500 }
    );
  }
}
