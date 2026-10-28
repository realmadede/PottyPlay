"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Film,
  Clock,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  ChevronRight,
  LogOut,
  RefreshCw,
  Sparkles,
  Ticket,
} from "lucide-react";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";

interface SessionData {
  sessionToken: string;
  sessionId: string;
  remainingSeconds: number;
  seatNumber: string;
  customerName?: string;
  ticketNumber: string;
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

interface TicketVerificationData {
  ticketNumber: string;
  claimToken?: string | null;
  seatNumber: string;
  customerName: string;
  screening: {
    id: string;
    title: string;
    cinemaName: string;
    screenName: string;
  };
  rights: {
    maxSessionDurationSeconds: number;
    licenseType: string;
    assetTitle: string;
  };
}

function WatchExperience() {
  const searchParams = useSearchParams();
  const initialClaim = searchParams.get("claim") || searchParams.get("ticket") || "";
  const initialToken = searchParams.get("token") || "";

  // View state
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [sessionExpiredReason, setSessionExpiredReason] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Form input state
  const [ticketInput, setTicketInput] = useState<string>(initialClaim);
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [showPhoneOptional, setShowPhoneOptional] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  // Verification state
  const [verifiedTicket, setVerifiedTicket] = useState<TicketVerificationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing session token in localStorage or query params on mount
  useEffect(() => {
    const savedToken = initialToken || localStorage.getItem("pottyplay_customer_token");
    if (savedToken) {
      syncExistingSession(savedToken);
    } else if (initialClaim) {
      verifyEntitlement(initialClaim);
    }
  }, [initialToken, initialClaim]);

  // Periodic synchronization when session is active
  useEffect(() => {
    if (!activeSession) return;

    setSecondsRemaining(activeSession.remainingSeconds);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          syncExistingSession(activeSession.sessionToken);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Sync authoritative position with backend every 6 seconds
    syncIntervalRef.current = setInterval(() => {
      syncExistingSession(activeSession.sessionToken, true);
    }, 6000);

    return () => {
      clearInterval(timer);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [activeSession?.sessionToken]);

  // Synchronize session with server
  const syncExistingSession = async (token: string, silent: boolean = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetch("/api/sessions/sync", {
        headers: {
          "x-session-token": token,
        },
      });

      const data = await res.json();

      if (res.ok && data.isValid) {
        setActiveSession({
          sessionToken: token,
          sessionId: data.session.id,
          remainingSeconds: data.remainingSeconds,
          seatNumber: data.session.seatNumber,
          customerName: data.session.customerName,
          ticketNumber: data.session.ticketNumber,
          screening: data.screening,
        });
        setSecondsRemaining(data.remainingSeconds);
        localStorage.setItem("pottyplay_customer_token", token);
        setErrorMessage(null);
      } else {
        // Session expired, revoked, or invalid
        localStorage.removeItem("pottyplay_customer_token");
        setActiveSession(null);
        if (data.reason) {
          setSessionExpiredReason(data.reason);
        }
      }
    } catch {
      if (!silent) {
        setErrorMessage("Network synchronization failed. Retrying...");
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Verify ticket or claim token
  const verifyEntitlement = async (identifierToVerify?: string) => {
    const code = (identifierToVerify || ticketInput).trim();
    if (!code) {
      setErrorMessage("Please enter your ticket code or claim token.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: code }),
      });

      const data = await res.json();

      if (res.ok && data.isEligible) {
        setVerifiedTicket({
          ticketNumber: data.ticket.ticketNumber,
          claimToken: data.ticket.claimToken,
          seatNumber: data.ticket.seatNumber,
          customerName: data.ticket.customerName,
          screening: data.screening,
          rights: data.rights,
        });
      } else {
        setErrorMessage(data.message || "Invalid ticket or claim code.");
        setVerifiedTicket(null);
      }
    } catch {
      setErrorMessage("Connection error while verifying ticket. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // Direct activation (one-time patron claim)
  const handleDirectActivate = async () => {
    if (!verifiedTicket) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const payload: {
        identifier: string;
        phoneNumber?: string;
        challengeId?: string;
      } = {
        identifier: verifiedTicket.claimToken || verifiedTicket.ticketNumber,
      };

      if (otpChallengeId && otpSent) {
        payload.challengeId = otpChallengeId;
      } else if (phoneInput.trim()) {
        payload.phoneNumber = phoneInput.trim();
      }

      const res = await fetch("/api/sessions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success && data.sessionToken) {
        localStorage.setItem("pottyplay_customer_token", data.sessionToken);
        setActiveSession({
          sessionToken: data.sessionToken,
          sessionId: data.sessionId,
          remainingSeconds: data.durationSeconds || 900,
          seatNumber: data.seatNumber,
          customerName: data.customerName,
          ticketNumber: data.ticketNumber,
          screening: {
            id: data.screeningId,
            title: data.screeningTitle,
            cinemaName: data.cinemaName,
            screenName: data.screenName,
            playbackPositionSeconds: data.initialPlaybackPositionSeconds || 0,
            durationSeconds: 1800,
            isPaused: false,
            videoUrl: data.videoUrl,
          },
        });
        setSecondsRemaining(data.durationSeconds || 900);
      } else {
        setErrorMessage(data.error || "Session activation failed. Please contact theater staff.");
      }
    } catch {
      setErrorMessage("Activation network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Africa's Talking OTP Request
  const handleRequestOtp = async () => {
    if (!phoneInput.trim()) {
      setErrorMessage("Please enter your phone number (+255...).");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpChallengeId(data.challengeId);
        setOtpSent(true);
        if (data.simulatedCode) {
          setSimulatedOtpNotice(`Demonstration OTP: ${data.simulatedCode}`);
        }
      } else {
        setErrorMessage(data.error || "Failed to send SMS code.");
      }
    } catch {
      setErrorMessage("SMS service error. Please try direct activation.");
    } finally {
      setLoading(false);
    }
  };

  // Africa's Talking OTP Verify
  const handleVerifyOtp = async () => {
    if (!otpChallengeId || !otpCode.trim()) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: otpChallengeId,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Now proceed to activate session with verified challenge
        handleDirectActivate();
      } else {
        setErrorMessage(data.error || "Invalid code. Please check SMS and retry.");
      }
    } catch {
      setErrorMessage("Verification network error.");
    } finally {
      setLoading(false);
    }
  };

  // Leave break session
  const handleLeaveSession = () => {
    localStorage.removeItem("pottyplay_customer_token");
    setActiveSession(null);
    setSessionExpiredReason("You ended your break companion session.");
  };

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // ==========================================
  // VIEW 1: ACTIVE COMPANION VIEWING SESSION
  // ==========================================
  if (activeSession) {
    const isWarning = secondsRemaining <= 180 && secondsRemaining > 60;
    const isUrgent = secondsRemaining <= 60;

    return (
      <main className="min-h-screen bg-bg text-ink flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950">
        {/* Top Session Bar */}
        <header className="sticky top-0 z-30 bg-field/90 backdrop-blur-md border-b border-line px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Image
                src="/brand-mark.svg"
                alt="PottyPlay"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg shadow-sm"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Companion Stream
                </p>
                <p className="text-sm font-bold text-ink leading-tight">
                  Seat {activeSession.seatNumber} &middot; {activeSession.screening.screenName}
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                isUrgent
                  ? "bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse"
                  : isWarning
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums font-mono">
                {formatCountdown(secondsRemaining)} left
              </span>
            </div>
          </div>
        </header>

        {/* Video Player & Synchronized Film Canvas */}
        <section className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col justify-center space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-card border border-line">
            <CinemaCanvasPlayer
              positionSeconds={activeSession.screening.playbackPositionSeconds}
              durationSeconds={activeSession.screening.durationSeconds}
              isPaused={activeSession.screening.isPaused}
              title={activeSession.screening.title}
              cinemaName={activeSession.screening.cinemaName}
              seatNumber={activeSession.seatNumber}
            />
          </div>

          {/* Sync & Theater Advisory Card */}
          <div className="bg-field rounded-2xl p-4 border border-line shadow-card flex items-start justify-between space-x-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Frame-Synchronized with Auditorium
                </p>
              </div>
              <h2 className="text-sm font-bold text-ink">
                {activeSession.screening.title}
              </h2>
              <p className="text-xs text-muted">
                {activeSession.screening.cinemaName} &middot; Maximum break limit: 15 minutes
              </p>
            </div>
            <button
              onClick={() => syncExistingSession(activeSession.sessionToken)}
              disabled={isSyncing}
              className="p-2 rounded-xl border border-line hover:bg-field-raised text-muted hover:text-ink transition-colors"
              title="Force timeline resync"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Re-entry Guidance */}
          <div className="bg-field border border-line rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-card">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-ink leading-tight">
                Return to <strong>Seat {activeSession.seatNumber}</strong> when ready. Playback stays in sync.
              </p>
            </div>
            <button
              onClick={handleLeaveSession}
              className="flex items-center space-x-1 text-xs font-semibold text-red-400 hover:text-red-300 hover:underline flex-shrink-0 ml-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Break</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-3 text-[11px] text-muted border-t border-line bg-bg">
          PottyPlay Authorized Cinema Companion Viewing &middot; Protected Feed
        </footer>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: EXPIRED / REVOKED SCREEN
  // ==========================================
  if (sessionExpiredReason) {
    return (
      <main className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <div className="max-w-md w-full bg-field rounded-3xl border border-line p-6 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-ink">
              Viewing Break Concluded
            </h1>
            <p className="text-sm text-muted">
              {sessionExpiredReason}
            </p>
          </div>

          <div className="p-3.5 bg-bg border border-line rounded-2xl text-xs text-muted text-left space-y-1">
            <p className="font-bold text-ink">Auditorium Re-entry</p>
            <p>
              Please return to your assigned auditorium seat to continue enjoying the theatrical screening.
            </p>
          </div>

          <button
            onClick={() => {
              setSessionExpiredReason(null);
              setVerifiedTicket(null);
              setTicketInput("");
            }}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition-colors shadow-sm"
          >
            Start New Break Session
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 3: ONBOARDING & TICKET VERIFICATION
  // ==========================================
  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950">
      {/* Header */}
      <header className="border-b border-line bg-field/90 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/brand-mark.svg"
              alt="PottyPlay"
              width={28}
              height={28}
              className="rounded-lg shadow-sm"
            />
            <span className="font-extrabold text-base tracking-tight text-ink">
              PottyPlay
            </span>
          </Link>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Patron Companion
          </span>
        </div>
      </header>

      {/* Main Container */}
      <section className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">
            Cinema Companion Break
          </h1>
          <p className="text-xs text-muted">
            Continue watching your screening during a short personal break without losing your place.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl text-xs text-[#DC2626] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: Enter Ticket or Claim Code (if not verified yet) */}
        {!verifiedTicket && (
          <div className="bg-field rounded-2xl border border-line p-5 shadow-card space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="ticketCode"
                className="block text-xs font-bold uppercase tracking-wider text-muted"
              >
                Ticket or QR Claim Code
              </label>
              <div className="relative">
                <input
                  id="ticketCode"
                  type="text"
                  placeholder="e.g. TK-8821-A12 or CLM-..."
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm font-mono uppercase focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 bg-bg text-ink placeholder-muted"
                />
                <Ticket className="w-4 h-4 absolute right-3.5 top-3 text-muted" />
              </div>
              <p className="text-[11px] text-muted">
                Located on your printed cinema ticket, digital pass, or seat QR code.
              </p>
            </div>

            <button
              onClick={() => verifyEntitlement()}
              disabled={loading || !ticketInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify Ticket Entitlement</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Entitlement Confirmed & Ready to Activate */}
        {verifiedTicket && (
          <div className="bg-field rounded-2xl border border-line p-5 shadow-card space-y-4">
            {/* Ticket Summary Card */}
            <div className="bg-bg border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Entitlement Verified
                </span>
                <span className="text-xs font-mono font-bold text-ink">
                  Seat {verifiedTicket.seatNumber}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {verifiedTicket.screening.title}
                </h3>
                <p className="text-xs text-muted">
                  {verifiedTicket.screening.cinemaName} &middot; {verifiedTicket.screening.screenName}
                </p>
              </div>
              <div className="pt-1 border-t border-line flex items-center justify-between text-[11px] text-muted">
                <span>Patron: {verifiedTicket.customerName}</span>
                <span>Max: {Math.round(verifiedTicket.rights.maxSessionDurationSeconds / 60)} min</span>
              </div>
            </div>

            {/* Direct Activation Button */}
            {!otpSent && (
              <div className="space-y-3">
                <button
                  onClick={handleDirectActivate}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      <span>Start Companion Break Now</span>
                    </>
                  )}
                </button>

                {/* Optional Africa's Talking SMS Phone Registration */}
                <div className="pt-2">
                  {!showPhoneOptional ? (
                    <button
                      type="button"
                      onClick={() => setShowPhoneOptional(true)}
                      className="w-full text-center text-xs text-muted hover:text-ink hover:underline"
                    >
                      Want SMS confirmation & device recovery? (Optional)
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-line">
                      <label
                        htmlFor="phoneNumber"
                        className="block text-xs font-semibold text-muted"
                      >
                        Phone number for Africa&apos;s Talking SMS alerts:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          id="phoneNumber"
                          type="tel"
                          placeholder="+255 7..."
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-line text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 bg-bg text-ink placeholder-muted"
                        />
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={loading || !phoneInput.trim()}
                          className="px-3 py-2 bg-field text-ink text-xs font-semibold rounded-xl hover:bg-field-raised border border-line disabled:opacity-50 transition-colors"
                        >
                          Send OTP
                        </button>
                      </div>
                      <p className="text-[10px] text-muted">
                        Secured via Africa&apos;s Talking SMS Gateway.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OTP Verification Step if patron requested SMS */}
            {otpSent && (
              <div className="space-y-3 pt-2 border-t border-line">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-ink">
                    Enter SMS Verification Code
                  </p>
                  <p className="text-[11px] text-muted">
                    Sent to {phoneInput}.
                  </p>
                  {simulatedOtpNotice && (
                    <p className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg">
                      {simulatedOtpNotice}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-line text-sm font-mono tracking-widest text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 bg-bg text-ink placeholder-muted"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length < 6}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Confirm & Start
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setVerifiedTicket(null);
                setOtpSent(false);
                setShowPhoneOptional(false);
              }}
              className="w-full text-center text-xs text-muted hover:underline"
            >
              Use a different ticket
            </button>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-field p-3 rounded-xl border border-line space-y-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-bold text-ink">15-Minute Limit</p>
            <p className="text-[11px] text-muted">
              Strict maximum viewing window to encourage returning to your seat.
            </p>
          </div>
          <div className="bg-field p-3 rounded-xl border border-line space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-bold text-ink">Auditorium Sync</p>
            <p className="text-[11px] text-muted">
              Playback is matched directly with the main cinema projector.
            </p>
          </div>
        </div>
        {/* Native App Banner with Truthful Store State */}
        <div className="bg-field p-4 rounded-2xl border border-line text-left shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">
              Frequent Cinema Patron?
            </span>
            <span className="text-[10px] uppercase font-bold text-muted bg-bg px-2 py-0.5 rounded border border-line">
              {process.env.NEXT_PUBLIC_APP_STORE_URL || process.env.NEXT_PUBLIC_PLAY_STORE_URL ? "Download App" : "Store Release Pending"}
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {process.env.NEXT_PUBLIC_APP_STORE_URL || process.env.NEXT_PUBLIC_PLAY_STORE_URL ? (
              "Get our official mobile app for one-tap breaks and screening alerts without scanning auditorium QR codes."
            ) : (
              "The official iOS and Android native containers are currently in partner trial. Patrons can continue using this web companion player without app installation."
            )}
          </p>
          <div className="pt-1 flex items-center justify-between">
            {process.env.NEXT_PUBLIC_APP_STORE_URL || process.env.NEXT_PUBLIC_PLAY_STORE_URL ? (
              <a
                href={process.env.NEXT_PUBLIC_APP_STORE_URL || process.env.NEXT_PUBLIC_PLAY_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3.5 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm"
              >
                Get the App
              </a>
            ) : (
              <Link
                href="/app"
                className="py-2 px-3.5 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm"
              >
                Open Mobile App
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-bg py-3 px-4 text-center text-[11px] text-muted">
        PottyPlay Cinema Companion &middot; Authorized Patrons Only
      </footer>
    </main>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center text-xs text-muted">
          Loading companion stream...
        </div>
      }
    >
      <WatchExperience />
    </Suspense>
  );
}
