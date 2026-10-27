"use client";

import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import {
  Film,
  Clock,
  ShieldCheck,
  Tv,
  CheckCircle2,
  Lock,
  ArrowRight,
  Smartphone,
  Sliders,
  FileCheck,
} from "lucide-react";

export default function BusinessLandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-brand-bg text-brand-text-primary selection:bg-brand-primary/40 selection:text-brand-text-primary">
      <LandingHeader />

      <main className="flex-1 flex flex-col">
        {/* Section 1: Hero */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-xs font-medium text-brand-text-secondary mb-6 shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span>Dedicated Cinema Companion Technology</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-brand-text-primary max-w-3xl mx-auto leading-[1.12]">
            Never miss the scene that changes everything.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
            PottyPlay allows authenticated cinema patrons to temporarily follow an ongoing theatrical screening on their personal mobile device during a brief intermission.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/watch"
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-semibold text-sm bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2"
            >
              <span>Launch Companion Player</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#contact"
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-medium text-sm bg-brand-surface text-brand-text-primary hover:bg-neutral-50 border border-brand-border transition-all flex items-center justify-center"
            >
              Request Operator Pilot
            </a>
          </div>

          <p className="mt-4 text-xs text-brand-text-secondary">
            Strict 15-minute server-enforced duration limit. Preserves theatrical exclusivity.
          </p>

          {/* Section 2: Product Visualization */}
          <div className="mt-14 max-w-sm sm:max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-elevated text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-status-success animate-ping" />
                <span className="font-semibold text-brand-text-primary">Auditorium Screen 1</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-bg font-mono font-medium text-brand-text-secondary text-[11px] border border-brand-border">
                Seat A12
              </span>
            </div>

            {/* Simulated Player Viewport */}
            <div className="relative rounded-xl overflow-hidden aspect-video bg-neutral-900 border border-neutral-800 flex flex-col justify-between p-3 text-white">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-medium tracking-wide text-neutral-300">
                  SERENGETI SHADOWS
                </span>
                <span className="font-mono text-emerald-400">SYNCED 1080P</span>
              </div>

              <div className="text-center py-4">
                <div className="inline-block p-2 rounded-full bg-white/10 backdrop-blur-sm text-neutral-200">
                  <Film className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-mono text-neutral-400 mt-2">
                  Authoritative Timeline: 12:44
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-neutral-400">
                <span>Projection Timecode</span>
                <span className="font-mono text-brand-primary">00:12:44:12</span>
              </div>
            </div>

            {/* Time Remaining Bar */}
            <div className="p-3 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-secondary" />
                <span className="text-brand-text-secondary">Authorized Break:</span>
              </div>
              <span className="font-mono font-bold text-sm text-brand-text-primary">
                14:48 Remaining
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" className="py-16 md:py-24 bg-brand-surface border-y border-brand-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-secondary mb-2">
                Workflow
              </h2>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text-primary">
                A seamless, authorized journey in three steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/20 text-brand-accent font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Scan Seat QR Code
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Patron scans the QR code affixed to their seat armrest or opens their ticket pass. The application resolves the specific auditorium and scheduled film.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/20 text-brand-accent font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Entitlement Verification
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  The backend validates ticket admission, rights entitlement, and single-device allocation. Returning patrons with active sessions start without re-authenticating.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/20 text-brand-accent font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Synchronized Intermission
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Playback seeks to the exact position of the ongoing theater projection. A hard 15-minute server expiration ensures patrons return to the auditorium.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Benefits for Patrons & Operators */}
        <section id="patron-benefits" className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary block mb-1">
                  Patron Experience
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text-primary">
                  Peace of mind without theatrical disruption.
                </h2>
              </div>

              <p className="text-sm text-brand-text-secondary leading-relaxed">
                Parents stepping out with children, patrons needing an urgent restroom break, or moviegoers picking up concessions no longer face the dilemma of missing pivotal scenes.
              </p>

              <div className="space-y-3 text-xs text-brand-text-primary">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-status-success flex-shrink-0 mt-0.5" />
                  <span><strong>Zero App Install Friction:</strong> Instant playback via mobile web or native application wrapper.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-status-success flex-shrink-0 mt-0.5" />
                  <span><strong>Frame-Level Timeline Alignment:</strong> Stream matches the main auditorium projector accurately.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-status-success flex-shrink-0 mt-0.5" />
                  <span><strong>Gentle Audible Reminders:</strong> Alerts patron when under 2 minutes remain to return quietly.</span>
                </div>
              </div>
            </div>

            <div id="operator-benefits" className="p-6 sm:p-8 rounded-2xl bg-brand-surface border border-brand-border space-y-6 shadow-subtle">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary block mb-1">
                  Theater Operations
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-text-primary">
                  Engineered to protect theatrical value.
                </h3>
              </div>

              <p className="text-xs text-brand-text-secondary leading-relaxed">
                PottyPlay is purposefully built not as a streaming service, but as an on-premise cinema amenity designed to enhance retention while strictly guarding content.
              </p>

              <div className="space-y-3 text-xs text-brand-text-primary">
                <div className="flex items-start space-x-3">
                  <Lock className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5" />
                  <span><strong>900-Second Hard Stop:</strong> Playback tokens terminate irrevocably on the server at 15 minutes.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5" />
                  <span><strong>One Ticket, One Stream:</strong> Prevents credential sharing or duplicate streaming through atomic database locks.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Sliders className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5" />
                  <span><strong>Instant Operator Revocation:</strong> Ushers and floor managers can terminate unauthorized sessions on demand.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Security & Synchronization */}
        <section id="security" className="py-16 md:py-24 bg-brand-surface border-t border-brand-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-secondary mb-2">
                Security & Architecture
              </h2>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text-primary">
                Rigorous controls from projection booth to pocket.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                <Tv className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-sm text-brand-text-primary">
                  Authoritative Clock
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  The client does not determine playback progress. The backend calculates position from verified projector state, accounting for pauses and delayed starts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                <FileCheck className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-sm text-brand-text-primary">
                  Content Rights Verification
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Every screening references an explicit rights authorization record. Unlicensed assets or expired authorization windows fail closed.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border space-y-3">
                <Smartphone className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-sm text-brand-text-primary">
                  Africa&apos;s Talking SMS
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Secure two-factor validation utilizing Africa&apos;s Talking messaging infrastructure for account enrollment, recovery, and security verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Contact / Pilot CTA */}
        <section id="contact" className="py-16 md:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text-primary">
            Partner with PottyPlay
          </h2>
          <p className="text-sm text-brand-text-secondary max-w-lg mx-auto leading-relaxed">
            Interested in piloting companion viewing at your theater chain or cinema venue? Get in touch with our team to explore integration options.
          </p>

          <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-subtle text-left max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-text-primary mb-1">
                Cinema Circuit / Organization
              </label>
              <input
                type="text"
                placeholder="e.g. Tanzanian Cinema Group"
                className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 px-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-primary mb-1">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="operations@cinemagroup.com"
                className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 px-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Thank you. Our partnership team will contact your organization.")}
              className="w-full py-3 rounded-xl font-semibold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-colors"
            >
              Submit Pilot Inquiry
            </button>
          </div>
        </section>
      </main>

      {/* Section 7: Footer */}
      <footer className="border-t border-brand-border bg-brand-surface py-10 px-4 sm:px-6 lg:px-8 text-xs text-brand-text-secondary">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-brand-text-primary">PottyPlay</span>
            <span>&bull;</span>
            <span>Cinema Companion Viewing Platform</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/watch" className="hover:text-brand-text-primary transition-colors">
              Patron Web App
            </Link>
            <a href="#security" className="hover:text-brand-text-primary transition-colors">
              Security
            </a>
            <span className="text-neutral-400">
              Commercial Cinema Partner Pilot 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
