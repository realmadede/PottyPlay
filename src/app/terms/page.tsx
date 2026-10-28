"use client";

import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="flex-1 flex flex-col bg-brand-bg text-brand-text-primary selection:bg-brand-primary/30 selection:text-brand-text-primary min-h-[100dvh]">
      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-left">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>

        <div className="border-b border-brand-border pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-xs font-bold text-brand-text-primary mb-3">
            <FileText className="w-3.5 h-3.5 text-brand-accent" />
            <span>Customer & Partner Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-text-primary tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-brand-text-secondary">
            Version 2026-10-v1 &bull; Effective Date: October 28, 2026 &bull; Governing Jurisdiction: United Republic of Tanzania
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              1. Nature and Scope of PottyPlay Services
            </h2>
            <p>
              PottyPlay (&ldquo;the Platform&rdquo;) is an authoritative cinema companion-viewing technology service. PottyPlay is <strong>not</strong> a general video-on-demand streaming service, not a public movie library, not a cinema ticket marketplace, and not an open video host.
            </p>
            <p>
              The platform enables eligible ticket holders at participating cinema auditoriums to temporarily follow the authoritative theatrical projection feed during a brief bathroom or concession intermission on their mobile device. All viewing access is strictly tethered to an ongoing, verified screening and terminates automatically.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              2. Eligibility and Account Obligations
            </h2>
            <p>
              To access PottyPlay companion viewing features, you must:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Be at least 18 years of age, or have the consent of a parent or legal guardian.</li>
              <li>Provide accurate, truthful registration information (full name, verified telephone number, and valid email address).</li>
              <li>Complete two-stage authentication (SMS OTP phone verification and email ownership verification).</li>
              <li>Maintain the confidentiality of your account password and notify us immediately of any unauthorized account activity.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              3. Ticket Verification and Viewing Entitlements
            </h2>
            <p>
              Viewing authorization requires a genuine ticket entitlement issued by a participating cinema exhibitor. The following non-negotiable rules apply:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Screening Lock:</strong> A ticket can only authorize playback for the specific auditorium screening to which it was issued.</li>
              <li><strong>Two-Break Allowance:</strong> Each admitted ticket permits a maximum of <strong>two (2) separate break sessions</strong> during the feature runtime.</li>
              <li><strong>15-Minute Hard Limit:</strong> Each break session is subject to an authoritative, server-enforced timer of strictly <strong>900 seconds (15 minutes)</strong>. When the timer lapses, the stream disconnects immediately without extension.</li>
              <li><strong>Single-Device Concurrency:</strong> Only one mobile device may actively stream from a ticket entitlement at any given time. Sharing ticket claim links concurrently is strictly blocked.</li>
              <li><strong>Usher & Operator Revocation:</strong> Cinema personnel reserve the right to revoke any session for auditorium management, suspected recording, or ticket cancellation.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              4. Cinema-Specific Availability and Content Rights
            </h2>
            <p>
              PottyPlay is available only at participating, approved cinema venues and eligible screenings with verified studio content rights. We make no warranty that every screening at any cinema will offer companion viewing. If a film distributor has not authorized companion viewing rights for a title, companion access fails closed.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              5. Intellectual Property and Content Protection
            </h2>
            <p>
              All theatrical film content streamed through the platform remains the exclusive intellectual property of the relevant film studios, distributors, and copyright holders.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You are granted a strictly personal, non-exclusive, non-transferable, temporary license to view the feed during your break.</li>
              <li>You may <strong>not</strong> record, capture, rip, rebroadcast, reverse-engineer, distribute, or publicly exhibit any portion of the audio-visual stream.</li>
              <li>Screen capture, HDMI output mirroring, and unauthorized stream extraction are prohibited and may trigger automatic session revocation and legal prosecution under the Copyright and Neighbouring Rights Act of Tanzania.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              6. Service Interruptions and Network Quality
            </h2>
            <p>
              While we engineer adaptive bitrate streaming for deep theater corridors, streaming quality depends on your mobile carrier signal and auditorium network coverage. We are not liable for brief packet loss, buffering, or premature session termination resulting from local device connectivity failure.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              7. Commercial Pricing and Responsibility
            </h2>
            <p>
              Participating cinema circuits determine the commercial terms for companion viewing within their auditoriums, which may be included as a complimentary amenity or billed under cinema-specific rates. PottyPlay records verified session telemetry for exhibitor reconciliation.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              8. Account Suspension and Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, attempt to bypass verification limits, share credentials, or abuse platform infrastructure.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              9. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the <strong>United Republic of Tanzania</strong>. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of the United Republic of Tanzania.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-brand-text-primary">
              10. Contact and Legal Inquiries
            </h2>
            <div className="p-4 rounded-xl bg-white border border-brand-border font-mono text-xs text-brand-text-primary">
              Email: legal@pottyplay.internal<br />
              Subject: Terms of Service Inquiry
            </div>
            <p className="text-xs text-neutral-500">
              Note: This agreement must be reviewed by a qualified Tanzanian legal practitioner prior to commercial public launch.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-brand-border bg-white py-6 px-4 text-center text-xs text-brand-text-secondary">
        PottyPlay &bull; Legal Department &bull; United Republic of Tanzania
      </footer>
    </div>
  );
}
