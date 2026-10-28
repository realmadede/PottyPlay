"use client";

import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { HeroCarousel } from "@/components/HeroCarousel";
import { PartnerRegistrationForm } from "@/components/PartnerRegistrationForm";
import { BrandLogo } from "@/components/BrandLogo";
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
  Zap,
  Activity,
  Layers,
  HelpCircle,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function BusinessLandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-brand-bg text-brand-text-primary selection:bg-brand-primary/30 selection:text-brand-text-primary">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-1 flex flex-col">
        {/* 1. Hero Carousel */}
        <HeroCarousel />

        {/* 2. Clear Product Proposition (Asymmetric Editorial Layout) */}
        <section
          id="proposition"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Narrative Pillar */}
            <div className="lg:col-span-5 flex flex-col text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
                Product Definition & Philosophy
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-brand-text-primary tracking-tight leading-[1.12]">
                A Purpose-Built Cinema Companion. Not a Streaming Platform.
              </h2>
              <p className="mt-5 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
                PottyPlay is engineered specifically to solve mid-movie patron anxiety. We enable authenticated ticket holders to briefly follow an ongoing theatrical screening during necessary bathroom intermissions without compromising box-office sanctity.
              </p>

              <div className="mt-8 p-5 rounded-2xl bg-white border border-brand-border shadow-subtle flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide text-brand-text-primary">
                    Theatrical Exclusivity
                  </div>
                  <div className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                    Designed from the ground up to protect theater admissions. Never a public video library or streaming competitor.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Architectural Sequence (3 Tiers, not identical box cards) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Tier 1 */}
              <div className="p-5 sm:p-7 rounded-2xl bg-white border border-brand-border shadow-subtle hover:border-brand-primary/40 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-primary/15 text-brand-primary font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      01
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-brand-text-primary">
                      Strictly Controlled Exclusivity
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    Preserves Window
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-brand-text-secondary leading-relaxed sm:pl-10">
                  Viewing access is tethered directly to a verified, ongoing cinema screening. Access expires permanently after 900 seconds. No video library, no rewinding, and no home streaming.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="p-5 sm:p-7 rounded-2xl bg-white border border-brand-border shadow-subtle hover:border-brand-primary/40 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-primary/15 text-brand-primary font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      02
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-brand-text-primary">
                      Zero Drift Synchronization
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    Sub-Second Precision
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-brand-text-secondary leading-relaxed sm:pl-10">
                  The cinema projector remains the authoritative clock. If the theater pauses, the companion pauses. When the patron returns, they are precisely aligned with the auditorium screen.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="p-5 sm:p-7 rounded-2xl bg-white border border-brand-border shadow-subtle hover:border-brand-primary/40 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-primary/15 text-brand-primary font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      03
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-brand-text-primary">
                      Native POS & TMS Compatibility
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    Plug-and-Play
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-brand-text-secondary leading-relaxed sm:pl-10">
                  Integrates cleanly with industry standard ticketing engines (Vista, Veezi, RTS) and theater management servers (Dolby, Barco, Christie) through lightweight webhooks and APIs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How PottyPlay Works (Continuous Filmstrip Workflow) */}
        <section
          id="how-it-works"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Operational Sequence
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              How PottyPlay Operates
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary">
              A frictionless four-stage lifecycle from ticket purchase to auditorium return.
            </p>
          </div>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between text-left relative group hover:shadow-card transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                  <span className="text-xs font-mono font-bold text-brand-primary">STEP 01</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">POS Level</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-brand-text-primary">
                  Ticket Entitlement
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Patron purchases a movie ticket. The cinema POS provisions an encrypted ticket barcode and optional entry claim token.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                POS Webhook Sync
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between text-left relative group hover:shadow-card transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                  <span className="text-xs font-mono font-bold text-brand-primary">STEP 02</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Trigger</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-brand-text-primary">
                  Intermission Trigger
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  During a bathroom break, the patron scans an auditorium entry code or opens their pre-authenticated PottyPlay customer application.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                One-Tap Activation
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between text-left relative group hover:shadow-card transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                  <span className="text-xs font-mono font-bold text-brand-primary">STEP 03</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Continuous</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-brand-text-primary">
                  Synchronized Companion
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  The server validates cinema rights, confirms screening state, and streams companion feed locked to the live theater timestamp.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                Live Projection Lock
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between text-left relative group hover:shadow-card transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                  <span className="text-xs font-mono font-bold text-brand-primary">STEP 04</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Enforcement</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-brand-text-primary">
                  Automatic Termination
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  At 900 seconds (or when the patron taps return), the session revokes. The patron walks back to their auditorium seat without missing context.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                15m Server Revocation
              </div>
            </div>
          </div>
        </section>

        {/* 4. Patron Experience */}
        <section
          id="patron-experience"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
                Designed for Effortless Ease
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
                Frictionless for Patrons. No Forced App Installs.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
                Whether a customer uses our lightweight native app on Android and iOS (Capacitor) or simply scans a QR code in the cinema corridor via standard mobile Safari or Chrome, the experience starts in seconds.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-text-primary">Instant Web Onboarding</h4>
                    <p className="text-xs text-brand-text-secondary mt-0.5 leading-relaxed">
                      Direct QR access launches an optimized web companion player immediately. No App Store detour required during an urgent break.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-text-primary">Persistent Mobile Identity</h4>
                    <p className="text-xs text-brand-text-secondary mt-0.5 leading-relaxed">
                      Frequent moviegoers retain secure sessions across app launches with verified phone numbers or social single sign-on.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-text-primary">Audible Return Reminders</h4>
                    <p className="text-xs text-brand-text-secondary mt-0.5 leading-relaxed">
                      Soft countdown pings at 12 and 14 minutes encourage patrons to head back, ensuring halls and lobbies remain orderly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Theatrical Preview Frame */}
            <div className="lg:col-span-6 bg-brand-accent text-white p-6 sm:p-8 rounded-3xl shadow-elevated border border-neutral-800 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 text-xs">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-brand-primary" />
                  <span className="font-bold text-neutral-200">Mobile Companion Viewport</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                  ACTIVE 1080P
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col justify-between p-4 text-white">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-neutral-400">AUDITORIUM 01: ATMOS</span>
                    <span className="font-mono text-brand-primary font-bold">SEAT A12</span>
                  </div>

                  <div className="text-center my-auto py-2">
                    <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest tabular-nums">
                      00:42:15.08
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">
                      Authoritative Master Feed
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80">
                    <span>15m Session Window</span>
                    <span className="font-mono text-brand-primary font-bold tabular-nums">13:45 REMAINING</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Return to Auditorium:</span>
                  <span className="font-bold text-emerald-400">Seat A12 Admitted</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Cinema Operator Benefits */}
        <section
          id="operator-benefits"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Exhibitor Commercial Advantage
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Engineered for Theater Commercial Success
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
              Transform the inevitable bathroom interruption into an elevated customer loyalty experience that drives repeat attendance.
            </p>
          </div>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-4">
                  <Film className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Higher Concession & Ticket Satisfaction
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Eliminates patron fear of missing key scenes. Moviegoers buy larger drinks and snacks with peace of mind.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700">
                Reduced Patron Anxiety
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Zero Piracy Risk
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Hardware-backed short streams, dynamic watermarks, and no rewind controls ensure theatrical exclusivity is 100% preserved.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700">
                Hardware-Enforced Security
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Commercial Revenue Model
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Exhibitors participate in companion session monetization or offer the amenity as a premium ticket differentiator.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700">
                Configurable Pricing
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Real-Time Usher & Hall Telemetry
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Monitor ongoing breaks per auditorium. Identify hall traffic patterns and assist patrons returning to seats.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700">
                Live Usher Dashboard
              </div>
            </div>
          </div>
        </section>

        {/* 6. Screening Synchronization (Cinematic Charcoal Surface) */}
        <section
          id="synchronization"
          className="py-16 md:py-24 bg-brand-accent text-white border-t border-neutral-800 w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Sub-Second Precision Architecture
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Zero-Drift Projection Locking
              </h2>
              <p className="mt-4 text-sm sm:text-base text-neutral-400 leading-relaxed">
                The patron&apos;s mobile device never determines the movie timeline. The backend server tracks projector state in real time.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center mb-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Authoritative Clock</h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                    Server tracks the master theater clock, factoring in projector start delays and unexpected show interruptions.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-neutral-800 text-[11px] font-mono text-emerald-400">
                  Sub-Second Sync
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center mb-4">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Dynamic Pause Handling</h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                    If the cinema operator pauses the auditorium projector for technical reasons, all companion streams pause instantaneously.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-neutral-800 text-[11px] font-mono text-emerald-400">
                  Zero Drift on Resume
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center mb-4">
                    <Tv className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Resilient Corridors</h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                    Adaptive bitrate streaming ensures continuity even in deep restroom corridors or low-reception theater facilities.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-neutral-800 text-[11px] font-mono text-emerald-400">
                  Adaptive Bitrate
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Ticketing and Integration Model */}
        <section
          id="ticketing-integration"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Seamless Deployment
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Frictionless POS & Screening Interoperability
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
              PottyPlay does not replace your ticketing software or require custom auditorium hardware.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="font-extrabold text-base text-brand-text-primary">Vista Cinema POS</div>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Connect via standard Vista Connect webhook events on ticket admission and refund.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="font-extrabold text-base text-brand-text-primary">Veezi Cloud Ticketing</div>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Native REST synchronization for independent cinema circuits and boutique theaters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="font-extrabold text-base text-brand-text-primary">Ready Theatre Systems</div>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Reliable barcode payload mapping for RTS POS barcode scanners and kiosks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="font-extrabold text-base text-brand-text-primary">Custom Exhibitor APIs</div>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Direct JSON webhooks and REST endpoints for proprietary exhibitor applications.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Security and Entitlement Controls */}
        <section
          id="security"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
                Studio Security & Rights
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
                Studio-Grade Content Protection
              </h2>
              <p className="mt-4 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
                Hollywood content owners and local distributors demand non-negotiable stream controls. PottyPlay enforces studio-grade security boundaries at the API and streaming protocol layer.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-3 text-left">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
                <div className="font-bold text-sm text-brand-text-primary">Session Duration Enforcement</div>
                <div className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  A strict, server-side 900-second (15-minute) timer terminates the feed automatically. No extensions allowed.
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
                <div className="font-bold text-sm text-brand-text-primary">Single-Device Locking</div>
                <div className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Each ticket barcode or claim token can only power one active companion session at a time, preventing link sharing.
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
                <div className="font-bold text-sm text-brand-text-primary">Encrypted Ephemeral Streams</div>
                <div className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Video chunks are dynamically signed and expire in seconds. Recording or ripping feeds yields unplayable fragments.
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-subtle">
                <div className="font-bold text-sm text-brand-text-primary">Explicit Rights Authorization</div>
                <div className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Every screening references a verified digital rights record. Unlicensed assets or expired windows fail closed.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Cinema Partnership Process */}
        <section
          id="partnership-process"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Exhibitor Roadmap
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Seamless Onboarding for Cinema Circuits
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
              Four structured steps to pilot and roll out PottyPlay across your venues.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-mono font-bold text-brand-primary">STAGE 01</div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">Partner Registration</h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Submit circuit details, venue counts, and ticketing systems through our partner portal.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-mono font-bold text-brand-primary">STAGE 02</div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">System Compatibility Check</h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Our solutions engineering team tests webhook connectivity with your POS and TMS servers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-mono font-bold text-brand-primary">STAGE 03</div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">Single-Screen Pilot</h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Pilot the companion experience on a single flagship auditorium with live moviegoers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-mono font-bold text-brand-primary">STAGE 04</div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">Circuit Rollout</h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Deploy QR codes across theater restrooms and enable companion streaming circuit-wide.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Developer Integration Overview */}
        <section
          id="developer-overview"
          className="py-16 md:py-24 bg-brand-accent text-white border-t border-neutral-800 w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Engineering Documentation & OpenAPI
                </span>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Open APIs & Standard Webhooks
                </h2>
                <p className="mt-4 text-sm sm:text-base text-neutral-400 leading-relaxed">
                  Integrate your POS or ticketing software with clean, standards-compliant REST endpoints and HMAC-signed webhook dispatches.
                </p>

                <div className="mt-8 flex items-center space-x-4">
                  <Link
                    href="/developers"
                    className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-colors flex items-center space-x-2"
                  >
                    <span>Read API Specifications</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="/api/openapi.json"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs sm:text-sm text-neutral-300 hover:text-white font-mono flex items-center space-x-1.5"
                  >
                    <span>openapi.json</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl bg-neutral-900 border border-neutral-800 p-5 font-mono text-xs overflow-x-auto text-neutral-300">
                <div className="text-neutral-500 mb-2">{"// Webhook payload received on patron admission"}</div>
                <pre className="text-emerald-400">{`POST /api/webhooks/pottyplay/tickets
Content-Type: application/json
X-PottyPlay-Signature: sha256=...

{
  "event": "ticket.admitted",
  "cinemaId": "cinema_circuit_01",
  "screeningId": "screening_auditorium_01",
  "ticketNumber": "TK-8842-A12",
  "claimToken": "CLM-A12-9901",
  "maxBreaks": 2,
  "maxSessionSeconds": 900
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Partner Registration Call to Action */}
        <section
          id="register"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Cinema Onboarding
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Register Your Cinema Circuit
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
              Join leading cinema exhibitors. Connect your auditoriums and offer companion viewing to your patrons.
            </p>
          </div>

          <PartnerRegistrationForm />
        </section>
      </main>

      {/* 12. Footer with Legal & Company Info */}
      <footer className="border-t border-brand-border bg-brand-surface py-12 px-4 sm:px-6 lg:px-8 text-xs text-brand-text-secondary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <BrandLogo size="sm" variant="full" href="/" />
            <span className="hidden sm:inline text-neutral-300">&bull;</span>
            <span className="text-neutral-500 text-center sm:text-left">
              Authoritative Cinema Companion Viewing Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-brand-text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/developers" className="hover:text-brand-text-primary transition-colors">
              Developer Documentation
            </Link>
            <span className="text-neutral-400">
              Commercial Cinema Partner Portal 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
