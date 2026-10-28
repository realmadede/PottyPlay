import { Resend } from "resend";
import { config } from "@/lib/config";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export class ResendEmailService {
  private resendClient: Resend | null = null;

  constructor() {
    if (config.resend.apiKey) {
      this.resendClient = new Resend(config.resend.apiKey);
    }
  }

  isConfigured(): boolean {
    return Boolean(config.resend.apiKey);
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<SendEmailResult> {
    const { to, subject, html, text } = params;

    if (!this.resendClient) {
      // Safe fallback for testing and development environments
      console.log(`[RESEND-SIMULATED] To: ${to} | Subject: ${subject} | Body: ${text || html.slice(0, 100)}`);
      return {
        success: true,
        messageId: "sim_" + Math.random().toString(36).substring(2, 10),
        simulated: true,
      };
    }

    try {
      const response = await this.resendClient.emails.send({
        from: config.resend.fromEmail,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ""),
      });

      if (response.error) {
        console.error(`[RESEND-ERROR] Failed to send email to ${to}:`, response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[RESEND-EXCEPTION] Failed to dispatch email to ${to}:`, message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Dispatches two-stage email verification code to a registering customer.
   */
  async sendCustomerEmailVerification(to: string, code: string): Promise<SendEmailResult> {
    console.log(`[EMAIL-VERIFICATION] Code for ${to}: ${code} (expires in 15m)`);

    return this.sendEmail({
      to,
      subject: "Your PottyPlay Account Verification Code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">PottyPlay Account Verification</h2>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            Welcome to PottyPlay. Use the verification code below to verify your email address and activate your cinema companion account.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #16191E; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 6px; color: #F59E0B;">${code}</span>
          </div>
          <p style="color: #9CA3AF; font-size: 12px;">This code is valid for 15 minutes. If you did not create a PottyPlay account, please disregard this email.</p>
        </div>
      `,
      text: `Your PottyPlay verification code is: ${code}. Valid for 15 minutes.`,
    });
  }

  /**
   * Dispatches password reset token to customer.
   */
  async sendCustomerPasswordReset(to: string, resetToken: string): Promise<SendEmailResult> {
    console.log(`[PASSWORD-RESET] Token for ${to}: ${resetToken}`);

    return this.sendEmail({
      to,
      subject: "PottyPlay Password Reset Instructions",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">Reset Your PottyPlay Password</h2>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Enter the reset token below in your PottyPlay application to choose a new password.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #16191E; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center;">
            <span style="font-size: 18px; font-weight: bold; font-family: monospace; color: #F59E0B;">${resetToken}</span>
          </div>
          <p style="color: #9CA3AF; font-size: 12px;">This token expires in 15 minutes. If you did not request this change, your account remains secure.</p>
        </div>
      `,
      text: `Your PottyPlay password reset token is: ${resetToken}. Valid for 15 minutes.`,
    });
  }

  /**
   * Dispatches email change verification code.
   */
  async sendEmailChangeVerification(to: string, code: string): Promise<SendEmailResult> {
    console.log(`[EMAIL-CHANGE-VERIFICATION] Code for ${to}: ${code} (expires in 15m)`);

    return this.sendEmail({
      to,
      subject: "Verify Your New PottyPlay Email Address",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">Confirm Email Address Update</h2>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            You requested to change your PottyPlay account email to this address. Enter the code below to complete the change.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #16191E; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 6px; color: #F59E0B;">${code}</span>
          </div>
          <p style="color: #9CA3AF; font-size: 12px;">Valid for 15 minutes.</p>
        </div>
      `,
      text: `Your PottyPlay email change verification code is: ${code}. Valid for 15 minutes.`,
    });
  }

  /**
   * Dispatches operator password reset instructions.
   */
  async sendOperatorPasswordReset(to: string, resetToken: string): Promise<SendEmailResult> {
    console.log(`[OPERATOR-PASSWORD-RESET] Token for ${to}: ${resetToken} (expires in 15m)`);

    return this.sendEmail({
      to,
      subject: "PottyPlay Cinema Operator Password Reset",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">Cinema Operator Workspace Recovery</h2>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            A password reset was requested for your cinema operator staff account. Enter the token below to reset your password.
          </p>
          <div style="margin: 24px 0; padding: 16px; background: #16191E; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center;">
            <span style="font-size: 16px; font-weight: bold; font-family: monospace; color: #F59E0B;">${resetToken}</span>
          </div>
          <p style="color: #9CA3AF; font-size: 12px;">Valid for 15 minutes. If you did not request this, inform your cinema IT administrator immediately.</p>
        </div>
      `,
      text: `Your PottyPlay operator reset token is: ${resetToken}. Valid for 15 minutes.`,
    });
  }

  /**
   * Dispatches partnership inquiry confirmation to applicant.
   */
  async sendPartnerInquiryConfirmation(to: string, organizationName: string): Promise<SendEmailResult> {
    console.log(`[EMAIL-DISPATCH] To: ${to} | Subject: PottyPlay Partnership Inquiry Received - Next Steps | Message: Your partnership inquiry for ${organizationName} has been received.`);

    return this.sendEmail({
      to,
      subject: "PottyPlay Partnership Inquiry Received - Next Steps",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">Partnership Inquiry Received</h2>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            Thank you for your interest in PottyPlay. Your partnership application for <strong>${organizationName}</strong> has been received by our exhibitions desk.
          </p>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            Our solutions engineering team will review your auditorium infrastructure and POS compatibility. Upon approval, you will receive an official expiring registration link.
          </p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            PottyPlay Solutions Engineering &bull; Dar es Salaam, Tanzania
          </p>
        </div>
      `,
      text: `Your partnership inquiry for ${organizationName} has been received. Our team will review your infrastructure and dispatch an expiring invitation link to complete registration.`,
    });
  }

  /**
   * Dispatches partnership inquiry notification to internal team.
   */
  async sendPartnerInquiryInternal(data: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    city: string;
    country: string;
    screensCount: number;
    ticketingSystem: string;
    screeningServer: string;
  }): Promise<SendEmailResult> {
    const internalEmail = process.env.PARTNERSHIPS_EMAIL || "partnerships@pottyplay.internal";
    console.log(
      `[PARTNER-INQUIRY-EMAIL] To: ${internalEmail} | Subject: New Cinema Partnership Inquiry from ${data.organizationName} (${data.city}, ${data.country}) | Contact: ${data.contactName} <${data.contactEmail}>, Phone: ${data.contactPhone} | Infrastructure: ${data.screensCount} screens, POS: ${data.ticketingSystem}, TMS: ${data.screeningServer}`
    );

    return this.sendEmail({
      to: internalEmail,
      subject: `New Cinema Partnership Inquiry: ${data.organizationName} (${data.city})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">New Cinema Circuit Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #F3F4F6;">
            <tr><td style="padding: 8px 0; color: #9CA3AF;">Organization:</td><td style="font-weight: bold;">${data.organizationName}</td></tr>
            <tr><td style="padding: 8px 0; color: #9CA3AF;">Contact:</td><td>${data.contactName} (${data.contactEmail})</td></tr>
            <tr><td style="padding: 8px 0; color: #9CA3AF;">Telephone:</td><td>${data.contactPhone}</td></tr>
            <tr><td style="padding: 8px 0; color: #9CA3AF;">Location:</td><td>${data.city}, ${data.country}</td></tr>
            <tr><td style="padding: 8px 0; color: #9CA3AF;">Screens:</td><td>${data.screensCount}</td></tr>
            <tr><td style="padding: 8px 0; color: #9CA3AF;">POS System:</td><td>${data.ticketingSystem}</td></tr>
            <tr><td style="padding: 8px 0; color: #9CA3AF;">Screening Server:</td><td>${data.screeningServer}</td></tr>
          </table>
        </div>
      `,
      text: `New Cinema Inquiry: ${data.organizationName}, Contact: ${data.contactName} <${data.contactEmail}>, Phone: ${data.contactPhone}`,
    });
  }

  /**
   * Dispatches official cinema registration invitation link to partner.
   */
  async sendCinemaInvitation(params: {
    to: string;
    organizationName: string;
    inviteUrl: string;
    expiresInHours: number;
    expiresAt: Date;
  }): Promise<SendEmailResult> {
    const { to, organizationName, inviteUrl, expiresInHours, expiresAt } = params;
    console.log(
      `[INVITATION-EMAIL] To: ${to} | Subject: PottyPlay Official Cinema Registration Invitation | Link: ${inviteUrl} (Expires in ${expiresInHours}h at ${expiresAt.toISOString()})`
    );

    return this.sendEmail({
      to,
      subject: `PottyPlay Official Cinema Registration Invitation - ${organizationName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">Official Registration Invitation</h2>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            Your partnership application for <strong>${organizationName}</strong> has been approved. You are invited to complete your circuit registration and set up your cinema operator workspace.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: #F59E0B; color: #0D0F12; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 14px;">Complete Cinema Registration</a>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5;">
            This invitation link is strictly confidential and expires in <strong>${expiresInHours} hours</strong> (at ${expiresAt.toUTCString()}). Once used, this link will be permanently invalidated.
          </p>
        </div>
      `,
      text: `PottyPlay Registration Invitation for ${organizationName}: ${inviteUrl} (Expires in ${expiresInHours} hours).`,
    });
  }

  /**
   * Dispatches screening reminder email to customer.
   */
  async sendScreeningReminder(params: {
    to: string;
    customerName: string;
    screeningTitle: string;
    cinemaName: string;
    screenName: string;
    scheduledStart: Date;
    minutesRemaining: number;
    ticketNumber?: string | null;
  }): Promise<SendEmailResult> {
    const { to, customerName, screeningTitle, cinemaName, screenName, minutesRemaining, ticketNumber } = params;
    const timeFormatted = params.scheduledStart.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Dar_es_Salaam",
    });

    return this.sendEmail({
      to,
      subject: `Reminder: "${screeningTitle}" starts in ${minutesRemaining} minutes`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0D0F12; color: #F3F4F6; border-radius: 16px;">
          <h2 style="color: #F59E0B; margin-top: 0;">Screening Reminder</h2>
          <p style="color: #E5E7EB; font-size: 15px;">Hello ${customerName},</p>
          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.6;">
            Your scheduled screening of <strong>${screeningTitle}</strong> at <strong>${cinemaName}</strong> (${screenName}) begins in <strong>${minutesRemaining} minutes</strong> (at ${timeFormatted}).
          </p>
          ${ticketNumber ? `<p style="color: #9CA3AF; font-size: 14px;">Ticket Number: <span style="font-family: monospace; color: #F3F4F6;">${ticketNumber}</span></p>` : ""}
          <p style="color: #9CA3AF; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            Enjoy the show! If you need a restroom break during the film, open PottyPlay on your mobile device to keep up with the action without missing key plot points.
          </p>
        </div>
      `,
      text: `Reminder: "${screeningTitle}" at ${cinemaName} starts in ${minutesRemaining} minutes (at ${timeFormatted}).`,
    });
  }
}

export const resendService = new ResendEmailService();
