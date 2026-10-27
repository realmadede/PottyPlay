"use client";

import React, { useState, useEffect, useRef } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";
import {
  Film,
  Ticket,
  Phone,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Info,
  Tv,
} from "lucide-react";

type CustomerStep =
  | "WELCOME"
  | "TICKET_INPUT"
  | "PHONE_INPUT"
  | "OTP_VERIFY"
  | "CONFIRMATION"
  | "ACTIVE_STREAM"
  | "SESSION_EXPIRED"
  | "ERROR";

export default function CustomerPage() {
  const [step, setStep] = useState<CustomerStep>("WELCOME");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Ticket state
  const [ticketNumber, setTicketNumber] = useState("CC-MLM-7821-A12");
  const [verifiedTicket, setVerifiedTicket] = useState<{
    id: string;
    ticketNumber: string;
    seatNumber: string;
    customerName: string;
    screeningTitle: string;
    cinemaName: string;
    screenName: string;
    screeningId: string;
  } | null>(null);

  // Phone & OTP state
  const [phoneNumber, setPhoneNumber] = useState("+255712345678");
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Active Session state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(900);
  const [playbackState, setPlaybackState] = useState<{
    positionSeconds: number;
    durationSeconds: number;
    isPaused: boolean;
    title: string;
    cinemaName: string;
    screenName: string;
    seatNumber: string;
  } | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check existing session token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("pottyplay_customer_token");
    if (savedToken) {
      setSessionToken(savedToken);
      fetchSessionSync(savedToken);
    }
  }, []);

  // Periodic heartbeat sync when session is active
  useEffect(() => {
    if (step === "ACTIVE_STREAM" && sessionToken) {
      heartbeatIntervalRef.current = setInterval(() => {
        fetchSessionSync(sessionToken);
      }, 4000);

      // Local countdown tick
      const countdownInterval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setStep("SESSION_EXPIRED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        clearInterval(countdownInterval);
      };
    }
  }, [step, sessionToken]);

  const fetchSessionSync = async (token: string) => {
    try {
      const res = await fetch(`/api/sessions/sync?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok || !data.isValid) {
        if (data.status === "EXPIRED") {
          setStep("SESSION_EXPIRED");
        } else if (data.status === "REVOKED") {
          setErrorMessage(data.reason || "Session revoked by operator.");
          setStep("ERROR");
        } else {
          setErrorMessage(data.reason || "Unable to synchronize session.");
          setStep("ERROR");
        }
        return;
      }

      setRemainingSeconds(data.remainingSeconds);
      if (data.screening) {
        setPlaybackState({
          positionSeconds: data.screening.playbackPositionSeconds,
          durationSeconds: data.screening.durationSeconds,
          isPaused: data.screening.isPaused,
          title: data.screening.title,
          cinemaName: data.screening.cinemaName,
          screenName: data.screening.screenName,
          seatNumber: data.session?.seatNumber || "A12",
        });
        setStep("ACTIVE_STREAM");
      }
    } catch {
      // Network hiccup - let local countdown continue
    }
  };

  // Step 1 -> 2: Verify Ticket
  const handleVerifyTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber }),
      });
      const data = await res.json();

      if (!res.ok || !data.isEligible) {
        setErrorMessage(data.message || "Ticket verification failed.");
        setStep("ERROR");
        setLoading(false);
        return;
      }

      setVerifiedTicket({
        id: data.ticket.id,
        ticketNumber: data.ticket.ticketNumber,
        seatNumber: data.ticket.seatNumber,
        customerName: data.ticket.customerName,
        screeningTitle: data.screening.title,
        cinemaName: data.screening.cinemaName,
        screenName: data.screening.screenName,
        screeningId: data.screening.id,
      });

      setStep("PHONE_INPUT");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMessage(msg);
      setStep("ERROR");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Request OTP SMS
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setOtpError("");

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to send verification SMS.");
        setLoading(false);
        return;
      }

      setChallengeId(data.challengeId);
      setIsSimulatorMode(data.isSimulator);
      if (data.simulatedCode) {
        setSimulatedOtp(data.simulatedCode);
        setOtpCode(data.simulatedCode); // Auto-fill for judge convenience in test mode
      }

      setStep("OTP_VERIFY");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> 4: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data.error || "Incorrect code. Please try again.");
        setLoading(false);
        return;
      }

      setStep("CONFIRMATION");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification error";
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 4 -> 5: Activate Break Session
  const handleActivateSession = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/sessions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: verifiedTicket?.ticketNumber,
          challengeId,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to activate session.");
        setStep("ERROR");
        setLoading(false);
        return;
      }

      setSessionToken(data.sessionToken);
      localStorage.setItem("pottyplay_customer_token", data.sessionToken);
      setRemainingSeconds(data.durationSeconds || 900);

      setPlaybackState({
        positionSeconds: data.initialPlaybackPositionSeconds || 0,
        durationSeconds: 1800,
        isPaused: false,
        title: data.screeningTitle || "Cinema Feature",
        cinemaName: data.cinemaName || "Century Cinemax",
        screenName: data.screenName || "Screen 1",
        seatNumber: data.seatNumber || "A12",
      });

      setStep("ACTIVE_STREAM");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Activation failed";
      setErrorMessage(msg);
      setStep("ERROR");
    } finally {
      setLoading(false);
    }
  };

  // Return to Cinema action
  const handleEndSessionEarly = () => {
    if (confirm("Are you sure you want to exit your companion break and return to the cinema hall?")) {
      localStorage.removeItem("pottyplay_customer_token");
      setSessionToken(null);
      setStep("WELCOME");
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-cinema-950 text-cinema-100">
      <NavigationHeader />

      <main className="flex-1 flex flex-col justify-center max-w-lg w-full mx-auto p-4 sm:p-6">
        {/* State 1: Welcome Screen */}
        {step === "WELCOME" && (
          <div className="flex flex-col items-center text-center space-y-6 py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-500 to-amber-600 flex items-center justify-center shadow-xl shadow-gold-500/20">
              <Film className="w-8 h-8 text-cinema-950" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cinema-50">
                Never Miss a Moment
              </h1>
              <p className="text-sm text-cinema-300 max-w-sm leading-relaxed">
                Need a temporary restroom or refreshment break? Follow your ongoing cinema screening on your mobile device in real time.
              </p>
            </div>

            <div className="w-full bg-cinema-900 border border-cinema-800 rounded-xl p-4 text-left space-y-3">
              <div className="flex items-center space-x-3 text-xs text-cinema-300">
                <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>15-minute maximum companion break session</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-cinema-300">
                <Ticket className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>Requires an authenticated screening ticket pass</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-cinema-300">
                <ShieldCheck className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>Africa&apos;s Talking SMS two-factor verification</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep("TICKET_INPUT")}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-cinema-950 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center space-x-2"
            >
              <span>Begin Companion Break</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-cinema-500 max-w-xs">
              Simulated demonstration for Africa&apos;s Talking Hackathon 2026. Century Cinemax simulation and authorized demonstration media.
            </p>
          </div>
        )}

        {/* State 2: Ticket Verification */}
        {step === "TICKET_INPUT" && (
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-cinema-50">Enter Cinema Ticket</h2>
              <p className="text-xs text-cinema-400">
                Provide your ticket number to verify screening admission and companion rights.
              </p>
            </div>

            <form onSubmit={handleVerifyTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cinema-300 mb-1.5">
                  Ticket Reference Code
                </label>
                <div className="relative">
                  <Ticket className="w-5 h-5 text-cinema-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="e.g. CC-MLM-7821-A12"
                    className="w-full bg-cinema-900 border border-cinema-700 rounded-xl py-3 pl-11 pr-4 text-cinema-100 placeholder-cinema-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-sm uppercase tracking-wider"
                    required
                  />
                </div>
              </div>

              {/* Demo Quick Select Pill List */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-medium text-cinema-400 uppercase tracking-wider">
                  Preset Demonstration Tickets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketNumber("CC-MLM-7821-A12")}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cinema-850 hover:bg-cinema-800 text-gold-300 border border-cinema-700"
                  >
                    Seat A12 (Valid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketNumber("CC-MLM-7822-B04")}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cinema-850 hover:bg-cinema-800 text-cinema-300 border border-cinema-700"
                  >
                    Seat B04 (Valid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketNumber("CC-MLM-7823-C08")}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cinema-850 hover:bg-cinema-800 text-rose-300 border border-cinema-700"
                  >
                    Seat C08 (Already Activated)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketNumber("CC-MLM-7824-D15")}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cinema-850 hover:bg-cinema-800 text-rose-300 border border-cinema-700"
                  >
                    Seat D15 (Cancelled)
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("WELCOME")}
                  className="w-1/3 py-3 rounded-xl font-medium text-cinema-300 bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl font-semibold text-cinema-950 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify Ticket</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* State 3: Phone Verification */}
        {step === "PHONE_INPUT" && verifiedTicket && (
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-cinema-50">Phone Number</h2>
              <p className="text-xs text-cinema-400">
                Ticket verified for Seat {verifiedTicket.seatNumber}. An SMS verification code will be dispatched to your phone.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cinema-900 border border-cinema-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-cinema-400">Cinema:</span>
                <span className="text-cinema-200 font-medium">{verifiedTicket.cinemaName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinema-400">Screening:</span>
                <span className="text-cinema-200 font-medium">{verifiedTicket.screeningTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cinema-400">Assigned Seat:</span>
                <span className="text-gold-400 font-bold">{verifiedTicket.seatNumber}</span>
              </div>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cinema-300 mb-1.5">
                  Mobile Number (Tanzanian / International)
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-cinema-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+255712345678"
                    className="w-full bg-cinema-900 border border-cinema-700 rounded-xl py-3 pl-11 pr-4 text-cinema-100 placeholder-cinema-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-sm tracking-wide font-mono"
                    required
                  />
                </div>
                <span className="text-[11px] text-cinema-500 mt-1 block">
                  e.g. 0712345678 or +255712345678
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("TICKET_INPUT")}
                  className="w-1/3 py-3 rounded-xl font-medium text-cinema-300 bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl font-semibold text-cinema-950 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send SMS Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* State 4: OTP Verification */}
        {step === "OTP_VERIFY" && (
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-cinema-50">Enter 6-Digit Code</h2>
              <p className="text-xs text-cinema-400">
                Verification code dispatched via SMS to <span className="text-cinema-200 font-mono">{phoneNumber}</span>.
              </p>
            </div>

            {/* Development SMS Simulator Helper Badge */}
            {isSimulatorMode && simulatedOtp && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-gold-400">
                  <Info className="w-4 h-4" />
                  <span>Development SMS Simulator Active</span>
                </div>
                <p className="text-[11px] text-cinema-300">
                  Simulated Africa&apos;s Talking OTP: <strong className="font-mono text-white text-sm tracking-widest">{simulatedOtp}</strong>
                </p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cinema-300 mb-1.5">
                  6-Digit SMS Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-cinema-900 border border-cinema-700 rounded-xl py-3 px-4 text-center text-cinema-100 placeholder-cinema-600 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-2xl tracking-[0.4em] font-mono"
                  required
                />
              </div>

              {otpError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  className="w-1/3 py-3 rounded-xl font-medium text-cinema-300 bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 text-xs"
                >
                  Resend SMS
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-2/3 py-3 rounded-xl font-semibold text-cinema-950 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* State 5: Break Confirmation */}
        {step === "CONFIRMATION" && verifiedTicket && (
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-cinema-50">Break Activation Ready</h2>
              <p className="text-xs text-cinema-400">
                You are about to start your 15-minute companion stream.
              </p>
            </div>

            <div className="bg-cinema-900 border border-cinema-800 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-cinema-800 pb-2">
                <span className="text-cinema-400">Cinema & Screen:</span>
                <span className="text-cinema-100 font-medium">
                  {verifiedTicket.cinemaName} • {verifiedTicket.screenName}
                </span>
              </div>
              <div className="flex justify-between border-b border-cinema-800 pb-2">
                <span className="text-cinema-400">Movie Title:</span>
                <span className="text-cinema-100 font-medium">{verifiedTicket.screeningTitle}</span>
              </div>
              <div className="flex justify-between border-b border-cinema-800 pb-2">
                <span className="text-cinema-400">Your Reserved Seat:</span>
                <span className="text-gold-400 font-bold">{verifiedTicket.seatNumber}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-cinema-400">Maximum Duration:</span>
                <span className="text-emerald-400 font-bold">15 Minutes (900s limit)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cinema-850 border border-cinema-700/80 text-[11px] text-cinema-300 leading-relaxed">
              Companion viewing is authorized exclusively for ongoing screening breaks. When the timer reaches zero, access ceases automatically and you should return to your cinema auditorium.
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleActivateSession}
              className="w-full py-3.5 rounded-xl font-semibold text-cinema-950 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 transition-all text-sm flex items-center justify-center space-x-2 shadow-lg shadow-gold-500/20 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Start Companion Stream</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* State 6: Active Synchronized Playback */}
        {step === "ACTIVE_STREAM" && playbackState && (
          <div className="space-y-4 py-2">
            {/* Top Bar with Prominent Authoritative Countdown */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cinema-900 border border-cinema-800 shadow-md">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    remainingSeconds < 120
                      ? "bg-rose-950/70 border border-rose-800 text-rose-400"
                      : "bg-cinema-800 text-gold-400 border border-cinema-700"
                  }`}
                >
                  <Clock className="w-5 h-5 flex-shrink-0" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-cinema-400 font-semibold">
                    Break Time Remaining
                  </div>
                  <div
                    className={`text-xl font-bold font-mono tracking-tight tabular-nums ${
                      remainingSeconds < 120 ? "text-rose-400 animate-pulse" : "text-cinema-50"
                    }`}
                  >
                    {formatCountdown(remainingSeconds)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-cinema-400 block font-semibold">
                  Auditorium
                </span>
                <span className="text-xs font-bold text-gold-400">
                  {playbackState.screenName} • Seat {playbackState.seatNumber}
                </span>
              </div>
            </div>

            {/* Warning when less than 2 minutes remain */}
            {remainingSeconds < 120 && remainingSeconds > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2 animate-bounce">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>Under 2 minutes remaining. Please begin heading back to your seat!</span>
              </div>
            )}

            {/* Canvas Video Player */}
            <CinemaCanvasPlayer
              positionSeconds={playbackState.positionSeconds}
              durationSeconds={playbackState.durationSeconds}
              isPaused={playbackState.isPaused}
              title={playbackState.title}
              cinemaName={playbackState.cinemaName}
              seatNumber={playbackState.seatNumber}
            />

            {/* Controls & Auditorium Return */}
            <div className="pt-2 flex flex-col space-y-2">
              <div className="flex justify-between items-center text-xs text-cinema-400 px-1">
                <span>Synchronized with Auditorium Projector</span>
                <span className="text-emerald-400 font-medium">Authoritative Clock Active</span>
              </div>

              <button
                type="button"
                onClick={handleEndSessionEarly}
                className="w-full py-3 px-4 rounded-xl font-medium text-cinema-300 bg-cinema-900 hover:bg-cinema-850 border border-cinema-800 hover:border-cinema-700 text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Return to Cinema Auditorium</span>
              </button>
            </div>
          </div>
        )}

        {/* State 7: Session Expired */}
        {step === "SESSION_EXPIRED" && (
          <div className="space-y-6 py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-cinema-50">Break Session Ended</h2>
              <p className="text-sm text-cinema-300 max-w-sm leading-relaxed">
                Your 15-minute companion viewing limit has been reached. Please return to your seat to continue enjoying the screening on the big screen!
              </p>
            </div>

            <div className="w-full p-4 rounded-xl bg-cinema-900 border border-cinema-800 text-xs text-cinema-300 text-left space-y-1">
              <span className="text-gold-400 font-semibold block">Auditorium Reminder</span>
              <p>Please enter quietly through the back doors and take your seat.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("pottyplay_customer_token");
                setSessionToken(null);
                setStep("WELCOME");
              }}
              className="w-full py-3 rounded-xl font-medium text-cinema-100 bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 text-sm"
            >
              Finish and Return
            </button>
          </div>
        )}

        {/* State 8: Verification or Connectivity Failure */}
        {step === "ERROR" && (
          <div className="space-y-6 py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-cinema-50">Verification Notice</h2>
              <p className="text-xs text-cinema-300 max-w-sm leading-relaxed">
                {errorMessage || "Unable to proceed with companion viewing."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setStep("WELCOME");
              }}
              className="w-full py-3 rounded-xl font-medium text-cinema-100 bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 text-sm"
            >
              Return to Start
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
