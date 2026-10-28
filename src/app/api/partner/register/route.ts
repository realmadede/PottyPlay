import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resendService } from "@/features/email/resend-service";
import { z } from "zod";

const partnerSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid business email is required"),
  contactPhone: z.string().min(6, "Contact phone is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().default("Tanzania"),
  venueCount: z.number().int().positive().default(1),
  screensCount: z.number().int().positive().default(1),
  ticketingSystem: z.string().default("Vista"),
  screeningServer: z.string().default("Dolby TMS"),
  technicalContactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = partnerSchema.parse(body);

    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || null;

    // Honeypot spam defense: bots populate invisible fields
    if (validated.website && validated.website.trim().length > 0) {
      console.warn(
        `[SPAM-DEFENSE] Blocked automated bot submission via honeypot from IP ${ipAddress}. Field content: ${validated.website}`
      );
      // Return synthetic success to mislead bot scrapers without storing or dispatching
      return NextResponse.json({
        success: true,
        message: "Partnership inquiry received.",
      });
    }

    const application = await prisma.partnerApplication.create({
      data: {
        organizationName: validated.organizationName.trim(),
        contactName: validated.contactName.trim(),
        contactEmail: validated.contactEmail.trim().toLowerCase(),
        contactPhone: validated.contactPhone.trim(),
        city: validated.city.trim(),
        country: validated.country.trim(),
        venueCount: validated.venueCount,
        screensCount: validated.screensCount,
        ticketingSystem: validated.ticketingSystem,
        screeningServer: validated.screeningServer,
        technicalContactEmail: validated.technicalContactEmail?.trim() || null,
        notes: validated.notes?.trim() || null,
        ipAddress,
        userAgent,
        status: "PENDING",
      },
    });

    // Direct email notification to platform administration partnerships desk via Resend
    await resendService.sendPartnerInquiryInternal({
      organizationName: validated.organizationName,
      contactName: validated.contactName,
      contactEmail: validated.contactEmail,
      contactPhone: validated.contactPhone,
      city: validated.city,
      country: validated.country,
      screensCount: validated.screensCount,
      ticketingSystem: validated.ticketingSystem,
      screeningServer: validated.screeningServer,
    });

    // Direct acknowledgment email to the cinema applicant via Resend
    await resendService.sendPartnerInquiryConfirmation(
      validated.contactEmail,
      validated.organizationName
    );

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        eventType: "PARTNER_INQUIRY_EMAILED",
        entityType: "PARTNER_APPLICATION",
        entityId: application.id,
        actor: validated.contactEmail.trim().toLowerCase(),
        details: JSON.stringify({
          organization: application.organizationName,
          email: application.contactEmail,
          city: application.city,
          screens: application.screensCount,
          channel: "DIRECT_EMAIL_DISPATCH",
          ipAddress,
          userAgent,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Partnership inquiry dispatched directly to platform partnerships team via email. An expiring registration invitation link will be dispatched to your email following administrative review.",
      applicationId: application.id,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    console.error("Failed to register cinema partner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit partner application. Please try again." },
      { status: 500 }
    );
  }
}
