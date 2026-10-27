"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface SlideData {
  id: number;
  badge: string;
  headline: string;
  highlightText: string;
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
  const slideDurationMs = 6000;
  const intervalStepMs = 50;

  const slides: SlideData[] = [
    {
      id: 0,
      badge: "Real-Time Playback Synchronization",
      headline: "Never lose your",
      highlightText: "place.",
      subheadline:
        "PottyPlay connects patrons to the authoritative projection timeline on their mobile phone for a strictly capped 15-minute intermission.",
      ctaText: "Register Cinema",
      ctaHref: "#register",
      secondaryCtaText: "Explore How It Works",
      secondaryCtaHref: "#how-it-works",
      visualScene: (
        <div className="relative w-full max-w-lg mx-auto bg-brand-accent text-white rounded-3xl p-6 sm:p-7 shadow-elevated border border-neutral-800">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 text-xs">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="font-semibold tracking-wide text-neutral-200">
                AUDITORIUM 01: DOLBY ATMOS
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-neutral-800 text-brand-primary font-mono text-[11px] font-bold">
              SEAT A12 - ADMITTED
            </span>
          </div>

          <div className="mt-5 relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 flex flex-col justify-between p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold tracking-wider text-neutral-300 text-[11px]">
                FEATURE SCREENING IN PROGRESS
              </span>
              <span className="font-mono text-emerald-400 text-[11px] font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                SYNCED 0.0s DRIFT
              </span>
            </div>

            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 text-brand-primary">
                <Film className="w-6 h-6" />
              </div>
              <div className="mt-2 text-xs font-medium text-neutral-400">
                Authoritative Projector Feed
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest mt-0.5 tabular-nums">
                00:42:15.08
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-primary" />
                <span>Companion Window:</span>
              </div>
              <span className="font-mono font-bold text-brand-primary tabular-nums">
                13:45 REMAINING
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-neutral-400 text-[11px]">Break Allowance</div>
              <div className="font-bold text-white mt-0.5">Session 1 of 2 Allowed</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-neutral-400 text-[11px]">Exclusivity Protection</div>
              <div className="font-bold text-emerald-400 mt-0.5">Server-Enforced Cap</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      badge: "Elevated Patron Hospitality",
      headline: "A better cinema",
      highlightText: "experience.",
      subheadline:
        "Remove the dread of bathroom breaks during crucial plot twists. Patrons step out with confidence and return without missing a beat.",
      ctaText: "Review Theater Benefits",
      ctaHref: "#operator-benefits",
      secondaryCtaText: "See Patron Flow",
      secondaryCtaHref: "#patron-experience",
      visualScene: (
        <div className="relative w-full max-w-lg mx-auto bg-brand-surface rounded-3xl p-6 sm:p-7 shadow-elevated border border-brand-border text-brand-text-primary">
          <div className="flex items-center justify-between pb-4 border-b border-brand-border text-xs">
            <span className="font-bold text-brand-text-primary">
              Patron Companion Flow
            </span>
            <span className="px-2.5 py-1 rounded-full bg-brand-primary/20 text-brand-text-primary text-[11px] font-bold">
              Instant Activation
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-brand-text-primary">
                  Seamless Ticket Verification
                </div>
                <div className="text-xs text-brand-text-secondary mt-0.5">
                  Pre-linked via booking confirmation or scanned at auditorium entrance.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/30 text-brand-text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-brand-text-primary">
                  One-Tap Bathroom Mode
                </div>
                <div className="text-xs text-brand-text-secondary mt-0.5">
                  Instant activation without re-scanning QR codes or entering repetitive codes.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-brand-text-primary">
                  Prompt Return to Auditorium
                </div>
                <div className="text-xs text-brand-text-secondary mt-0.5">
                  Audible haptic reminder at 12 minutes gently nudges patron back to their seat.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span className="font-medium">Theatrical Sanctuary:</span>
            <span className="font-bold">Maintains Quiet in Halls</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: "Rigorous Content Rights & Security",
      headline: "The story",
      highlightText: "continues.",
      subheadline:
        "Engineered with studio-grade digital rights discipline. Strictly time-bounded, non-downloadable, and geo-fenced to the cinema premises.",
      ctaText: "Security & Entitlements",
      ctaHref: "#security",
      secondaryCtaText: "Developer Architecture",
      secondaryCtaHref: "/developers",
      visualScene: (
        <div className="relative w-full max-w-lg mx-auto bg-brand-accent text-white rounded-3xl p-6 sm:p-7 shadow-elevated border border-neutral-800">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-neutral-200">
                Content Security Perimeter
              </span>
            </div>
            <span className="font-mono text-[10px] text-neutral-400">
              SHA-256 ENCRYPTED
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">900-Second Hard Cap</div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Server revokes streaming authorization immediately when timer lapses.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">2 Breaks Per Ticket</div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Strict atomic database constraints prevent account sharing or duplicate claims.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">No Public Library</div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Only ongoing theatrical screenings can be viewed. Not a VOD or streaming site.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Studio Entitled</div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Explicit content rights authorization tied to verified theater screen.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: "Theater Management Integration",
      headline: "Built for cinema",
      highlightText: "operators.",
      subheadline:
        "A comprehensive operations workspace for cinema circuits. Monitor concurrent patron breaks, manage screen feeds, and review verified attendance telemetry.",
      ctaText: "Open Operator Workspace",
      ctaHref: "/operator",
      secondaryCtaText: "Register Your Venue",
      secondaryCtaHref: "#register",
      visualScene: (
        <div className="relative w-full max-w-lg mx-auto bg-brand-surface rounded-3xl p-6 sm:p-7 shadow-elevated border border-brand-border text-brand-text-primary">
          <div className="flex items-center justify-between pb-4 border-b border-brand-border text-xs">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-brand-secondary" />
              <span className="font-bold text-brand-text-primary">
                Operator Workspace Telemetry
              </span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              TMS CONNECTED
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
                <div className="text-[10px] text-brand-text-secondary font-medium uppercase">
                  Active Screens
                </div>
                <div className="text-xl font-extrabold text-brand-text-primary mt-0.5">
                  8 / 8
                </div>
              </div>
              <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
                <div className="text-[10px] text-brand-text-secondary font-medium uppercase">
                  Active Breaks
                </div>
                <div className="text-xl font-extrabold text-brand-primary mt-0.5">
                  14
                </div>
              </div>
              <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
                <div className="text-[10px] text-brand-text-secondary font-medium uppercase">
                  Avg Duration
                </div>
                <div className="text-xl font-extrabold text-brand-text-primary mt-0.5">
                  6.4m
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900 text-white text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] text-neutral-400">
                <span>Auditorium 1: Serengeti Shadows</span>
                <span className="font-mono text-emerald-400">NORMAL SYNC</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-primary h-full w-[65%]" />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Projection: 01:14:20</span>
                <span>Active Companions: 3</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-bg border border-brand-border text-xs flex items-center justify-between">
              <span className="text-brand-text-secondary">Commercial Terms:</span>
              <span className="font-semibold text-brand-text-primary">
                Custom Cinema-Level Pricing
              </span>
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

  const slide = slides[currentSlide];

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Ambient Accents */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Expressive Copy & Action */}
        <div className="lg:col-span-6 flex flex-col text-left">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white border border-brand-border text-xs font-semibold text-brand-text-secondary mb-6 shadow-subtle w-fit">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span>{slide.badge}</span>
          </div>

          {/* Expressive Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-brand-text-primary leading-[1.1] transition-opacity duration-300">
            {slide.headline}{" "}
            <span className="text-brand-primary relative inline-block">
              {slide.highlightText}
              <span
                className="absolute left-0 bottom-1 w-full h-3 bg-brand-primary/20 -z-10 rounded"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg text-brand-text-secondary leading-relaxed max-w-xl">
            {slide.subheadline}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={slide.ctaHref}
              className="py-3.5 px-6 rounded-xl font-bold text-sm bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all duration-150 shadow-subtle flex items-center justify-center space-x-2 text-center"
            >
              <span>{slide.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={slide.secondaryCtaHref}
              className="py-3.5 px-6 rounded-xl font-semibold text-sm bg-white text-brand-text-primary hover:bg-neutral-50 border border-brand-border transition-colors duration-150 flex items-center justify-center text-center"
            >
              <span>{slide.secondaryCtaText}</span>
            </a>
          </div>

          {/* Carousel Interactive Controls & Slide Progress */}
          <div className="mt-10 pt-6 border-t border-brand-border/80 flex items-center justify-between">
            {/* Slide Navigation Dots with Progress */}
            <div className="flex items-center space-x-2.5">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className="group relative h-2.5 rounded-full transition-all duration-300 overflow-hidden focus:outline-none"
                  style={{ width: currentSlide === idx ? "48px" : "12px" }}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <div className="w-full h-full bg-neutral-300 group-hover:bg-neutral-400 rounded-full" />
                  {currentSlide === idx && (
                    <div
                      className="absolute top-0 left-0 h-full bg-brand-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Carousel Buttons (Prev, Next, Pause/Play) */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-white transition-colors"
                aria-label={isPlaying ? "Pause carousel auto-advance" : "Resume carousel"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-white transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-lg border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-white transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Scene */}
        <div className="lg:col-span-6 flex items-center justify-center transition-all duration-300">
          {slide.visualScene}
        </div>
      </div>
    </section>
  );
}
