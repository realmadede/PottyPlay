"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";
import {
  Clock,
  Ticket,
  Film,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  LogOut,
} from "lucide-react";

interface ActiveSessionData {
  sessionToken: string;
  sessionId: string;
  remainingSeconds: number;
  breakNumber: number;
  ticketNumber: string;
  seatNumber: string;
  screening: {
    id: string;
    title: string;
    cinemaName: string;
    screenName: string;
    playbackPositionSeconds: number;
    durationSeconds: number;
    isPaused: boolean;
    videoUrl?: string;
  };
}

interface EligibleTicketData {
  ticketNumber: string;
  seatNumber: string;
  customerName: string;
  breaksUsed: number;
  maxBreaks: number;
  breaksRemaining: number;
  screening: {
    id: string;
    title: string;
    cinemaName: string;
    screenName: string;
  };
}

export function BathroomView() {
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [eligibleTicket, setEligibleTicket] = useState<EligibleTicketData | null>(null);
  const [remainingTimer, setRemainingTimer] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual ticket entry fallback if no ticket pre-linked
  const [manualTicket, setManualTicket] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/bathroom");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load bathroom status.");
      }

      if (data.hasActiveSession && data.session) {
        setActiveSession(data.session);
        setRemainingTimer(data.session.remainingSeconds);
      } else {
        setActiveSession(null);
        setEligibleTicket(data.eligibleTicket || null);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error checking bathroom status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Timer countdown countdown for active session
  useEffect(() => {
    if (!activeSession || remainingTimer <= 0) return;

    const interval = setInterval(() => {
      setRemainingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveSession(null);
          checkStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, remainingTimer, checkStatus]);

  // Periodic authoritative synchronization with cinema timeline
  useEffect(() => {
    if (!activeSession) return;

    const sessionToken = activeSession.sessionToken;

    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/sessions/sync", {
          headers: { "x-session-token": sessionToken },
        });
        const data = await res.json();
        if (res.ok && data.isValid) {
          setRemainingTimer(data.remainingSeconds);
          setActiveSession((prev) =>
            prev
              ? {
                  ...prev,
                  remainingSeconds: data.remainingSeconds,
                  screening: {
                    ...prev.screening,
                    playbackPositionSeconds: data.screening?.playbackPositionSeconds ?? prev.screening.playbackPositionSeconds,
                    isPaused: data.screening?.isPaused ?? prev.screening.isPaused,
                  },
                }
              : null
          );
        } else if (res.ok && !data.isValid) {
          // Hard expiration or operator revocation
          setActiveSession(null);
          checkStatus();
        }
      } catch {
        // silent background sync
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [activeSession, checkStatus]);

  const handleEndBreak = async () => {
    if (!activeSession) return;
    try {
      await fetch("/api/sessions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": activeSession.sessionToken,
        },
      });
    } catch {
      // silent
    }
    setActiveSession(null);
    await checkStatus();
  };

  // Activate session
  const handleActivate = async (ticketNumberToUse: string) => {
    try {
      setActivating(true);
      setErrorMessage(null);

      const res = await fetch("/api/customer/bathroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber: ticketNumberToUse }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to activate bathroom break.");
      }

      await checkStatus();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Activation failed.");
    } finally {
      setActivating(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
          Bathroom Mode
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          Live theatrical companion viewing. Capped at 900 seconds (15 minutes).
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading && (
        <div className="p-10 rounded-3xl bg-field border border-line flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-xs text-muted">Checking screening entitlement...</span>
        </div>
      )}

      {/* 1. Active Session State: Display Synchronized Canvas Player */}
      {!loading && activeSession && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl glass-ios26 glass-ios26-rim glass-ios26-glint text-ink flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-ink">
                  {activeSession.screening.cinemaName} &bull; {activeSession.screening.screenName}
                </div>
                <div className="text-[11px] text-muted">
                  Seat {activeSession.seatNumber} &bull; Break {activeSession.breakNumber} of 2
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                Time Remaining
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
                {formatTime(remainingTimer)}
              </div>
            </div>
          </div>

          {/* Synchronized Player Canvas */}
          <div className="rounded-3xl overflow-hidden border border-line bg-bg shadow-elevated">
            <CinemaCanvasPlayer
              title={activeSession.screening.title}
              cinemaName={activeSession.screening.cinemaName}
              seatNumber={activeSession.seatNumber}
              patronIdentity={activeSession.ticketNumber}
              positionSeconds={activeSession.screening.playbackPositionSeconds}
              durationSeconds={activeSession.screening.durationSeconds}
              isPaused={activeSession.screening.isPaused}
            />
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Session strictly terminates when timer reaches 00:00.</span>
            </div>
            <button
              type="button"
              onClick={handleEndBreak}
              className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] transition-colors"
            >
              Return to Auditorium
            </button>
          </div>
        </div>
      )}

      {/* 2. Inactive Session: Eligible Ticket Available */}
      {!loading && !activeSession && eligibleTicket && (
        <div className="p-6 sm:p-8 rounded-3xl bg-field border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div className="flex items-center space-x-2">
              <Ticket className="w-5 h-5 text-amber-400" />
              <span className="font-extrabold text-sm text-ink">
                Verified Cinema Admission
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
              ADMITTED & ELIGIBLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-bg border border-line">
              <div className="text-muted text-[11px]">Feature Screening</div>
              <div className="font-extrabold text-ink text-base mt-1">
                {eligibleTicket.screening.title}
              </div>
              <div className="text-muted text-xs mt-1">
                {eligibleTicket.screening.cinemaName} &bull; {eligibleTicket.screening.screenName}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bg border border-line flex flex-col justify-between">
              <div>
                <div className="text-muted text-[11px]">Break Allowance</div>
                <div className="font-extrabold text-ink text-base mt-1">
                  Break {eligibleTicket.breaksUsed + 1} of {eligibleTicket.maxBreaks}
                </div>
              </div>
              <div className="text-emerald-400 font-semibold text-[11px] mt-2">
                {eligibleTicket.breaksRemaining} break remaining for this screening
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={activating}
              onClick={() => handleActivate(eligibleTicket.ticketNumber)}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Synchronized Stream...</span>
                </>
              ) : (
                <>
                  <span>Activate Bathroom Break (15 Min Max)</span>
                  <Play className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="mt-3 text-[11px] text-center text-muted">
              No QR re-scan or OTP required. Stream connects directly to auditorium projection feed.
            </p>
          </div>
        </div>
      )}

      {/* 3. Inactive Session: No Pre-Linked Ticket -> Enter Barcode */}
      {!loading && !activeSession && !eligibleTicket && (
        <div className="p-6 sm:p-8 rounded-3xl bg-field border border-line shadow-card space-y-5">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-ink">
              Connect Your Cinema Ticket
            </h3>
            <p className="text-xs text-muted mt-1">
              Enter your ticket barcode from your printed ticket or booking receipt to authorize your companion stream.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <input
              type="text"
              placeholder="e.g. TK-8821-4401"
              value={manualTicket}
              onChange={(e) => setManualTicket(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line bg-bg text-ink placeholder-muted text-center font-mono uppercase text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            />

            <button
              type="button"
              disabled={activating || !manualTicket.trim()}
              onClick={() => handleActivate(manualTicket)}
              className="w-full py-3.5 px-4 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {activating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify Ticket & Activate Break</span>
                  <Play className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-bg border border-line text-[11px] text-muted text-center">
            Ticket barcodes are located on your printed cinema ticket stub or mobile booking pass.
          </div>
        </div>
      )}
    </div>
  );
}
