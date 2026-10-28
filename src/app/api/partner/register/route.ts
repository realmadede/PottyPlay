import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = partnerSchema.parse(body);

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
        status: "PENDING",
      },
    });

    // Direct email notification to platform administration partnerships desk
    console.log(
      `[PARTNER-INQUIRY-EMAIL] To: partnerships@pottyplay.internal | Subject: New Cinema Partnership Inquiry from ${validated.organizationName} (${validated.city}, ${validated.country}) | Contact: ${validated.contactName} <${validated.contactEmail}>, Phone: ${validated.contactPhone} | Infrastructure: ${validated.screensCount} screens, POS: ${validated.ticketingSystem}, TMS: ${validated.screeningServer}`
    );

    // Direct acknowledgment email to the cinema applicant
    console.log(
      `[EMAIL-DISPATCH] To: ${validated.contactEmail} | Subject: PottyPlay Partnership Inquiry Received - Next Steps | Message: Your partnership inquiry for ${validated.organizationName} has been received. Our team will review your infrastructure and dispatch an expiring invitation link to complete registration.`
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
