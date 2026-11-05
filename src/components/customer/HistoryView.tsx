"use client";

import React, { useState, useEffect } from "react";
import { History, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { Button as GlisseButton } from "@/components/glisse";
import { customerFetch } from "@/lib/customer-mobile-url";

interface HistoryItem {
  id: string;
  sessionToken: string;
  cinemaName: string;
  screeningTitle: string;
  screenName: string;
  ticketNumber: string;
  seatNumber: string;
  breakNumber: number;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  status: string;
  revokedReason?: string;
}

export function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHistory = async (cursor?: string) => {
    setErrorMessage(null);
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const path = cursor
        ? `/api/customer/history?cursor=${cursor}&limit=5`
        : `/api/customer/history?limit=5`;

      const res = await customerFetch(path);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load history.");
      }

      setErrorMessage(null);

      if (cursor) {
        setHistory((prev) => [...prev, ...(data.history || [])]);
      } else {
        setHistory(data.history || []);
      }
      setNextCursor(data.nextCursor || null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load viewing history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: "In progress",
      COMPLETED: "Completed",
      EXPIRED: "Expired",
      REVOKED: "Ended early",
    };
    return labels[status] || "Ended";
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
          Viewing History
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          Your recent cinema breaks.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage} Check your connection and try again.</p>
            {!loadingMore && <button type="button" onClick={() => void fetchHistory()} className="mt-2 font-bold underline">Retry loading history</button>}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-field border border-line animate-pulse space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-1/3" />
              <div className="h-3 bg-neutral-900 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Truthful Empty State */}
      {!loading && !errorMessage && history.length === 0 && (
        <GlassSurface variant="dock" className="p-10 border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-field-raised text-muted flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-ink">No breaks yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Breaks you complete will appear here.
          </p>
        </GlassSurface>
      )}

      {/* History List */}
      {!loading && history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <GlassSurface
              key={item.id}
              variant="panel"
              className="p-5 border border-line shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-ink">
                    {item.screeningTitle}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-field-raised text-muted border border-line">
                    Break {item.breakNumber}
                  </span>
                </div>

                <div className="text-xs text-muted flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                  <span>
                    {item.cinemaName} &bull; {item.screenName} &bull; Seat {item.seatNumber}
                  </span>
                </div>

                <div className="text-[11px] text-muted font-mono">
                  Ticket: {item.ticketNumber} &bull; {formatDate(item.startedAt)}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-line">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-ink">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatDuration(item.durationSeconds)}</span>
                </div>

                <span
                  className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    item.status === "COMPLETED" || item.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : item.status === "EXPIRED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </GlassSurface>
          ))}

          {/* Cursor pagination button */}
          {nextCursor && (
            <div className="text-center pt-2">
              <GlisseButton
                variant="glass"
                disabled={loadingMore}
                onClick={() => fetchHistory(nextCursor)}
                className="text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {loadingMore ? "Loading more sessions..." : "Load Older Sessions"}
              </GlisseButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
