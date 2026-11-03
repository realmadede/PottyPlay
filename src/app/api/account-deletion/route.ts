import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CustomerAuthService } from "@/features/auth/customer-auth-service";

const requestSchema = z.object({
  action: z.literal("request"),
  email: z.string().trim().email().max(254),
});

const confirmSchema = z.object({
  action: z.literal("confirm"),
  token: z.string().min(20).max(256),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const request = requestSchema.safeParse(body);
  if (request.success) {
    await CustomerAuthService.requestExternalDeletion(request.data.email);
    return NextResponse.json({
      success: true,
      message: "If an active account matches that email address, a confirmation link will be sent. Check your inbox and spam folder.",
    }, { status: 202 });
  }

  const confirmation = confirmSchema.safeParse(body);
  if (!confirmation.success) {
    return NextResponse.json({ success: false, error: "Provide a valid email address or deletion confirmation token." }, { status: 400 });
  }

  const deleted = await CustomerAuthService.confirmExternalDeletion(confirmation.data.token);
  if (!deleted) {
    return NextResponse.json({
      success: false,
      error: "This deletion link is invalid, expired, or has already been used. Request a new link to continue.",
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Deletion confirmed. Account access has been revoked. Associated account identifiers will be anonymized after the 30-day grace period; cinema and legally required records may be retained in anonymized form.",
  });
}
