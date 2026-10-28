import { NextRequest, NextResponse } from "next/server";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phoneNumber, email, password, termsAccepted } = body;

    const result = await CustomerAuthService.registerCustomer({
      fullName,
      phoneNumber,
      email,
      password,
      termsAccepted: Boolean(termsAccepted),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      customerId: result.customerId,
      phoneChallengeId: result.phoneChallengeId,
      simulatedSmsCode: result.simulatedSmsCode,
      simulatedEmailCode: result.simulatedEmailCode,
      message: "Pending registration created. Please verify your phone and email.",
    });
  } catch (error) {
    console.error("Customer registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
