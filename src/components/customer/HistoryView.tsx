"use client";

import React, { useState, useEffect } from "react";
import { History, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

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
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const url = cursor
        ? `/api/customer/history?cursor=${cursor}&limit=5`
        : `/api/customer/history?limit=5`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load history.");
      }

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
    fetchHistory();
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

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text-primary tracking-tight">
          Viewing History
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-brand-text-secondary">
          Audit of completed and expired theatrical companion viewing breaks.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-brand-border animate-pulse space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-1/3" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Truthful Empty State */}
      {!loading && history.length === 0 && (
        <div className="p-10 rounded-3xl bg-white border border-brand-border text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-brand-text-primary">No History Records</h3>
          <p className="text-xs text-brand-text-secondary max-w-sm mx-auto">
            You have not activated any companion viewing sessions yet. Completed bathroom breaks will be recorded here.
          </p>
        </div>
      )}

      {/* History List */}
      {!loading && history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-brand-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-brand-text-primary">
                    {item.screeningTitle}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700">
                    Break {item.breakNumber}
                  </span>
                </div>

                <div className="text-xs text-brand-text-secondary flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {item.cinemaName} &bull; {item.screenName} &bull; Seat {item.seatNumber}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-400 font-mono">
                  Ticket: {item.ticketNumber} &bull; {formatDate(item.startedAt)}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-brand-border">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-brand-text-primary">
                  <Clock className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{formatDuration(item.durationSeconds)}</span>
                </div>

                <span
                  className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === "COMPLETED" || item.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : item.status === "EXPIRED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}

          {/* Cursor pagination button */}
          {nextCursor && (
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => fetchHistory(nextCursor)}
                className="py-2.5 px-5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text-primary hover:bg-neutral-50 transition-colors shadow-subtle disabled:opacity-50"
              >
                {loadingMore ? "Loading more sessions..." : "Load Older Sessions"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
