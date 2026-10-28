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
  const [progress, setProgress] = useState(0);
  const slideDurationMs = 6500;
  const intervalStepMs = 50;

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
          <div className="relative rounded-[28px] bg-brand-accent text-white p-5 sm:p-6 shadow-elevated border border-neutral-800 backdrop-blur-xl">
            {/* Device Top Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-neutral-200 tracking-wide text-[11px] sm:text-xs">
                  AUDITORIUM 01: ATMOS
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-neutral-800/90 text-brand-primary font-mono text-[10px] sm:text-[11px] font-bold border border-neutral-700">
                SEAT A12
              </span>
            </div>

            {/* Authoritative Screen Canvas Frame */}
            <div className="mt-4 relative rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden p-4 flex flex-col justify-between aspect-video">
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
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 text-brand-primary mb-1.5 shadow-sm">
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
                  <span className="w-1 h-3.5 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: "75ms" }} />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-3 bg-brand-secondary rounded-full animate-pulse" style={{ animationDelay: "225ms" }} />
                </div>
              </div>
            </div>

            {/* Countdown & Allowance Footer */}
            <div className="mt-3.5 pt-3.5 border-t border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span className="text-neutral-300 text-[11px] sm:text-xs">
                  Break 1 of 2 Allowed
                </span>
              </div>
              <span className="font-mono font-bold text-brand-primary text-[11px] sm:text-xs bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20 tabular-nums">
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

          <div className="relative rounded-[28px] bg-brand-surface border border-brand-border p-5 sm:p-6 shadow-elevated text-brand-text-primary">
            {/* Theatrical Hospitality Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-brand-border text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-secondary" />
                <span className="font-bold text-brand-text-primary text-[11px] sm:text-xs">
                  Patron Companion Window
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] sm:text-[11px] border border-emerald-200">
                ACTIVE BREAK
              </span>
            </div>

            {/* Visual Continuity Arc */}
            <div className="mt-4 p-4 rounded-2xl bg-brand-bg border border-brand-border text-center space-y-3">
              <div className="text-xs font-semibold text-brand-text-secondary">
                Auditorium to Corridors &bull; Seamless Hand-off
              </div>

              {/* Visual Split: Cinema Hall to Mobile */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-white border border-brand-border">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Main Screen</div>
                  <div className="text-xs font-extrabold text-brand-text-primary mt-1">Screen 1 Hall</div>
                  <div className="text-[11px] text-emerald-600 font-mono mt-0.5">Projecting Live</div>
                </div>
                <div className="p-3 rounded-xl bg-brand-accent text-white border border-neutral-800">
                  <div className="text-[10px] uppercase font-bold text-brand-primary">Companion</div>
                  <div className="text-xs font-extrabold text-white mt-1">Patron Mobile</div>
                  <div className="text-[11px] text-neutral-300 font-mono mt-0.5">Synced Stream</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-brand-border text-left">
                <div className="flex items-center justify-between text-xs font-bold text-brand-text-primary">
                  <span>Re-entry Confidence</span>
                  <span className="text-emerald-600 font-mono">100% Timeline Match</span>
                </div>
                <p className="text-[11px] text-brand-text-secondary mt-1">
                  Patrons walk back to their exact seat without asking companions what happened.
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-brand-border flex items-center justify-between text-xs text-brand-text-secondary">
              <span>Auditorium Ambience:</span>
              <span className="font-bold text-brand-text-primary">Zero Flash &bull; Dark Mode UI</span>
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

          <div className="relative rounded-[28px] bg-brand-accent text-white p-5 sm:p-6 shadow-elevated border border-neutral-800">
            {/* Security Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800 text-xs">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-brand-primary" />
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
                <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">2 Breaks Per Ticket</div>
                  <div className="text-[11px] text-neutral-400">Strict atomic database constraints</div>
                </div>
                <Ticket className="w-4 h-4 text-brand-primary flex-shrink-0" />
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
              <span className="font-mono text-neutral-300 font-bold">CLM-7821-SECURE</span>
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

          <div className="relative rounded-[28px] bg-brand-surface rounded-3xl p-5 sm:p-6 shadow-elevated border border-brand-border text-brand-text-primary">
            {/* Operator Telemetry Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-brand-border text-xs">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-brand-secondary" />
                <span className="font-bold text-brand-text-primary text-[11px] sm:text-xs">
                  Exhibitor Operations HUD
                </span>
              </div>
              <span className="font-mono text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                TMS CONNECTED
              </span>
            </div>

            {/* Telemetry Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-brand-bg border border-brand-border">
                <div className="text-[10px] text-brand-text-secondary font-bold uppercase">
                  Screens
                </div>
                <div className="text-base sm:text-lg font-black text-brand-text-primary mt-0.5">
                  8 / 8
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-bg border border-brand-border">
                <div className="text-[10px] text-brand-text-secondary font-bold uppercase">
                  Breaks
                </div>
                <div className="text-base sm:text-lg font-black text-brand-primary mt-0.5">
                  14
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-bg border border-brand-border">
                <div className="text-[10px] text-brand-text-secondary font-bold uppercase">
                  Avg Time
                </div>
                <div className="text-base sm:text-lg font-black text-brand-text-primary mt-0.5">
                  6.4m
                </div>
              </div>
            </div>

            {/* Screen Monitor Strip */}
            <div className="mt-3 p-3 rounded-2xl bg-brand-accent text-white text-xs space-y-1.5">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-neutral-300">
                <span>Auditorium 1: Live Feed</span>
                <span className="font-mono text-emerald-400 font-bold">ZERO DRIFT</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-primary h-full w-[65%]" />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Projection: 01:14:20</span>
                <span>Active Companions: 3</span>
              </div>
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-brand-border flex items-center justify-between text-[11px] text-brand-text-secondary">
              <span>Commercial Terms:</span>
              <span className="font-bold text-brand-text-primary">Per-Session Agreement</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Auto transition ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + (intervalStepMs / slideDurationMs) * 100;
      });
    }, intervalStepMs);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlide((curr) => (curr + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((curr) => (curr - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
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
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-brand-border text-xs font-semibold text-brand-text-secondary mb-4 sm:mb-5 shadow-subtle w-fit">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse flex-shrink-0" />
                    <span className="truncate">{s.badge}</span>
                  </div>

                  {/* Expressive Headline */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-brand-text-primary leading-[1.12]">
                    {s.headlinePrefix}{" "}
                    <span className="relative inline-block text-brand-primary whitespace-nowrap">
                      <span>{s.headlineHighlight}</span>
                      <svg
                        className="absolute left-0 -bottom-1 w-full h-2.5 text-brand-primary/40 -z-10"
                        viewBox="0 0 100 12"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 9C25 3 75 3 98 9"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </h1>

                  {/* Subheadline */}
                  <p className="mt-3.5 sm:mt-5 text-sm sm:text-base md:text-lg text-brand-text-secondary leading-relaxed max-w-xl">
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
                    className="py-2.5 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-colors duration-150 shadow-subtle inline-flex items-center space-x-1.5"
                  >
                    <span>{s.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>

                  <a
                    href={s.secondaryCtaHref}
                    className="py-2.5 px-4 sm:px-5 rounded-xl font-semibold text-xs sm:text-sm bg-white text-brand-text-primary hover:bg-neutral-50 border border-brand-border transition-colors duration-150 inline-flex items-center"
                  >
                    <span>{s.secondaryCtaText}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Carousel Interactive Controls & Slide Progress */}
          <div className="mt-7 pt-4 border-t border-brand-border/80 flex items-center justify-between">
            {/* Slide Navigation Dots with Progress */}
            <div className="flex items-center space-x-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className="group relative h-2 rounded-full transition-all duration-300 overflow-hidden focus:outline-none min-w-[20px] touch-manipulation"
                  style={{ width: currentSlide === idx ? "40px" : "14px" }}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <div className="w-full h-full bg-neutral-300 group-hover:bg-neutral-400 rounded-full" />
                  {currentSlide === idx && (
                    <div
                      className="absolute top-0 left-0 h-full bg-brand-primary rounded-full transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Carousel Buttons (Prev, Next, Pause/Play) */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-white transition-colors"
                aria-label={isPlaying ? "Pause carousel auto-advance" : "Resume carousel"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-white transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-white transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
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
