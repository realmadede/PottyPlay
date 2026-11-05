"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";
import { GlassSurface } from "@/components/GlassSurface";
import { Button as GlisseButton, Input as GlisseInput } from "@/components/glisse";
import { ReportIssueModal } from "@/components/customer/ReportIssueModal";
import { NativeMobile } from "@/lib/native-mobile";
import { customerFetch } from "@/lib/customer-mobile-url";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
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
  Wifi,
  MessageSquare,
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
    primaryVideoUrl?: string;
    edgeVideoUrl?: string | null;
    venueWifiSsid?: string | null;
    preferredRoute?: "LAN_EDGE" | "WAN_CDN";
    isLanClient?: boolean;
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
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Manual ticket entry fallback if no ticket pre-linked
  const [manualTicket, setManualTicket] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const activeSessionRef = React.useRef(activeSession);
  activeSessionRef.current = activeSession;
  const remainingTimerRef = React.useRef(remainingTimer);
  remainingTimerRef.current = remainingTimer;
  const breakAlertsEnabledRef = React.useRef(true);

  const checkStatus = useCallback(async () => {
    setErrorMessage(null);
    try {
      setLoading(true);
      const res = await customerFetch("/api/customer/bathroom");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load bathroom status.");
      }

      setSyncError(null);
      if (data.hasActiveSession && data.session) {
        setActiveSession(data.session);
        setEligibleTicket(null);
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

  const syncActiveSession = useCallback(async (sessionToken: string) => {
    try {
      const res = await customerFetch("/api/sessions/sync", {
        headers: { "x-session-token": sessionToken },
      });
      const data = await res.json();
      if (res.ok && data.isValid) {
        setSyncError(null);
        setRemainingTimer(data.remainingSeconds);
        setActiveSession((prev) => prev ? {
          ...prev,
          remainingSeconds: data.remainingSeconds,
          screening: {
            ...prev.screening,
            playbackPositionSeconds: data.screening?.playbackPositionSeconds ?? prev.screening.playbackPositionSeconds,
            isPaused: data.screening?.isPaused ?? prev.screening.isPaused,
          },
        } : null);
        return;
      }

      if (res.status === 403 || (res.ok && !data.isValid)) {
        setSyncError(data.reason || "This session ended or was revoked. Refreshing ticket status.");
        NativeMobile.releaseWakeLock();
        NativeMobile.cancelBreakAlarms();
        setActiveSession(null);
        await checkStatus();
        return;
      }
      throw new Error(data.reason || "Session status could not be refreshed.");
    } catch (error: unknown) {
      setSyncError(error instanceof Error ? error.message : "Connection lost. Playback may be behind the cinema screen.");
    }
  }, [checkStatus]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    let active = true;
    void NativeMobile.getStorageItem("pp_pending_ticket").then((claim) => {
      if (active && claim) setManualTicket(claim);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleTicketClaim = (event: Event) => {
      const claim = (event as CustomEvent<string>).detail;
      if (claim) {
        setManualTicket(claim);
        setErrorMessage(null);
      }
    };
    window.addEventListener("pottyplay:ticket-claim", handleTicketClaim);
    return () => window.removeEventListener("pottyplay:ticket-claim", handleTicketClaim);
  }, []);

  // Keep the countdown interval stable for the lifetime of one active session.
  useEffect(() => {
    const sessionId = activeSession?.sessionId;
    if (!sessionId) return;

    let breakAlertsEnabled = true;
    NativeMobile.requestWakeLock();
    void NativeMobile.getStorageItem("pp_break_alerts_enabled").then((value) => {
      breakAlertsEnabled = value !== "false";
      breakAlertsEnabledRef.current = breakAlertsEnabled;
      const session = activeSessionRef.current;
      if (session?.sessionId === sessionId) {
        void NativeMobile.scheduleBreakAlarms(session.remainingSeconds, breakAlertsEnabled);
      }
    });

    const interval = setInterval(() => {
      setRemainingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          NativeMobile.releaseWakeLock();
          NativeMobile.cancelBreakAlarms();
          setActiveSession(null);
          checkStatus();
          return 0;
        }

        // 12-Minute Haptic Break Chime (180s left)
        if (breakAlertsEnabledRef.current && prev === 180) {
          NativeMobile.triggerHaptic("warning");
        }
        // 14-Minute Urgent Haptic Warning (60s left)
        if (breakAlertsEnabledRef.current && prev === 60) {
          NativeMobile.triggerHaptic("heavy");
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      NativeMobile.releaseWakeLock();
    };
  }, [activeSession?.sessionId, checkStatus]);

  useEffect(() => {
    if (!activeSession?.sessionId) return;
    const handleBreakAlertPreference = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled: boolean }>).detail?.enabled;
      breakAlertsEnabledRef.current = Boolean(enabled);
      if (enabled) {
        void NativeMobile.scheduleBreakAlarms(remainingTimerRef.current, true);
      } else {
        void NativeMobile.cancelBreakAlarms();
      }
    };
    window.addEventListener("pottyplay:break-alerts-changed", handleBreakAlertPreference);
    return () => window.removeEventListener("pottyplay:break-alerts-changed", handleBreakAlertPreference);
  }, [activeSession?.sessionId]);

  // Periodic authoritative synchronization with cinema timeline
  useEffect(() => {
    const sessionToken = activeSession?.sessionToken;
    if (!sessionToken) return;
    const syncInterval = setInterval(() => void syncActiveSession(sessionToken), 5000);

    return () => clearInterval(syncInterval);
  }, [activeSession?.sessionToken, syncActiveSession]);

  const handleEndBreak = async () => {
    if (!activeSession) return;
    NativeMobile.releaseWakeLock();
    NativeMobile.cancelBreakAlarms();
    try {
      const response = await customerFetch("/api/sessions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": activeSession.sessionToken,
        },
      });
      if (!response.ok) throw new Error("The break could not be ended. Retry when connected.");
      setActiveSession(null);
      await checkStatus();
    } catch {
      setErrorMessage("Could not confirm the end of this break. Keep this screen open and retry when connected.");
      return;
    }
  };

  // Activate session
  const handleActivate = async (ticketNumberToUse: string) => {
    try {
      setActivating(true);
      setErrorMessage(null);

      const res = await customerFetch("/api/customer/bathroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber: ticketNumberToUse }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to activate bathroom break.");
      }

      setErrorMessage(null);
      await NativeMobile.removeStorageItem("pp_pending_ticket");
      await checkStatus();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Activation failed.");
    } finally {
      setActivating(false);
    }
  };

  const handleScanTicket = async () => {
    setErrorMessage(null);
    setScanning(true);
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: "Scan the QR code on your cinema ticket or claim pass.",
        scanText: "Scan ticket QR",
        scanButton: true,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
        cancelButtonAccessibilityLabel: "Cancel ticket scan",
      });
      const scannedValue = result.ScanResult.trim();
      if (!scannedValue) return;

      let ticketCode = scannedValue;
      try {
        const scannedUrl = new URL(scannedValue);
        ticketCode = scannedUrl.searchParams.get("claim")
          || scannedUrl.searchParams.get("ticket")
          || (scannedUrl.pathname.startsWith("/claim/")
            ? decodeURIComponent(scannedUrl.pathname.slice("/claim/".length))
            : scannedValue);
      } catch {
        // The QR may contain a raw ticket number or claim token.
      }

      setManualTicket(ticketCode);
      await NativeMobile.setStorageItem("pp_pending_ticket", ticketCode);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error
        ? `Camera scan could not be completed. You can enter the ticket code manually. ${error.message}`
        : "Camera scan is unavailable. You can enter the ticket code manually.");
    } finally {
      setScanning(false);
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
          Cinema Break
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          Follow the active cinema screening during a break of up to 15 minutes.
        </p>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start justify-between gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          <span className="flex-1">{errorMessage}</span>
          {!activeSession && <button type="button" onClick={() => void checkStatus()} className="shrink-0 font-bold underline">Retry</button>}
        </div>
      )}

      {loading && (
        <div className="p-6 rounded-3xl bg-field border border-line space-y-4 animate-pulse" role="status" aria-label="Loading screening entitlement">
          <div className="h-4 w-44 rounded bg-neutral-800" />
          <div className="h-20 rounded-xl bg-neutral-900" />
          <div className="h-11 rounded-xl bg-neutral-800" />
        </div>
      )}

      {syncError && activeSession && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <span>{syncError} The local countdown continues; playback synchronization will resume when connected.</span>
          <button type="button" onClick={() => void syncActiveSession(activeSession.sessionToken)} className="shrink-0 font-bold underline">Resync</button>
        </div>
      )}

      {/* 1. Active Session State: Display Synchronized Canvas Player */}
      {!loading && activeSession && (
        <div className="space-y-4">
          <GlassSurface variant="dock" className="p-4 border border-white/10 text-ink flex items-center justify-between shadow-xl">
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
          </GlassSurface>

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
              videoUrl={activeSession.screening.videoUrl}
              edgeVideoUrl={activeSession.screening.edgeVideoUrl}
              venueWifiSsid={activeSession.screening.venueWifiSsid}
              preferredRoute={activeSession.screening.preferredRoute}
            />
          </div>

          {/* In-Auditorium Local Wi-Fi Guidance */}
          {activeSession.screening.venueWifiSsid && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center space-x-3">
              <Wifi className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                If your mobile signal is weak, connect to the cinema Wi-Fi: <strong>{activeSession.screening.venueWifiSsid}</strong>. Playback may still depend on connection quality.
              </span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Your break ends when the timer reaches 00:00.</span>
            </div>
            <GlisseButton
              variant="filled"
              onClick={handleEndBreak}
              className="text-[11px] font-bold"
            >
              Return to Auditorium
            </GlisseButton>
          </div>

          {/* Issue Reporting Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="text-xs text-muted hover:text-amber-400 transition-colors inline-flex items-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Report playback issue or buffering</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        screeningId={activeSession?.screening?.id || eligibleTicket?.screening?.id}
        screeningTitle={activeSession?.screening?.title || eligibleTicket?.screening?.title}
        ticketNumber={activeSession?.ticketNumber || eligibleTicket?.ticketNumber}
        cinemaId={activeSession?.screening?.id ? undefined : eligibleTicket?.screening?.id}
      />

      {/* 2. Inactive Session: Eligible Ticket Available */}
      {!loading && !errorMessage && !activeSession && eligibleTicket && (
        <GlassSurface variant="dock" className="p-6 sm:p-8 border border-line shadow-card space-y-6">
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
            <GlisseButton
              variant="filled"
              disabled={activating}
              onClick={() => handleActivate(eligibleTicket.ticketNumber)}
              className="w-full font-black text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Synchronized Stream...</span>
                </>
              ) : (
                <>
                  <span>Start Break (up to 15 minutes)</span>
                  <Play className="w-4 h-4" />
                </>
              )}
            </GlisseButton>
            <p className="mt-3 text-[11px] text-center text-muted">
              Your verified ticket is ready. Playback follows the active cinema screening.
            </p>
          </div>
        </GlassSurface>
      )}

      {/* 3. Inactive Session: No Pre-Linked Ticket -> Enter Barcode */}
      {!loading && !errorMessage && !activeSession && !eligibleTicket && (
        <GlassSurface variant="dock" className="p-6 sm:p-8 border border-line shadow-card space-y-5">
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
            {NativeMobile.isNative() && (
              <>
                <p className="text-[11px] text-muted text-center">
                  The camera is used only after you tap Scan to read a cinema ticket QR code. PottyPlay does not save the camera image.
                </p>
                <GlisseButton
                  variant="glass"
                  disabled={scanning || activating}
                  onClick={() => void handleScanTicket()}
                  className="w-full text-xs font-bold disabled:opacity-50"
                >
                  {scanning ? "Opening camera…" : "Scan ticket QR code"}
                </GlisseButton>
              </>
            )}
            <GlisseInput
              placeholder="e.g. TK-8821-4401"
              value={manualTicket}
              onValueChange={setManualTicket}
              className="w-full font-mono uppercase text-center font-bold"
            />

            <GlisseButton
              variant="filled"
              disabled={activating || !manualTicket.trim()}
              onClick={() => handleActivate(manualTicket)}
              className="w-full font-black text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {activating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Verify Ticket & Activate Break</span>
                  <Play className="w-4 h-4" />
                </>
              )}
            </GlisseButton>
          </div>

          <div className="p-3 rounded-xl bg-bg border border-line text-[11px] text-muted text-center">
            Ticket barcodes are located on your printed cinema ticket stub or mobile booking pass.
          </div>
        </GlassSurface>
      )}
    </div>
  );
}
