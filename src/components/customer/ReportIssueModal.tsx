"use client";

import React, { useState, useRef } from "react";
import { GlassSurface } from "@/components/GlassSurface";
import { NativeMobile } from "@/lib/native-mobile";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  HelpCircle,
} from "lucide-react";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  screeningId?: string | null;
  screeningTitle?: string | null;
  ticketNumber?: string | null;
  cinemaId?: string | null;
}

const CATEGORIES = [
  { value: "PLAYBACK_OUT_OF_SYNC", label: "Stream is out of sync with auditorium screen" },
  { value: "AUDIO_BUFFERING", label: "Audio buffering or distorted sound" },
  { value: "VIDEO_FROZEN", label: "Video playback is frozen or black screen" },
  { value: "TICKET_ISSUE", label: "Incorrect seat or ticket information" },
  { value: "CINEMA_FACILITY", label: "Restroom Wi-Fi or auditorium facility problem" },
  { value: "GENERAL_FEEDBACK", label: "General feedback or feature suggestion" },
];

export function ReportIssueModal({
  isOpen,
  onClose,
  screeningId,
  screeningTitle,
  ticketNumber,
  cinemaId,
}: ReportIssueModalProps) {
  const [category, setCategory] = useState("PLAYBACK_OUT_OF_SYNC");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please describe the issue or feedback.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/customer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          screeningId: screeningId || undefined,
          ticketNumber: ticketNumber || undefined,
          cinemaId: cinemaId || undefined,
          deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      setDragY(delta * 0.75);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 85) {
      NativeMobile.triggerHaptic("light");
      handleReset();
    }
    setDragY(0);
    touchStartY.current = null;
  };

  const handleReset = () => {
    setMessage("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <GlassSurface
        variant="dock"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full max-w-lg my-8 border border-white/20 shadow-elevated p-6 sm:p-8 text-left text-ink transition-transform duration-100 ease-out"
        style={{
          transform: `translateY(${dragY}px)`,
        }}
      >
        {/* Native Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto -mt-2 mb-4 cursor-grab active:cursor-grabbing" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-ink">
                Report Issue or Feedback
              </h3>
              <p className="text-[11px] text-muted">
                Direct telemetry dispatched to cinema floor operations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl text-muted hover:text-ink hover:bg-field transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-ink">
                Report Submitted Successfully
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1 leading-relaxed">
                Thank you for notifying cinema staff. Your telemetry has been recorded in the operator console.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-6 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Context Notice */}
            {(screeningTitle || ticketNumber) && (
              <div className="p-3 rounded-xl bg-bg border border-line text-xs flex items-center justify-between">
                <span className="text-muted truncate max-w-[240px]">
                  {screeningTitle || "Active Screening"}
                </span>
                {ticketNumber && (
                  <span className="font-mono text-amber-400 font-bold text-[11px]">
                    Ticket {ticketNumber}
                  </span>
                )}
              </div>
            )}

            {/* Category Select */}
            <div className="space-y-1.5">
              <label htmlFor="issueCategory" className="block text-xs font-bold text-muted uppercase tracking-wider">
                Category
              </label>
              <select
                id="issueCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Input */}
            <div className="space-y-1.5">
              <label htmlFor="issueMessage" className="block text-xs font-bold text-muted uppercase tracking-wider">
                Description
              </label>
              <textarea
                id="issueMessage"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what happened (e.g., sound cuts out every 10 seconds, video timeline stopped updating)..."
                className="w-full p-3 rounded-xl border border-line bg-bg text-ink text-xs placeholder-muted focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 rounded-xl border border-line text-xs font-semibold text-muted hover:text-ink hover:bg-field transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="py-2.5 px-5 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center space-x-1.5 disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </GlassSurface>
    </div>
  );
}
