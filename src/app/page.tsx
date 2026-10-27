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
} from "lucide-react";

export default function BusinessLandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-brand-bg text-brand-text-primary selection:bg-brand-primary/30 selection:text-brand-text-primary">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-1 flex flex-col">
        {/* 1. Hero Carousel */}
        <HeroCarousel />

        {/* 2. Clear Product Proposition */}
        <section
          id="proposition"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Product Definition & Philosophy
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              A Purpose-Built Cinema Companion. Not a Streaming Platform.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-brand-text-secondary leading-relaxed">
              PottyPlay is engineered specifically to solve mid-movie patron anxiety. We enable authenticated ticket holders to briefly follow an ongoing theatrical screening during necessary bathroom intermissions without compromising box-office sanctity.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 text-brand-text-primary flex items-center justify-center mb-5">
                  <ShieldCheck className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-brand-text-primary">
                  Strictly Controlled Exclusivity
                </h3>
                <p className="mt-2.5 text-xs text-brand-text-secondary leading-relaxed">
                  Viewing access is tethered directly to a verified, ongoing cinema screening. Access expires permanently after 900 seconds. No video library, no rewinding, and no home streaming.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Preserves Theatrical Window</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 text-brand-text-primary flex items-center justify-center mb-5">
                  <Activity className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-brand-text-primary">
                  Zero Drift Synchronization
                </h3>
                <p className="mt-2.5 text-xs text-brand-text-secondary leading-relaxed">
                  The cinema projector remains the authoritative clock. If the theater pauses, the companion pauses. When the patron returns, they are precisely aligned with the auditorium screen.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sub-Second Timeline Precision</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 text-brand-text-primary flex items-center justify-center mb-5">
                  <Layers className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-brand-text-primary">
                  Native POS & TMS Compatibility
                </h3>
                <p className="mt-2.5 text-xs text-brand-text-secondary leading-relaxed">
                  Integrates cleanly with industry standard ticketing engines (Vista, Veezi, RTS) and theater management servers (Dolby, Barco, Christie) through lightweight webhooks and APIs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-border/60 text-[11px] font-semibold text-emerald-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Plug-and-Play Integration</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How PottyPlay Works */}
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

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">STEP 01</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Ticket Entitlement
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Patron purchases a movie ticket. The cinema POS provisions an encrypted ticket barcode and optional entry claim token.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                POS Webhook Sync
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">STEP 02</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Intermission Trigger
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  During a bathroom break, the patron scans an auditorium entry code or opens their pre-authenticated PottyPlay customer application.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                One-Tap Activation
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">STEP 03</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Synchronized Companion
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  The server validates cinema rights, confirms screening state, and streams companion feed locked to the live theater timestamp.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
                Live Projection Lock
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">STEP 04</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Automatic Termination
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  At 900 seconds (or when the patron taps return), the session revokes. The patron walks back to their auditorium seat without missing context.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] text-neutral-500 font-mono">
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
            <div className="lg:col-span-6">
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
                    <p className="text-xs text-brand-text-secondary mt-0.5">
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
                    <p className="text-xs text-brand-text-secondary mt-0.5">
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
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      Soft countdown pings at 12 and 14 minutes encourage patrons to head back, ensuring halls and lobbies remain orderly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-brand-accent text-white p-6 sm:p-8 rounded-3xl shadow-elevated border border-neutral-800">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 text-xs">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-brand-primary" />
                  <span className="font-bold text-neutral-200">Mobile Patron Interface</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">iOS 18 / Android 15</span>
              </div>

              <div className="mt-6 aspect-video bg-neutral-900 rounded-2xl p-4 flex flex-col justify-between border border-neutral-800">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400">AUDITORIUM SCREEN 01</span>
                  <span className="text-emerald-400 font-mono">LIVE FEED SYNCED</span>
                </div>

                <div className="text-center py-3">
                  <div className="text-xs text-neutral-400">Time In Screening</div>
                  <div className="font-mono text-2xl font-black text-white mt-1 tabular-nums">
                    00:54:12
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-neutral-800">
                  <span className="text-neutral-400">Remaining Break Allowance:</span>
                  <span className="font-mono font-bold text-brand-primary tabular-nums">
                    09:48
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 text-[10px]">Current Allowance</span>
                  <div className="font-bold text-white mt-0.5">Break 1 of 2</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 text-[10px]">Authentication</span>
                  <div className="font-bold text-emerald-400 mt-0.5">Verified Ticket</div>
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
              Commercial & Operational Return
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Why Cinema Circuits Partner with PottyPlay
            </h2>
            <p className="mt-4 text-base text-brand-text-secondary leading-relaxed">
              Long runtime blockbusters (150+ minutes) can create patron physical discomfort. PottyPlay turns this challenge into a premium guest amenity while unlocking incremental concession revenue.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-4">
                  01
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Higher Concession Spend
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Patrons who know they will not lose their place are more likely to purchase beverages and snacks without fear of bathroom interruptions later.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-brand-primary">
                Increased Beverage Confidence
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-4">
                  02
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Reduced Hallway Lingering
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  The strict 15-minute countdown and gentle return reminders motivate patrons to return immediately to their auditorium seats.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-brand-primary">
                Orderly Cinema Foyers
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-4">
                  03
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Distinctive Competitive Edge
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Position your venue as a progressive, guest-first cinema that embraces modern mobile hospitality without diluting theatrical prestige.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-brand-primary">
                Modern Patron Loyalty
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-4">
                  04
                </div>
                <h3 className="font-bold text-base text-brand-text-primary">
                  Custom Commercial Models
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Flexible operator billing agreements. Offer complimentary access as a VIP club perk or configure micro-transaction companion fees.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-brand-border/60 text-[11px] font-semibold text-brand-primary">
                Operator-Configurable Pricing
              </div>
            </div>
          </div>
        </section>

        {/* 6. Screening Synchronization */}
        <section
          id="synchronization"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-8 shadow-elevated">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border text-xs">
                <span className="font-bold text-brand-text-primary">Authoritative Sync Engine</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="mt-6 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                  <div className="flex justify-between font-bold text-brand-text-primary">
                    <span>Theater Projector State</span>
                    <span className="text-emerald-700 font-mono">PLAYING</span>
                  </div>
                  <div className="mt-2 text-brand-text-secondary">
                    Authoritative timeline updates are broadcast directly from the cinema projection feed.
                  </div>
                  <div className="mt-2 font-mono text-xs font-semibold text-brand-text-primary">
                    Position: 01:12:44.20
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                  <div className="flex justify-between font-bold text-brand-text-primary">
                    <span>Companion Mobile Player</span>
                    <span className="text-emerald-700 font-mono">LOCKED</span>
                  </div>
                  <div className="mt-2 text-brand-text-secondary">
                    Sub-second timecode alignment prevents lag or spoiling ahead of the main auditorium.
                  </div>
                  <div className="mt-2 font-mono text-xs font-semibold text-brand-text-primary">
                    Offset: +0.04s (Nominal)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 text-white text-[11px] flex justify-between items-center">
                  <span>Projection Interruption Handling:</span>
                  <span className="text-brand-primary font-bold">Automatic Companion Freeze</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
                Authoritative Timeline Architecture
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
                Authoritative Synchronization. Not Personal Video On Demand.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-brand-text-secondary leading-relaxed">
                PottyPlay does not maintain an individual saved playback point. The auditorium projection is the single source of truth. When the projectionist pauses the film for an emergency, every connected companion immediately halts without drift.
              </p>

              <div className="mt-6 space-y-3 text-xs text-brand-text-secondary">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <span>Sub-second heartbeat synchronization with database verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <span>Automated pause propagation prevents patron desynchronization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <span>Resilient connection recovery re-aligns stream upon network re-establishment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Ticketing & Integration Model */}
        <section
          id="ticketing"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              POS & Hardware Interoperability
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Compatible with Your Existing Ticketing Infrastructure
            </h2>
            <p className="mt-4 text-base text-brand-text-secondary leading-relaxed">
              We do not replace your box office or ticketing software. PottyPlay works alongside your current POS platform through standard webhook notifications and secure ticket entitlement verification.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Barcode & QR Tokens
              </div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                Validated Ticket Claims
              </h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Every PottyPlay session requires a legitimate, admitted ticket reference. Seat numbers alone never authorize viewing access.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Carrier-Grade SMS (Africa&apos;s Talking)
              </div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                Verified Phone Binding
              </h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                When phone verification is activated by theater policy, one-time OTP challenges guarantee genuine patron identity and prevent replay.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                TMS Integration
              </div>
              <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                Screening Status Webhooks
              </h3>
              <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                Automated schedule synchronization fetches showtimes, actual start times, and screen assignments directly from your TMS schedule.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Security & Entitlement Controls */}
        <section
          id="security"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="bg-brand-accent text-white rounded-3xl p-8 sm:p-12 shadow-elevated border border-neutral-800">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Enterprise Studio & Exhibitor Protection
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Studio-Grade Security Perimeter
              </h2>
              <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed">
                Content security is the foundation of theatrical trust. PottyPlay implements server-enforced controls that make unauthorized distribution or persistent recording impossible.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Hard 900s Ceiling</h4>
                <p className="mt-1.5 text-neutral-400 text-[11px] leading-relaxed">
                  Sessions are terminated strictly at 15 minutes by the server. Client clock alteration has zero effect.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">2-Break Ticket Limit</h4>
                <p className="mt-1.5 text-neutral-400 text-[11px] leading-relaxed">
                  Each ticket is restricted to a maximum of two bathroom breaks per screening via atomic database constraints.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Pre-Authorization Check</h4>
                <p className="mt-1.5 text-neutral-400 text-[11px] leading-relaxed">
                  Screening rights are validated against studio agreements prior to issuing streaming tokens.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Tenant Isolation</h4>
                <p className="mt-1.5 text-neutral-400 text-[11px] leading-relaxed">
                  Every screening, screen, and session is strictly partitioned by cinema organization ID.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Cinema Partnership Process */}
        <section
          id="process"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Structured Rollout
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Partner Onboarding Workflow
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary">
              A transparent, audited progression from initial application to full theater operation.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">PHASE 01</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Partner Registration
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Cinema operator submits organization details, screen count, and current POS/TMS architecture.
                </p>
              </div>
              <div className="mt-4 text-[11px] font-semibold text-neutral-500">
                Form Submission
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">PHASE 02</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Administrative Review
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  PottyPlay technical staff validates theater legitimacy, verifies rights compliance, and approves application.
                </p>
              </div>
              <div className="mt-4 text-[11px] font-semibold text-neutral-500">
                1-2 Business Days
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">PHASE 03</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Sandbox Integration
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Cinema engineering configures API keys, tests ticket barcode callbacks, and certifies projection sync in sandbox.
                </p>
              </div>
              <div className="mt-4 text-[11px] font-semibold text-neutral-500">
                Developer Sandbox
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-brand-primary">PHASE 04</div>
                <h3 className="mt-2 font-bold text-base text-brand-text-primary">
                  Auditorium Launch
                </h3>
                <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
                  Corridor QR assets are positioned, theater operators access workspace, and live companion breaks commence.
                </p>
              </div>
              <div className="mt-4 text-[11px] font-semibold text-neutral-500">
                Production Live
              </div>
            </div>
          </div>
        </section>

        {/* 10. Developer Integration Overview */}
        <section
          id="developers"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 sm:p-12 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
                  Technical Architecture
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-text-primary tracking-tight">
                  Developer Documentation & Integration APIs
                </h2>
                <p className="mt-3 text-sm text-brand-text-secondary leading-relaxed">
                  Access comprehensive integration guides for ticketing architects and projection engineers. Explore our RESTful webhook endpoints, OpenAPI schema, idempotency keys, and rate limits.
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-brand-bg border border-brand-border font-mono text-brand-text-primary">
                    POST /api/tickets/verify
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-brand-bg border border-brand-border font-mono text-brand-text-primary">
                    POST /api/sessions/activate
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-brand-bg border border-brand-border font-mono text-brand-text-primary">
                    GET /api/sessions/sync
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-brand-bg border border-brand-border font-mono text-brand-text-primary">
                    POST /api/operator/revoke
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center items-start lg:items-end">
                <Link
                  href="/developers"
                  className="py-3.5 px-6 rounded-xl font-bold text-sm bg-brand-accent text-white hover:bg-black transition-colors flex items-center space-x-2 shadow-subtle"
                >
                  <span>Explore Developer Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <span className="mt-2 text-xs text-brand-text-secondary">
                  OpenAPI 3.1 & TypeScript Contracts
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Partner Registration CTA Form */}
        <section
          id="register"
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-brand-border/80 w-full"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              Direct Partnership Inquiry
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
              Register Your Cinema Venue
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brand-text-secondary">
              Begin your cinema partnership review. Our solutions engineering team will evaluate your theater setup and configure sandbox access.
            </p>
          </div>

          <PartnerRegistrationForm />
        </section>
      </main>

      {/* 12. Privacy, Terms, and Company Contact Information */}
      <footer className="border-t border-brand-border bg-white text-brand-text-secondary text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <BrandLogo size="md" variant="full" />
              <p className="text-xs text-brand-text-secondary leading-relaxed pt-2">
                Authoritative cinema companion viewing platform. Engineered for cinema exhibitors, film festivals, and modern moviegoers across East Africa and international territories.
              </p>
              <div className="text-[11px] text-brand-text-secondary">
                Dar es Salaam, Tanzania
              </div>
            </div>

            {/* Col 2: Platform Navigation */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary mb-3">
                Platform
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#how-it-works" className="hover:text-brand-text-primary transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#operator-benefits" className="hover:text-brand-text-primary transition-colors">
                    Exhibitor Benefits
                  </a>
                </li>
                <li>
                  <a href="#synchronization" className="hover:text-brand-text-primary transition-colors">
                    Authoritative Sync
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-brand-text-primary transition-colors">
                    Studio Rights & Security
                  </a>
                </li>
                <li>
                  <Link href="/developers" className="hover:text-brand-text-primary transition-colors">
                    Developer Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Cinema Operations */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary mb-3">
                Operations
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/operator" className="hover:text-brand-text-primary transition-colors">
                    Cinema Operator Workspace
                  </Link>
                </li>
                <li>
                  <a href="#register" className="hover:text-brand-text-primary transition-colors">
                    Partner Application
                  </a>
                </li>
                <li>
                  <Link href="/watch" className="hover:text-brand-text-primary transition-colors">
                    Web Companion Player
                  </Link>
                </li>
                <li>
                  <Link href="/presentation" className="hover:text-brand-text-primary transition-colors">
                    Controlled Partner Demonstration
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Corporate & Legal */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary mb-3">
                Legal & Security
              </h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-neutral-500">Terms of Theatrical Service</span>
                </li>
                <li>
                  <span className="text-neutral-500">Exhibitor Privacy Policy</span>
                </li>
                <li>
                  <span className="text-neutral-500">Content Rights Compliance</span>
                </li>
                <li>
                  <span className="text-neutral-500">Tanzanian Data Protection Act Compliant</span>
                </li>
                <li>
                  <a href="mailto:partners@pottyplay.co.tz" className="text-brand-text-primary font-medium hover:underline">
                    partners@pottyplay.co.tz
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-text-secondary gap-3">
            <div>
              &copy; {new Date().getFullYear()} PottyPlay Technology Group. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <span>Strict 900-Second Hard Session Cap</span>
              <span>&bull;</span>
              <span>Authorized Theatrical Exhibition Only</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
