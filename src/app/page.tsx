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
    <div className="flex-1 flex flex-col bg-bg text-ink selection:bg-amber-500/30 selection:text-ink">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-1 flex flex-col">
        {/* 1. Hero Carousel */}
        <HeroCarousel />

        {/* 2. Clear Product Proposition (Asymmetric Editorial Layout) */}
        <section
          id="proposition"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Narrative Pillar */}
            <div className="lg:col-span-5 flex flex-col text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Product Definition & Philosophy
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight leading-[1.12]">
                A Purpose-Built Cinema Companion. Not a Streaming Platform.
              </h2>
              <p className="mt-5 text-sm sm:text-base text-muted leading-relaxed">
                PottyPlay is engineered specifically to solve mid-movie patron anxiety. We enable authenticated ticket holders to briefly follow an ongoing theatrical screening during necessary bathroom intermissions without compromising box-office sanctity.
              </p>

              <div className="mt-8 p-5 rounded-2xl bg-field border border-line shadow-card flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide text-ink">
                    Theatrical Exclusivity
                  </div>
                  <div className="text-xs text-muted mt-1 leading-relaxed">
                    Designed from the ground up to protect theater admissions. Never a public video library or streaming competitor.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Architectural Sequence (3 Tiers, not identical box cards) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Tier 1 */}
              <div className="p-5 sm:p-7 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      01
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-ink">
                      Strictly Controlled Exclusivity
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                    Preserves Window
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed sm:pl-10">
                  Viewing access is tethered directly to a verified, ongoing cinema screening. Access expires permanently after 900 seconds. No video library, no rewinding, and no home streaming.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="p-5 sm:p-7 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      02
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-ink">
                      Zero Drift Synchronization
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                    Sub-Second Precision
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed sm:pl-10">
                  The cinema projector remains the authoritative clock. If the theater pauses, the companion pauses. When the patron returns, they are precisely aligned with the auditorium screen.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="p-5 sm:p-7 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs font-black flex items-center justify-center flex-shrink-0">
                      03
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-ink">
                      Native POS & TMS Compatibility
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                    Plug-and-Play
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed sm:pl-10">
                  Integrates cleanly with industry standard ticketing engines (Vista, Veezi, RTS) and theater management servers (Dolby, Barco, Christie) through lightweight webhooks and APIs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How PottyPlay Works (Continuous Filmstrip Workflow) */}
        <section
          id="how-it-works"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Operational Sequence
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              How PottyPlay Operates
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted">
              A frictionless four-stage lifecycle from ticket purchase to auditorium return.
            </p>
          </div>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between text-left relative group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <span className="text-xs font-mono font-bold text-amber-400">STEP 01</span>
                  <span className="text-[10px] uppercase font-bold text-muted">POS Level</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-ink">
                  Ticket Entitlement
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Patron purchases a movie ticket. The cinema POS provisions an encrypted ticket barcode and optional entry claim token.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-line text-[11px] text-muted font-mono">
                POS Webhook Sync
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between text-left relative group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <span className="text-xs font-mono font-bold text-amber-400">STEP 02</span>
                  <span className="text-[10px] uppercase font-bold text-muted">Trigger</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-ink">
                  Intermission Trigger
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  During a bathroom break, the patron scans an auditorium entry code or opens their pre-authenticated PottyPlay customer application.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-line text-[11px] text-muted font-mono">
                One-Tap Activation
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between text-left relative group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <span className="text-xs font-mono font-bold text-amber-400">STEP 03</span>
                  <span className="text-[10px] uppercase font-bold text-muted">Continuous</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-ink">
                  Synchronized Companion
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  The server validates cinema rights, confirms screening state, and streams companion feed locked to the live theater timestamp.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-line text-[11px] text-muted font-mono">
                Live Projection Lock
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between text-left relative group hover:border-amber-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <span className="text-xs font-mono font-bold text-amber-400">STEP 04</span>
                  <span className="text-[10px] uppercase font-bold text-muted">Enforcement</span>
                </div>
                <h3 className="mt-3.5 font-bold text-base text-ink">
                  Automatic Termination
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  At 900 seconds (or when the patron taps return), the session revokes. The patron walks back to their auditorium seat without missing context.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-line text-[11px] text-muted font-mono">
                15m Server Revocation
              </div>
            </div>
          </div>
        </section>

        {/* 4. Patron Experience */}
        <section
          id="patron-experience"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Designed for Effortless Ease
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                Frictionless for Patrons. No Forced App Installs.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
                Whether a customer uses our lightweight native app on Android and iOS (Capacitor) or simply scans a QR code in the cinema corridor via standard mobile Safari or Chrome, the experience starts in seconds.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Instant Web Onboarding</h4>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      Direct QR access launches an optimized web companion player immediately. No App Store detour required during an urgent break.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Persistent Mobile Identity</h4>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      Frequent moviegoers retain secure sessions across app launches with verified phone numbers or social single sign-on.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Audible Return Reminders</h4>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      Soft countdown pings at 12 and 14 minutes encourage patrons to head back, ensuring halls and lobbies remain orderly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Theatrical Preview Frame */}
            <div className="lg:col-span-6 glass-ios26 glass-ios26-rim glass-ios26-glint text-ink p-6 sm:p-8 rounded-3xl shadow-elevated text-left">
              <div className="flex items-center justify-between pb-4 border-b border-line text-xs">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-ink">Mobile Companion Viewport</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ACTIVE 1080P
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="aspect-video bg-bg rounded-2xl border border-line flex flex-col justify-between p-4 text-ink">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-muted">AUDITORIUM 01: ATMOS</span>
                    <span className="font-mono text-amber-400 font-bold">SEAT --</span>
                  </div>

                  <div className="text-center my-auto py-2">
                    <div className="font-mono text-xl sm:text-2xl font-black text-ink tracking-widest tabular-nums">
                      00:42:15.08
                    </div>
                    <div className="text-[10px] text-muted mt-1 uppercase tracking-wider">
                      Authoritative Master Feed
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-muted pt-2 border-t border-line">
                    <span>15m Session Window</span>
                    <span className="font-mono text-amber-400 font-bold tabular-nums">13:45 REMAINING</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-field-raised border border-line flex items-center justify-between text-xs">
                  <span className="text-muted">Return to Auditorium:</span>
                  <span className="font-bold text-emerald-400">Auditorium Admitted</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Cinema Operator Benefits */}
        <section
          id="operator-benefits"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Exhibitor Commercial Advantage
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Engineered for Theater Commercial Success
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              Transform the inevitable bathroom interruption into an elevated customer loyalty experience that drives repeat attendance.
            </p>
          </div>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 text-left">
            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-base text-ink">
                  Higher Concession & Ticket Satisfaction
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Eliminates patron fear of missing key scenes. Moviegoers buy larger drinks and snacks with peace of mind.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-line text-[11px] font-semibold text-emerald-400">
                Reduced Patron Anxiety
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-base text-ink">
                  Zero Piracy Risk
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Hardware-backed short streams, dynamic watermarks, and no rewind controls ensure theatrical exclusivity is 100% preserved.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-line text-[11px] font-semibold text-emerald-400">
                Hardware-Enforced Security
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-base text-ink">
                  Commercial Revenue Model
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Exhibitors participate in companion session monetization or offer the amenity as a premium ticket differentiator.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-line text-[11px] font-semibold text-emerald-400">
                Configurable Pricing
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-base text-ink">
                  Real-Time Usher & Hall Telemetry
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Monitor ongoing breaks per auditorium. Identify hall traffic patterns and assist patrons returning to seats.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-line text-[11px] font-semibold text-emerald-400">
                Live Usher Dashboard
              </div>
            </div>
          </div>
        </section>

        {/* 6. Screening Synchronization (Integrated Cinematic Console Surface) */}
        <section
          id="synchronization"
          className="py-16 md:py-24 bg-field/50 border-t border-b border-line w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <div className="max-w-3xl">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Sub-Second Precision Architecture
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-ink leading-tight">
                Zero-Drift Projection Locking
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
                The patron&apos;s mobile device never determines the movie timeline. The backend server tracks projector state in real time.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-ink">Authoritative Clock</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Server tracks the master theater clock, factoring in projector start delays and unexpected show interruptions.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-line text-[11px] font-mono text-emerald-400">
                  Sub-Second Sync
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-ink">Dynamic Pause Handling</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    If the cinema operator pauses the auditorium projector for technical reasons, all companion streams pause instantaneously.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-line text-[11px] font-mono text-emerald-400">
                  Zero Drift on Resume
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-field border border-line shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                    <Tv className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-ink">Resilient Corridors</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Adaptive bitrate streaming ensures continuity even in deep restroom corridors or low-reception theater facilities.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-line text-[11px] font-mono text-emerald-400">
                  Adaptive Bitrate
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Ticketing and Integration Model */}
        <section
          id="ticketing-integration"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Seamless Deployment
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Frictionless POS & Screening Interoperability
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              PottyPlay does not replace your ticketing software or require custom auditorium hardware.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-5 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="font-extrabold text-base text-ink">Vista Cinema POS</div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Connect via standard Vista Connect webhook events on ticket admission and refund.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="font-extrabold text-base text-ink">Veezi Cloud Ticketing</div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Native REST synchronization for independent cinema circuits and boutique theaters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="font-extrabold text-base text-ink">Ready Theatre Systems</div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Reliable barcode payload mapping for RTS POS barcode scanners and kiosks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="font-extrabold text-base text-ink">Custom Exhibitor APIs</div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Direct JSON webhooks and REST endpoints for proprietary exhibitor applications.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Security and Entitlement Controls */}
        <section
          id="security"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Studio Security & Rights
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                Studio-Grade Content Protection
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
                Hollywood content owners and local distributors demand non-negotiable stream controls. PottyPlay enforces studio-grade security boundaries at the API and streaming protocol layer.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-3 text-left">
              <div className="p-4 sm:p-5 rounded-2xl bg-field border border-line shadow-card">
                <div className="font-bold text-sm text-ink">Session Duration Enforcement</div>
                <div className="text-xs text-muted mt-1 leading-relaxed">
                  A strict, server-side 900-second (15-minute) timer terminates the feed automatically. No extensions allowed.
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-field border border-line shadow-card">
                <div className="font-bold text-sm text-ink">Single-Device Locking</div>
                <div className="text-xs text-muted mt-1 leading-relaxed">
                  Each ticket barcode or claim token can only power one active companion session at a time, preventing link sharing.
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-field border border-line shadow-card">
                <div className="font-bold text-sm text-ink">Encrypted Ephemeral Streams</div>
                <div className="text-xs text-muted mt-1 leading-relaxed">
                  Video chunks are dynamically signed and expire in seconds. Recording or ripping feeds yields unplayable fragments.
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-field border border-line shadow-card">
                <div className="font-bold text-sm text-ink">Explicit Rights Authorization</div>
                <div className="text-xs text-muted mt-1 leading-relaxed">
                  Every screening references a verified digital rights record. Unlicensed assets or expired windows fail closed.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Cinema Partnership Process */}
        <section
          id="partnership-process"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Exhibitor Roadmap
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Seamless Onboarding for Cinema Circuits
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              Four structured steps to pilot and roll out PottyPlay across your venues.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="text-xs font-mono font-bold text-amber-400">STAGE 01</div>
              <h3 className="mt-2 font-bold text-base text-ink">Partner Registration</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Submit circuit details, venue counts, and ticketing systems through our partner portal.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="text-xs font-mono font-bold text-amber-400">STAGE 02</div>
              <h3 className="mt-2 font-bold text-base text-ink">System Compatibility Check</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Our solutions engineering team tests webhook connectivity with your POS and TMS servers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="text-xs font-mono font-bold text-amber-400">STAGE 03</div>
              <h3 className="mt-2 font-bold text-base text-ink">Single-Screen Pilot</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Pilot the companion experience on a single flagship auditorium with live moviegoers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
              <div className="text-xs font-mono font-bold text-amber-400">STAGE 04</div>
              <h3 className="mt-2 font-bold text-base text-ink">Circuit Rollout</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Deploy QR codes across theater restrooms and enable companion streaming circuit-wide.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Developer Integration Overview */}
        <section
          id="developer-overview"
          className="py-16 md:py-24 bg-[#07090D] border-t border-b border-neutral-800/80 w-full relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                  Engineering Documentation & OpenAPI
                </span>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                  Open APIs & Standard Webhooks
                </h2>
                <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
                  Integrate your POS or ticketing software with clean, standards-compliant REST endpoints and HMAC-signed webhook dispatches.
                </p>

                <div className="mt-8 flex items-center space-x-4">
                  <Link
                    href="/developers"
                    className="py-3 px-6 rounded-xl font-black text-xs sm:text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors flex items-center space-x-2 shadow-sm"
                  >
                    <span>Read API Specifications</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="/api/openapi.json"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs sm:text-sm text-muted hover:text-ink font-mono flex items-center space-x-1.5"
                  >
                    <span>openapi.json</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-3xl bg-[#040507] border border-neutral-800 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                <div className="bg-neutral-900/90 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-bold text-neutral-300">webhook-listener.sh</span>
                  </div>
                  <span className="text-emerald-400 font-bold">200 OK</span>
                </div>
                <div className="p-5 font-mono text-xs overflow-x-auto text-ink">
                  <div className="text-neutral-500 mb-2">{"// Webhook payload received on patron admission"}</div>
                  <pre className="text-emerald-400 leading-relaxed">{`POST /api/webhooks/pottyplay/tickets
Content-Type: application/json
X-PottyPlay-Signature: sha256=...

{
  "event": "ticket.admitted",
  "cinemaId": "cinema_circuit_01",
  "screeningId": "screening_auditorium_01",
  "ticketNumber": "TK-8842-DEMO",
  "claimToken": "CLM-8842-01",
  "maxBreaks": 2,
  "maxSessionSeconds": 900
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Partner Registration Call to Action */}
        <section
          id="register"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-line w-full"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Cinema Onboarding
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Register Your Cinema Circuit
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              Join leading cinema exhibitors. Connect your auditoriums and offer companion viewing to your patrons.
            </p>
          </div>

          <PartnerRegistrationForm />
        </section>
      </main>

      {/* 12. Footer with Legal & Company Info */}
      <footer className="border-t border-line bg-bg py-12 px-4 sm:px-6 lg:px-8 text-xs text-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <BrandLogo size="sm" variant="full" href="/" />
            <span className="hidden sm:inline text-neutral-700">&bull;</span>
            <span className="text-muted text-center sm:text-left">
              Authoritative Cinema Companion Viewing Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms of Service
            </Link>
            <Link href="/developers" className="hover:text-ink transition-colors">
              Developer Documentation
            </Link>
            <span className="text-neutral-500">
              Commercial Cinema Partner Portal 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
