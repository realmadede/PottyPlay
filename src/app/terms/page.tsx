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
            Version 2026-11-v1 &bull; Effective Date: November 3, 2026 &bull; Governing Jurisdiction: United Republic of Tanzania
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
              PottyPlay lets eligible ticket holders at participating cinemas follow the current screening on a phone during a short break. Viewing is available only for an active, verified screening and ends automatically.
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
              <li>Meet the minimum age required by the laws that apply where you use the service. Parent or guardian consent must be obtained where required by law.</li>
              <li>Provide accurate, truthful registration information (full name, verified telephone number, and valid email address).</li>
              <li>Verify the phone number and email address associated with the account.</li>
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
              <li><strong>Maximum Break Duration:</strong> Each companion break lasts up to <strong>15 minutes</strong>. Playback ends automatically when the timer reaches zero.</li>
              <li><strong>Break Allowances:</strong> A maximum of <strong>two (2) breaks</strong> are permitted per eligible movie ticket.</li>
              <li><strong>No Recording or Rewind:</strong> Companion playback follows the screening. Rewinding, fast-forwarding, or seeking to another point in the film is not available.</li>
              <li><strong>One Device at a Time:</strong> A ticket can only be used on one device at a time. Additional attempts to use the same ticket are blocked.</li>
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
              <li>Record, capture screenshots of, mirror to unauthorized public displays, or redistribute the stream.</li>
              <li>Attempt to bypass playback protections or access controls.</li>
              <li>Circumvent or tamper with session duration enforcement, watermarking, or territorial rights constraints.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              5. Cinema Partners and Ticket Synchronization
            </h2>
            <p>
              PottyPlay works with participating cinema ticketing and screening systems, including systems such as Vista, Veezi, and RTS. The cinema supplies admission status, screening schedules, and auditorium assignments. PottyPlay is not responsible for theater scheduling changes, projector equipment breakdowns, or ticket refunds administered by the cinema.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              6. Pricing, Payments, and Amenity Models
            </h2>
            <p>
              Participating cinemas set any fee for companion viewing. Depending on the venue, it may be complimentary or carry a per-break charge. Any applicable taxes will be shown when a charge is confirmed.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              7. Disclaimer of Warranties and Limitation of Liability
            </h2>
            <p>
              The companion viewing stream is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. PottyPlay works to keep playback aligned with the cinema screening, but network conditions may affect stream quality or cause delays. PottyPlay shall not be liable for missed dialogue or brief playback delays.
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
            <a href="/support/#contact" className="inline-flex p-3 rounded-xl bg-field border border-line text-xs font-semibold text-ink underline">Contact PottyPlay through the public support form</a>
            <p className="text-xs text-muted">
              The publisher must provide the legal identity and postal address of the operating entity and obtain jurisdiction-specific legal review before public release.
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
