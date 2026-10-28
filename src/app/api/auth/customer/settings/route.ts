import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

async function getAuthenticatedSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;
  const cookieToken = req.cookies.get("pp_cust_token")?.value;
  const token = bearerToken || cookieToken;

  if (!token) return null;
  return CustomerAuthService.validateSession(token);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Action 1: Theme update
    if (body.action === "theme" || body.themePreference || body.theme) {
      const theme = body.theme || body.themePreference;
      if (!["LIGHT", "DARK", "SYSTEM"].includes(theme)) {
        return NextResponse.json({ success: false, error: "Invalid theme" }, { status: 400 });
      }
      await CustomerAuthService.updateTheme(session.customerId, theme);
      return NextResponse.json({ success: true, theme });
    }

    // Action 2: Deletion request
    if (body.action === "delete_account") {
      await CustomerAuthService.requestDeletion(session.customerId);
      const res = NextResponse.json({
        success: true,
        message: "Account deletion request submitted. Session revoked.",
      });
      res.cookies.delete("pp_cust_token");
      return res;
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Customer settings error:", error);
    return NextResponse.json({ success: false, error: "Settings update failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const theme = body.themePreference || body.theme;

    if (!theme || !["LIGHT", "DARK", "SYSTEM"].includes(theme)) {
      return NextResponse.json({ success: false, error: "Invalid theme preference" }, { status: 400 });
    }

    await CustomerAuthService.updateTheme(session.customerId, theme);
    return NextResponse.json({ success: true, themePreference: theme });
  } catch (error) {
    console.error("Customer settings update error:", error);
    return NextResponse.json({ success: false, error: "Settings update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await CustomerAuthService.requestDeletion(session.customerId);
    const res = NextResponse.json({
      success: true,
      message: "Account deletion request submitted. Session revoked.",
    });
    res.cookies.delete("pp_cust_token");
    return res;
  } catch (error) {
    console.error("Customer account deletion error:", error);
    return NextResponse.json({ success: false, error: "Account deletion request failed" }, { status: 500 });
  }
}
