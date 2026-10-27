import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";
import { z } from "zod";

const emailAuthSchema = z.object({
  mode: z.enum(["register", "login"]),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, email, password, name } = emailAuthSchema.parse(body);

    let result;
    if (mode === "register") {
      result = await CustomerAuthService.registerWithEmail(email, password, name || "Patron");
    } else {
      result = await CustomerAuthService.loginWithEmail(email, password);
    }

    if (!result.success || !result.session) {
      return NextResponse.json(
        { success: false, error: result.error || "Authentication failed." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      session: result.session,
    });

    response.cookies.set("pp_cust_token", result.session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    console.error("Email auth error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
