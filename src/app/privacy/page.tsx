"use client";

import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { BrandLogo } from "@/components/BrandLogo";
import { Shield, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 flex flex-col bg-bg text-ink selection:bg-amber-500/30 selection:text-ink min-h-[100dvh]">
      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-left">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-muted hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>

        <div className="border-b border-line pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 mb-3">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Legal Notice & Data Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            Version 2026-11-v1 &bull; Effective Date: November 3, 2026 &bull; Governing Jurisdiction: United Republic of Tanzania
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              1. Statutory Framework and Commitment
            </h2>
            <p>
              PottyPlay (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;) provides authoritative cinema companion viewing services. We process personal data in strict compliance with the laws of the United Republic of Tanzania, including the <strong>Personal Data Protection Act, 2022 (Act No. 11 of 2022)</strong>, the <strong>Personal Data Protection Regulations</strong>, the <strong>Electronic Transactions Act, 2015</strong>, and applicable regulatory directives of the Tanzania Communications Regulatory Authority (TCRA) and the Personal Data Protection Commission (PDPC).
            </p>
            <p className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <strong>Service operator contact:</strong> The legal name and postal address of the organization operating PottyPlay must be added here before this policy is published.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              2. Personal Data We Collect
            </h2>
            <p>
              We adhere strictly to the principle of data minimization under Section 5 of the Personal Data Protection Act, 2022. We collect only what is necessary to authenticate patrons and deliver synchronized companion playback:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Customer Account Details:</strong> Full name, telephone number, email address, and protected password records. Passwords are not stored in readable form.</li>
              <li><strong>Verification Records:</strong> Phone and email verification records, including whether a code was verified and when.</li>
              <li><strong>Ticket & Screening Data:</strong> Cinema ticket barcodes, claim tokens, seat assignments, screening titles, screen identifiers, and cinema venue identifiers.</li>
              <li><strong>Break and playback details:</strong> Break start time and duration (up to 15 minutes), playback timing information used to keep the stream aligned, and whether a break is active, ended, or expired.</li>
              <li><strong>Technical and support data:</strong> IP address and basic browser/device information sent when you use the service, plus any device details or contact information you choose to include in a support request.</li>
              <li><strong>Support requests:</strong> Message text and any optional ticket, screening, or contact details submitted through the support form.</li>
              <li><strong>Camera access:</strong> If you choose Scan ticket QR, the scanner accesses the camera to decode a ticket or claim code. PottyPlay does not save camera images; manual ticket entry remains available if you decline or cannot grant camera permission.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              3. Purposes and Legal Basis of Processing
            </h2>
            <p>
              We process personal data under lawful bases recognized by Tanzanian law:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Contract Performance:</strong> Authenticating valid ticket entitlements, authorizing synchronized mobile streams, and delivering audio-visual feeds during patron intermissions.</li>
              <li><strong>Explicit Consent:</strong> Explicit user acceptance of this Privacy Policy and Terms of Service upon account registration.</li>
              <li><strong>Legitimate Interests & Studio Compliance:</strong> Preventing unauthorized stream duplication, enforcing the strict 15-minute viewing cap, preventing ticket link sharing, and generating anonymous commercial usage tallies for cinema exhibitors.</li>
              <li><strong>Legal Compliance:</strong> Retaining mandatory audit logs and financial records as mandated by Tanzanian tax and electronic transaction legislation.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              4. SMS and Email Communications
            </h2>
            <p>
              Account emails are sent through Resend and phone verification messages through Africa&apos;s Talking. Verification codes are time-limited. These providers receive recipient addresses or phone numbers and message content as needed to deliver the requested verification or account email. We do not send marketing messages through these verification flows.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              5. Data Sharing and Theatrical Circuit Partners
            </h2>
            <p>
              PottyPlay is not a data broker. We do not sell, rent, or trade patron personal information. Data is processed by Resend for email, Africa&apos;s Talking for text messages, and the hosting and database providers selected for the deployed service. The service operator must identify the actual hosting/database providers and processing locations in this policy before publication. Cinema partners receive information required to validate ticket eligibility and operate authorized breaks.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>The participating cinema venue:</strong> Ticket and session information needed to validate admission and support an authorized session.</li>
              <li><strong>Service providers:</strong> Resend for email, Africa&apos;s Talking for SMS, and the hosting/database providers configured by the service operator.</li>
              <li><strong>Law Enforcement or Statutory Authorities:</strong> Only when strictly mandated by valid legal process or court order under Tanzanian jurisdiction.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              6. Data Retention and Account Deletion
            </h2>
            <p>
              You can request account deletion through Settings or the public account deletion page. After confirmation, account access and active breaks are stopped. After a 30-day grace period, account contact details, linked support content, ticket-holder names, claim codes, device information, and personal details linked to breaks are anonymized. Cinema ticket numbers and related session or billing records may remain for exhibitor reconciliation or legal obligations. The service operator must publish applicable retention periods and reasons here.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              7. Security Safeguards
            </h2>
            <p>
              We implement comprehensive technical and organizational safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Passwords are stored using one-way protection and are not kept in readable form.</li>
              <li>HTTPS is used to protect information sent between your device and the service.</li>
              <li>Access controls limit cinema partners to information needed for their own screenings.</li>
              <li>Video access links are signed and expire quickly.</li>
              <li>Breaks end automatically after 15 minutes.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              8. Your Statutory Rights and Complaints
            </h2>
            <p>
              To ask about personal data or submit a privacy request, use the public support form. The service operator&apos;s legal name and postal contact details must be published here before this policy is used.
            </p>
            <a href="/support/#contact" className="inline-flex p-3 rounded-xl bg-field border border-line text-xs font-semibold text-ink underline">Open the privacy and support request form</a>
            <p className="text-xs text-muted">
              If you believe your personal data has been handled inconsistently with the law, you retain the right to lodge a complaint with the Personal Data Protection Commission (PDPC) of Tanzania.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line bg-bg py-6 px-4 text-center text-xs text-muted">
        PottyPlay &bull; United Republic of Tanzania
      </footer>
    </div>
  );
}
