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
            Version 2026-10-v1 &bull; Effective Date: October 28, 2026 &bull; Governing Jurisdiction: United Republic of Tanzania
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
              <strong>Notice Regarding Corporate Details:</strong> PottyPlay operates as a specialized theatrical technology platform. Specific BRELA company incorporation numbers, registered office municipal details, and formal data protection officer appointments will be updated upon finalization of partner circuit rollout and formal commission registration.
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
              <li><strong>Customer Account Credentials:</strong> Full name, telephone number, email address, and cryptographically hashed passwords (Argon2id). Plaintext passwords are never stored or transmitted.</li>
              <li><strong>Verification Records:</strong> SMS one-time password (OTP) verification records and email ownership verification challenge timestamps.</li>
              <li><strong>Ticket & Screening Data:</strong> Cinema ticket barcodes, claim tokens, seat assignments, screening titles, screen identifiers, and cinema venue identifiers.</li>
              <li><strong>Viewing & Telemetry Records:</strong> Break session start time, duration (strictly capped at 900 seconds), last playback position timestamp, heartbeat pings, and session status (Active, Expired, Revoked).</li>
              <li><strong>Technical Identifiers:</strong> Operating system, browser user agent, IP address for security rate-limiting, and screen dimensions to calibrate video playback.</li>
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
              Telephone verification SMS messages are transmitted via authorized telecommunication aggregators, including Africa&apos;s Talking. OTP verification codes expire within 5 minutes. We do not transmit unsolicited commercial marketing messages without explicit separate consent.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              5. Data Sharing and Theatrical Circuit Partners
            </h2>
            <p>
              PottyPlay is not a data broker. We do not sell, rent, or trade patron personal information. We share data only with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>The Participating Cinema Venue:</strong> Only the specific exhibitor where you hold a ticket receives verification confirmations, seat numbers, and break telemetry for usher management.</li>
              <li><strong>Infrastructure Processors:</strong> Secured cloud infrastructure providers and telecommunication aggregators bound by strict confidentiality and data protection agreements.</li>
              <li><strong>Law Enforcement or Statutory Authorities:</strong> Only when strictly mandated by valid legal process or court order under Tanzanian jurisdiction.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              6. Data Retention and Account Deletion
            </h2>
            <p>
              We retain personal data only for as long as your account remains active. Patrons may submit an account deletion request at any time through the Customer Application Settings tab. Upon receipt of a deletion request, personal identifiers, contact credentials, and viewing histories are queued for permanent deletion within 30 business days, subject to statutory retention requirements.
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
              <li>Passphrases hashed using memory-hard Argon2id.</li>
              <li>All network transmissions encrypted using TLS 1.3 / HTTPS.</li>
              <li>Database tenant isolation separating cinema circuits.</li>
              <li>Signed, ephemeral video stream manifests expiring every 6 seconds.</li>
              <li>Strict server-side 900-second automatic disconnection.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              8. Your Statutory Rights and Complaints
            </h2>
            <p>
              Under the Personal Data Protection Act, 2022, you have the right to request access to your personal data, request rectification of inaccurate records, object to processing, or request data deletion. To exercise these rights or lodge an inquiry, contact our data privacy team at:
            </p>
            <div className="p-4 rounded-xl bg-field border border-line font-mono text-xs text-ink">
              Email: privacy@pottyplay.internal<br />
              Subject: Data Protection Inquiry / PDPA Request
            </div>
            <p className="text-xs text-muted">
              If you believe your personal data has been handled inconsistently with the law, you retain the right to lodge a complaint with the Personal Data Protection Commission (PDPC) of Tanzania.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line bg-bg py-6 px-4 text-center text-xs text-muted">
        PottyPlay &bull; Legal Department &bull; United Republic of Tanzania
      </footer>
    </div>
  );
}
