import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    const cookieToken = req.cookies.get("pp_cust_token")?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const session = await CustomerAuthService.validateSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session invalid or expired" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Update Full Name
    if (body.action === "update_name") {
      const result = await CustomerAuthService.updateName(session.customerId, body.name);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, customer: result.customer });
    }

    // 2. Request Email Change (Dispatches verification code)
    if (body.action === "request_email_change") {
      const result = await CustomerAuthService.requestEmailChange(session.customerId, body.newEmail);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Verification code sent to your new email address.",
        simulatedCode: result.simulatedCode,
      });
    }

    // 3. Confirm Email Change
    if (body.action === "confirm_email_change") {
      const result = await CustomerAuthService.confirmEmailChange(
        session.customerId,
        body.newEmail,
        body.code
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Email address updated successfully.",
        customer: result.customer,
      });
    }

    // 4. Request Phone Change (Dispatches SMS OTP)
    if (body.action === "request_phone_change") {
      const result = await CustomerAuthService.requestPhoneChange(session.customerId, body.newPhone);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        challengeId: result.challengeId,
        message: "SMS OTP sent to your new phone number.",
        simulatedCode: result.simulatedCode,
      });
    }

    // 5. Confirm Phone Change
    if (body.action === "confirm_phone_change") {
      const result = await CustomerAuthService.confirmPhoneChange(
        session.customerId,
        body.newPhone,
        body.challengeId,
        body.code
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Phone number updated successfully.",
        customer: result.customer,
      });
    }

    // 6. Change Password (Strict verification of current password)
    if (body.action === "change_password") {
      const result = await CustomerAuthService.changePassword(
        session.customerId,
        body.currentPassword,
        body.newPassword
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Password updated successfully.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Customer profile error:", error);
    return NextResponse.json({ success: false, error: "Profile update operation failed." }, { status: 500 });
  }
}
