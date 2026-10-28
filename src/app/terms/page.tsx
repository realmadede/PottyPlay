"use client";

import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
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
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Customer & Partner Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            Version 2026-10-v1 &bull; Effective Date: October 28, 2026 &bull; Governing Jurisdiction: United Republic of Tanzania
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
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
            <h2 className="text-base sm:text-lg font-bold text-ink">
              2. Eligibility and Account Obligations
            </h2>
            <p>
              To access PottyPlay companion viewing features, you must:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Be at least 18 years of age, or have the consent of a parent or legal guardian.</li>
              <li>Provide accurate, truthful registration information (full name, verified telephone number, and valid email address).</li>
              <li>Complete two-stage authentication (SMS OTP phone verification and email ownership verification).</li>
              <li>Hold a valid, paid admission ticket issued by an authorized cinema circuit for an ongoing screening.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              3. Strict Operational Limitations & Session Bounds
            </h2>
            <p>
              To protect the commercial rights of filmmakers, studios, and exhibition circuits, companion playback is governed by mandatory operational rules:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Maximum Session Duration:</strong> Each companion intermission session is capped at a strict hard limit of <strong>900 seconds (15 minutes)</strong>. Playback ceases automatically when the timer reaches zero.</li>
              <li><strong>Break Allowances:</strong> A maximum of <strong>two (2) bathroom intermission sessions</strong> are permitted per valid movie ticket.</li>
              <li><strong>No Archival or Rewind:</strong> Companion streams follow live projection. Rewinding, fast-forwarding, pause buffering, or seeking to arbitrary film timestamps is prohibited and technologically disabled.</li>
              <li><strong>Single-Device Concurrency:</strong> A ticket entitlement can only be claimed on one device simultaneously. Simultaneous streams under the same ticket barcode will fail closed.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              4. Studio Rights & Intellectual Property Protection
            </h2>
            <p>
              All cinematographic works, audiovisual feeds, audio tracks, and promotional materials streamed via PottyPlay remain the exclusive intellectual property of the respective studios, filmmakers, and copyright holders.
            </p>
            <p>
              You are granted a strictly revocable, non-exclusive, non-transferable, temporary license to view the feed solely during an authorized intermission. You shall not:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Record, rip, capture, capture screenshot series, screen-mirror to unauthorized public displays, or redistribute the stream.</li>
              <li>Reverse engineer or attempt to decrypt ephemeral HLS stream chunks or authorization tokens.</li>
              <li>Circumvent or tamper with session duration enforcement, watermarking, or territorial rights constraints.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              5. Cinema Partners and Ticket Synchronization
            </h2>
            <p>
              PottyPlay synchronizes with cinema POS ticketing systems (e.g., Vista, Veezi, RTS). Admission status, screening schedules, and auditorium assignments are supplied by the exhibitor. PottyPlay is not responsible for theater scheduling changes, projector equipment breakdowns, or ticketing refunds administered by the cinema.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              6. Pricing, Payments, and Amenity Models
            </h2>
            <p>
              Companion viewing pricing models are established by participating cinema partners. Depending on the venue, PottyPlay may be provided as a complimentary customer loyalty amenity or as a nominal per-session micro-service. All applicable statutory duties and value-added taxes under Tanzanian revenue laws are reflected at the point of confirmation.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              7. Disclaimer of Warranties and Limitation of Liability
            </h2>
            <p>
              The companion viewing stream is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. While we endeavor to maintain sub-second projection synchronization, local network interference or weak cellular signals in cinema corridors may affect stream quality. PottyPlay shall not be liable for missed movie dialogue or minor stream latencies.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              8. Account Suspension and Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, attempt to bypass verification limits, share credentials, or abuse platform infrastructure.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              9. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the <strong>United Republic of Tanzania</strong>. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of the United Republic of Tanzania.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              10. Contact and Legal Inquiries
            </h2>
            <div className="p-4 rounded-xl bg-field border border-line font-mono text-xs text-ink">
              Email: legal@pottyplay.internal<br />
              Subject: Terms of Service Inquiry
            </div>
            <p className="text-xs text-muted">
              Note: This agreement must be reviewed by a qualified Tanzanian legal practitioner prior to commercial public launch.
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
