import { NextRequest, NextResponse } from "next/server";
import { AdminAuthService } from "@/features/admin/admin-auth-service";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(2, "Username is required"),
  password: z.string().min(6, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = loginSchema.parse(body);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await AdminAuthService.login(username, password, ip);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || "Authentication failed." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      token: result.token,
      message: "Administrator session authorized.",
    });

    response.cookies.set("pp_admin_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hour admin session
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal authentication error." }, { status: 500 });
  }
}
