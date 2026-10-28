import { NextRequest, NextResponse } from "next/server";
import { OperatorAuthService } from "@/features/operator/operator-auth-service";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Valid work email address required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const result = await OperatorAuthService.login(email, password, ip);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      token: result.token,
      operator: result.operator,
    });

    if (result.token) {
      response.cookies.set("pp_operator_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60,
      });
    }

    return response;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error during operator authentication." },
      { status: 500 }
    );
  }
}
