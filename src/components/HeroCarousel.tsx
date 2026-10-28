"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Tv,
  Film,
  Sparkles,
  Ticket,
  Sliders,
  Lock,
} from "lucide-react";

interface SlideData {
  id: number;
  badge: string;
  headlinePrefix: string;
  headlineHighlight: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  visualScene: React.ReactNode;
}

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const slideDurationMs = 6500;

  const slides: SlideData[] = [
    {
      id: 0,
      badge: "Real-Time Playback Synchronization",
      headlinePrefix: "Never lose your",
      headlineHighlight: "place.",
      subheadline:
        "PottyPlay connects patrons to the authoritative projection timeline on their mobile phone for a strictly capped 15-minute intermission.",
      ctaText: "Register Cinema",
      ctaHref: "#register",
      secondaryCtaText: "Explore How It Works",
      secondaryCtaHref: "#how-it-works",
      visualScene: (
        <div className="relative w-full max-w-md mx-auto">
          {/* Ambient Glow */}
          <div
            className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/15 to-transparent rounded-[32px] blur-xl opacity-75 pointer-events-none"
            aria-hidden="true"
          />

          {/* Handheld Device Container */}
          <div className="relative rounded-[28px] bg-neutral-950 text-white p-5 sm:p-6 shadow-elevated border border-neutral-800/90 backdrop-blur-xl">
            {/* Device Top Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-neutral-200 tracking-wide text-[11px] sm:text-xs">
                  AUDITORIUM 01: ATMOS
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-900 text-amber-400 font-mono text-[10px] sm:text-[11px] font-bold border border-amber-500/30">
                SEAT --
              </span>
            </div>

            {/* Authoritative Screen Canvas Frame */}
            <div className="mt-4 relative rounded-2xl bg-neutral-900/90 border border-neutral-800 overflow-hidden p-4 flex flex-col justify-between aspect-video">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="font-bold tracking-wider text-neutral-300">
                  FEATURE SCREENING
                </span>
                <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/40">
                  SYNCED 0.0s
                </span>
              </div>

              {/* Center Playback Dial / Waveform */}
              <div className="my-auto text-center py-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1.5 shadow-sm">
                  <Film className="w-5 h-5" />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                  Authoritative Clock
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest tabular-nums">
                  00:42:15.08
                </div>
              </div>

              {/* Live Audio / Video Telemetry */}
              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-800/80">
                <span>PCM Stereo &bull; Low-Latency HLS</span>
                <div className="flex items-center space-x-1">
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-1 h-3.5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: "75ms" }} />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-3 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: "225ms" }} />
                </div>
              </div>
            </div>

            {/* Countdown & Allowance Footer */}
            <div className="mt-3.5 pt-3.5 border-t border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-neutral-300 text-[11px] sm:text-xs">
                  Break 1 of 2 Allowed
                </span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-[11px] sm:text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tabular-nums">
                13:45 REMAINING
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      badge: "Elevated Patron Hospitality",
      headlinePrefix: "A better cinema",
      headlineHighlight: "experience.",
      subheadline:
        "Remove the dread of bathroom breaks during crucial plot twists. Patrons step out with confidence and return without missing a beat.",
      ctaText: "Review Theater Benefits",
      ctaHref: "#operator-benefits",
      secondaryCtaText: "Patron Journey",
      secondaryCtaHref: "#patron-experience",
      visualScene: (
        <div className="relative w-full max-w-md mx-auto">
          <div
            className="absolute -inset-1 bg-gradient-to-r from-brand-secondary/20 to-brand-primary/20 rounded-[32px] blur-xl opacity-75 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative rounded-[28px] bg-field border border-line p-5 sm:p-6 shadow-elevated text-ink">
            {/* Theatrical Hospitality Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-line text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-ink text-[11px] sm:text-xs">
                  Patron Companion Window
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] sm:text-[11px] border border-emerald-500/20">
                ACTIVE BREAK
              </span>
            </div>

            {/* Visual Continuity Arc */}
            <div className="mt-4 p-4 rounded-2xl bg-field-raised border border-line text-center space-y-3">
              <div className="text-xs font-semibold text-muted">
                Auditorium to Corridors &bull; Seamless Hand-off
              </div>

              {/* Visual Split: Cinema Hall to Mobile */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-field border border-line">
                  <div className="text-[10px] uppercase font-bold text-muted">Main Screen</div>
                  <div className="text-xs font-extrabold text-ink mt-1">Screen 1 Hall</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Projecting Live</div>
                </div>
                <div className="p-3 rounded-xl bg-bg text-ink border border-amber-500/30">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Companion</div>
                  <div className="text-xs font-extrabold text-ink mt-1">Patron Mobile</div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">Synced Stream</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-field border border-line text-left">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>Re-entry Confidence</span>
                  <span className="text-emerald-400 font-mono">100% Timeline Match</span>
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Patrons walk back to their exact seat without asking companions what happened.
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-line flex items-center justify-between text-xs text-muted">
              <span>Auditorium Ambience:</span>
              <span className="font-bold text-ink">Zero Flash &bull; Dark Mode UI</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: "Strict Studio & Theatrical Exclusivity",
      headlinePrefix: "The story",
      headlineHighlight: "continues.",
      subheadline:
        "A controlled, rights-cleared companion window. Not a streaming service, not a public library, and strictly confined to ongoing screenings.",
      ctaText: "Exclusivity Controls",
      ctaHref: "#security",
      secondaryCtaText: "Synchronization Specs",
      secondaryCtaHref: "#synchronization",
      visualScene: (
        <div className="relative w-full max-w-md mx-auto">
          <div
            className="absolute -inset-1 bg-gradient-to-r from-emerald-500/15 via-brand-primary/15 to-transparent rounded-[32px] blur-xl opacity-75 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative rounded-[28px] bg-neutral-950 text-white p-5 sm:p-6 shadow-elevated border border-neutral-800/90">
            {/* Security Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 text-xs">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-neutral-200 text-[11px] sm:text-xs">
                  Studio Rights Vault
                </span>
              </div>
              <span className="font-mono text-[10px] sm:text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                RIGHTS VALIDATED
              </span>
            </div>

            {/* Architectural Security Matrix */}
            <div className="mt-4 space-y-2.5">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">900-Second Hard Limit</div>
                  <div className="text-[11px] text-neutral-400">Server auto-revocation at limit</div>
                </div>
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">2 Breaks Per Ticket</div>
                  <div className="text-[11px] text-neutral-400">Strict atomic database constraints</div>
                </div>
                <Ticket className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">No Public Catalog</div>
                  <div className="text-[11px] text-neutral-400">Tethered exclusively to live showtime</div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Tokenized Ticket Claim:</span>
              <span className="font-mono text-amber-400 font-bold">CLM-7821-SECURE</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: "Theater Management Integration",
      headlinePrefix: "Built for cinema",
      headlineHighlight: "operators.",
      subheadline:
        "A comprehensive operations workspace for cinema circuits. Monitor concurrent patron breaks, manage screen feeds, and review verified attendance telemetry.",
      ctaText: "Partner Inquiries",
      ctaHref: "#register",
      secondaryCtaText: "Developer Specifications",
      secondaryCtaHref: "/developers",
      visualScene: (
        <div className="relative w-full max-w-md mx-auto">
          <div
            className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-transparent rounded-[32px] blur-xl opacity-75 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative rounded-[28px] bg-field p-5 sm:p-6 shadow-elevated border border-line text-ink">
            {/* Operator Telemetry Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-line text-xs">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-ink text-[11px] sm:text-xs">
                  Exhibitor Operations HUD
                </span>
              </div>
              <span className="font-mono text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                TMS CONNECTED
              </span>
            </div>

            {/* Telemetry Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-field-raised border border-line">
                <div className="text-[10px] text-muted font-bold uppercase">
                  Screens
                </div>
                <div className="text-base sm:text-lg font-black text-ink mt-0.5">
                  8 / 8
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-field-raised border border-line">
                <div className="text-[10px] text-muted font-bold uppercase">
                  Breaks
                </div>
                <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
                  14
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-field-raised border border-line">
                <div className="text-[10px] text-muted font-bold uppercase">
                  Avg Time
                </div>
                <div className="text-base sm:text-lg font-black text-ink mt-0.5">
                  6.4m
                </div>
              </div>
            </div>

            {/* Screen Monitor Strip */}
            <div className="mt-3 p-3 rounded-2xl bg-bg border border-line text-ink text-xs space-y-1.5">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-muted">
                <span>Auditorium 1: Live Feed</span>
                <span className="font-mono text-emerald-400 font-bold">ZERO DRIFT</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[65%]" />
              </div>
              <div className="flex justify-between text-[10px] text-muted">
                <span>Projection: 01:14:20</span>
                <span>Active Companions: 3</span>
              </div>
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-line flex items-center justify-between text-[11px] text-muted">
              <span>Commercial Terms:</span>
              <span className="font-bold text-ink">Per-Session Agreement</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Auto transition timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((curr) => (curr + 1) % slides.length);
    }, slideDurationMs);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length, slideDurationMs]);

  const handleNext = useCallback(() => {
    setCurrentSlide((curr) => (curr + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((curr) => (curr - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-12 md:pt-10 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Background Ambient Aura */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[700px] h-[350px] bg-gradient-to-b from-brand-primary/10 via-brand-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Expressive Copy & Action with Stable Layout */}
        <div className="lg:col-span-6 flex flex-col text-left">
          {/* Stable Text Container to Eliminate Vertical Layout Shifts */}
          <div className="relative w-full min-h-[220px] sm:min-h-[210px] lg:min-h-[240px] overflow-hidden">
            {slides.map((s, idx) => {
              const isActive = currentSlide === idx;
              return (
                <div
                  key={s.id}
                  className={`transition-all duration-500 ease-out ${
                    isActive
                      ? "opacity-100 translate-y-0 relative z-10 pointer-events-auto"
                      : "opacity-0 -translate-y-2 absolute inset-0 pointer-events-none z-0"
                  }`}
                >
                  {/* Badge */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-field border border-line text-xs font-semibold text-muted mb-4 sm:mb-5 shadow-subtle w-fit">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="truncate">{s.badge}</span>
                  </div>

                  {/* Expressive Headline */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-ink leading-[1.12]">
                    {s.headlinePrefix}{" "}
                    <span className="relative inline-block text-amber-400 whitespace-nowrap">
                      <span>{s.headlineHighlight}</span>
                      <span className="absolute left-0 -bottom-1 w-full h-[3px] rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
                    </span>
                  </h1>

                  {/* Subheadline */}
                  <p className="mt-3.5 sm:mt-5 text-sm sm:text-base md:text-lg text-muted leading-relaxed max-w-xl">
                    {s.subheadline}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stable CTAs - Compact, proportionate sizing */}
          <div className="relative mt-6 sm:mt-7 min-h-[44px] overflow-hidden">
            {slides.map((s, idx) => {
              const isActive = currentSlide === idx;
              return (
                <div
                  key={s.id}
                  className={`transition-all duration-300 ease-out flex flex-wrap items-center gap-2.5 sm:gap-3 ${
                    isActive
                      ? "opacity-100 translate-y-0 relative z-10 pointer-events-auto"
                      : "opacity-0 translate-y-1 absolute inset-0 pointer-events-none z-0"
                  }`}
                >
                  <a
                    href={s.ctaHref}
                    className="py-2.5 px-4 sm:px-5 rounded-xl font-black text-xs sm:text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors duration-150 shadow-sm inline-flex items-center space-x-1.5"
                  >
                    <span>{s.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>

                  <a
                    href={s.secondaryCtaHref}
                    className="py-2.5 px-4 sm:px-5 rounded-xl font-semibold text-xs sm:text-sm bg-field text-ink hover:bg-field-raised border border-line transition-colors duration-150 inline-flex items-center"
                  >
                    <span>{s.secondaryCtaText}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Modern Minimalist Carousel Controls: Pause, Prev, Next */}
          <div className="mt-8 pt-5 border-t border-line/60 flex items-center justify-between gap-4">
            {/* Slide Index & Context Capsule */}
            <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-field/90 border border-line text-xs shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="text-ink font-bold">0{currentSlide + 1}</span>
                <span className="text-muted/40 font-light">/</span>
                <span className="text-muted font-medium">0{slides.length}</span>
              </div>
              <span className="w-px h-3.5 bg-line hidden xs:inline-block" aria-hidden="true" />
              <span className="text-[11px] text-muted font-semibold tracking-wide hidden xs:inline-block">
                {currentSlide === 0
                  ? "Real-Time Sync"
                  : currentSlide === 1
                  ? "Instant Claim"
                  : currentSlide === 2
                  ? "Studio Rights"
                  : "TMS Integration"}
              </span>
            </div>

            {/* Tactical Control Trio */}
            <div className="inline-flex items-center space-x-1.5 p-1 rounded-full bg-field/90 border border-line shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 ${
                  isPlaying
                    ? "text-muted hover:text-ink hover:bg-field-raised"
                    : "text-amber-400 bg-amber-500/15 hover:bg-amber-500/25"
                }`}
                aria-label={isPlaying ? "Pause automatic slide rotation" : "Resume automatic slide rotation"}
                title={isPlaying ? "Pause rotation" : "Resume rotation"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-field-raised transition-all duration-150 active:scale-95"
                aria-label="Previous slide"
                title="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-field-raised transition-all duration-150 active:scale-95"
                aria-label="Next slide"
                title="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Scenes in Fixed-Height Frame with Sliding Glide Motion */}
        <div className="lg:col-span-6 relative w-full flex items-center justify-center min-w-0">
          <div className="relative w-full max-w-md mx-auto h-[380px] sm:h-[400px] flex items-center justify-center overflow-hidden">
            {slides.map((s, idx) => {
              const isActive = currentSlide === idx;
              return (
                <div
                  key={s.id}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isActive
                      ? "opacity-100 translate-x-0 scale-100 pointer-events-auto z-10"
                      : idx < currentSlide
                      ? "opacity-0 -translate-x-8 scale-95 pointer-events-none z-0"
                      : "opacity-0 translate-x-8 scale-95 pointer-events-none z-0"
                  }`}
                >
                  {s.visualScene}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
