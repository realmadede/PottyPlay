"use client";

import React, { useState } from "react";
import { Film, Ticket, Clock, ShieldCheck, ArrowRight, Check } from "lucide-react";

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 0,
      badge: "Theatrical Continuity",
      icon: Film,
      title: "Never Miss the Critical Scene",
      description:
        "PottyPlay connects you to the ongoing cinema screening during an intermission. Follow the dialogue and storyline without stepping out of context.",
    },
    {
      id: 1,
      badge: "Genuine Admission",
      icon: Ticket,
      title: "Linked to Your Movie Ticket",
      description:
        "Every session is strictly authorized through your admitted cinema ticket barcode or booking reference. No account sharing or public playback.",
    },
    {
      id: 2,
      badge: "Strict Session Limit",
      icon: Clock,
      title: "15-Minute Intermission Window",
      description:
        "Each bathroom break is limited to 900 seconds (15 minutes) with a maximum of two breaks per ticket. Built to encourage a swift return to your seat.",
    },
    {
      id: 3,
      badge: "Partner Theaters",
      icon: ShieldCheck,
      title: "Authorized Exhibitors Only",
      description:
        "Available exclusively at participating, approved cinema locations with verified content licensing and live projection synchronization.",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md flex flex-col justify-between p-6 sm:p-10 select-none text-ink">
      {/* Top Header with Skip Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-muted tracking-wider uppercase">
          Welcome to PottyPlay
        </span>
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-semibold text-muted hover:text-ink px-3 py-1.5 rounded-lg border border-line hover:bg-field transition-colors"
        >
          Skip Intro
        </button>
      </div>

      {/* Center Animated Slide Panel */}
      <div className="max-w-md mx-auto w-full text-center flex flex-col items-center my-auto">
        {/* Animated Icon Housing */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-field text-amber-400 flex items-center justify-center shadow-card border border-line mb-8 transition-transform duration-300">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Badge */}
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
          {slide.badge}
        </span>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-snug">
          {slide.title}
        </h2>

        {/* Description */}
        <p className="mt-4 text-sm text-muted leading-relaxed max-w-sm">
          {slide.description}
        </p>
      </div>

      {/* Bottom Navigation & Progress Dots */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pt-6 border-t border-line">
        {/* Progress Indicator Dots */}
        <div className="flex items-center space-x-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? "w-8 bg-amber-500" : "w-2 bg-neutral-800"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Next / Get Started Button */}
        <button
          type="button"
          onClick={handleNext}
          className="py-3 px-6 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm flex items-center space-x-2"
        >
          {currentSlide === slides.length - 1 ? (
            <>
              <span>Get Started</span>
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
