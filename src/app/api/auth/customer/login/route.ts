import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter your email or phone number and password." },
        { status: 400 }
      );
    }

    const result = await CustomerAuthService.login({
      identifier,
      password,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          needsVerification: result.needsVerification,
          customerId: result.customerId,
          missingVerification: result.missingVerification,
        },
        { status: result.needsVerification ? 403 : 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      session: result.session,
    });

    if (result.session?.sessionToken) {
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
    console.error("Customer login error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }
}
