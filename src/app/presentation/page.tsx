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
    <div className="min-h-screen bg-bg text-ink flex flex-col overflow-x-clip selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Banner */}
      <header className="bg-field/90 backdrop-blur-md border-b border-line px-3 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-40 min-w-0">
        <BrandLogo size="sm" variant="full" href="/" />

        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
            Controlled Partner Demonstration
          </span>
          <span className="sm:hidden px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
            Demo
          </span>
          <Link
            href="/"
            className="text-xs font-semibold text-muted hover:text-ink transition-colors flex-shrink-0"
          >
            Public Site
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-left">
        {/* Scenario Explanation Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-3 shadow-card">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <strong className="font-bold text-amber-400">Simulated Demonstration Environment</strong>
            <p className="text-amber-200/80 leading-relaxed">
              This controlled presentation demonstrates how a patron transitions from the auditorium screen to their personal companion device. The QR verification below links to a real backend transaction utilizing isolated test fixtures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Auditorium Projection Screen Mockup */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-ink">
                  1. Auditorium Projection Feed
                </h2>
                <p className="text-xs text-muted">
                  Authoritative theater timeline driving connected companion players.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                  isPaused
                    ? "bg-emerald-500 text-neutral-950 font-black shadow-sm"
                    : "bg-field text-ink border border-line hover:bg-field-raised"
                }`}
              >
                {isPaused ? "Resume Projection" : "Simulate Projector Pause"}
              </button>
            </div>

            {/* Canvas Player simulating auditorium feed */}
            <div className="rounded-3xl overflow-hidden border border-line bg-field shadow-card">
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
              <div className="p-3.5 rounded-2xl bg-field border border-line shadow-card">
                <span className="text-[10px] uppercase font-bold text-muted">
                  Projection State
                </span>
                <div className="font-bold text-ink mt-0.5">
                  {isPaused ? "Paused (Intermission)" : "Normal Playback"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-field border border-line shadow-card">
                <span className="text-[10px] uppercase font-bold text-muted">
                  Timecode Lock
                </span>
                <div className="font-mono font-bold text-amber-400 mt-0.5">
                  00:12:00 / 00:30:00
                </div>
              </div>
            </div>
          </div>

          {/* Right: Patron Corridor QR Code & Verification */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-ink">
                2. Patron Companion Test Flow
              </h2>
              <p className="text-xs text-muted">
                Scan with your smartphone to experience real backend authorization.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-field border border-line shadow-card text-center space-y-5">
              {/* QR Code Presentation Box */}
              <div className="p-5 rounded-2xl bg-bg border border-line inline-block mx-auto">
                {/* SVG Visual QR representation */}
                <div className="w-44 h-44 bg-white p-3 rounded-xl border border-line flex flex-col items-center justify-center space-y-2">
                  <QrCode className="w-28 h-28 text-neutral-950" />
                  <span className="font-mono text-[9px] text-neutral-600 font-bold truncate max-w-[150px]">
                    {demoTicket.claimToken}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-xs text-ink">
                  Seat {demoTicket.seatNumber} &bull; Ticket {demoTicket.ticketNumber}
                </div>
                <div className="text-[11px] text-muted">
                  Authorized break allowance: 2 sessions max &bull; 900s per session
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={companionUrl}
                  target="_blank"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>Open Companion Experience Directly</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <p className="mt-2 text-[10px] text-muted">
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