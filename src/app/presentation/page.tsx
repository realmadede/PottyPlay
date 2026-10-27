"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";
import {
  Film,
  QrCode,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Smartphone,
  Play,
  RotateCcw,
} from "lucide-react";

export default function PresentationExperiencePage() {
  const [demoPosition, setDemoPosition] = useState(720); // 12 minutes in
  const [isPaused, setIsPaused] = useState(false);

  // Controlled demonstration ticket fixture
  const demoTicket = {
    ticketNumber: "CC-MLM-7821-A12",
    claimToken: "CLM-MLM-A12-8821",
    seatNumber: "A12",
    screeningTitle: "Serengeti Shadows (Auditorium 1)",
    cinemaName: "Century Cinemax - Mlimani City (Demonstration)",
  };

  const companionUrl = `/watch?claim=${demoTicket.claimToken}`;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col">
      {/* Top Banner */}
      <header className="bg-white border-b border-brand-border px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo size="sm" variant="full" href="/" />

        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
            Controlled Partner Demonstration
          </span>
          <Link
            href="/"
            className="text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary"
          >
            Public Site
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-left">
        {/* Scenario Explanation Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3 shadow-subtle">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
          <div className="space-y-1">
            <strong className="font-bold">Simulated Demonstration Environment</strong>
            <p className="text-amber-800 leading-relaxed">
              This controlled presentation demonstrates how a patron transitions from the auditorium screen to their personal companion device. The QR verification below links to a real backend transaction utilizing isolated test fixtures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Auditorium Projection Screen Mockup */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-brand-text-primary">
                  1. Auditorium Projection Feed
                </h2>
                <p className="text-xs text-brand-text-secondary">
                  Authoritative theater timeline driving connected companion players.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                  isPaused
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                }`}
              >
                {isPaused ? "Resume Projection" : "Simulate Projector Pause"}
              </button>
            </div>

            {/* Canvas Player simulating auditorium feed */}
            <div className="rounded-3xl overflow-hidden border border-brand-border bg-neutral-900 shadow-elevated">
              <CinemaCanvasPlayer
                title="Serengeti Shadows: The Silent Guardian"
                cinemaName="Auditorium Screen 01 (Dolby Atmos)"
                seatNumber="A12"
                positionSeconds={demoPosition}
                durationSeconds={1800}
                isPaused={isPaused}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-brand-border">
                <span className="text-[10px] uppercase font-bold text-brand-text-secondary">
                  Projection State
                </span>
                <div className="font-bold text-brand-text-primary mt-0.5">
                  {isPaused ? "Paused (Intermission)" : "Normal Playback"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-brand-border">
                <span className="text-[10px] uppercase font-bold text-brand-text-secondary">
                  Timecode Lock
                </span>
                <div className="font-mono font-bold text-brand-primary mt-0.5">
                  00:12:00 / 00:30:00
                </div>
              </div>
            </div>
          </div>

          {/* Right: Patron Corridor QR Code & Verification */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-brand-text-primary">
                2. Patron Companion Test Flow
              </h2>
              <p className="text-xs text-brand-text-secondary">
                Scan with your smartphone to experience real backend authorization.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-elevated text-center space-y-5">
              {/* QR Code Presentation Box */}
              <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border inline-block mx-auto">
                {/* SVG Visual QR representation */}
                <div className="w-44 h-44 bg-white p-3 rounded-xl border border-neutral-300 flex flex-col items-center justify-center space-y-2">
                  <QrCode className="w-28 h-28 text-brand-accent" />
                  <span className="font-mono text-[9px] text-neutral-500 font-bold truncate max-w-[150px]">
                    {demoTicket.claimToken}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-xs text-brand-text-primary">
                  Seat {demoTicket.seatNumber} &bull; Ticket {demoTicket.ticketNumber}
                </div>
                <div className="text-[11px] text-brand-text-secondary">
                  Authorized break allowance: 2 sessions max &bull; 900s per session
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={companionUrl}
                  target="_blank"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2"
                >
                  <span>Open Companion Experience Directly</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <p className="mt-2 text-[10px] text-brand-text-secondary">
                  Opens the browser-based companion route with validated demo token.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
