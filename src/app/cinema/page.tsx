"use client";

import React, { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";
import {
  Tv,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Users,
  RefreshCw,
  FastForward,
  Rewind,
  Sliders,
  CheckCircle,
  Radio,
} from "lucide-react";

interface PlaybackState {
  screeningId: string;
  screeningTitle: string;
  cinemaName: string;
  screenName: string;
  status: string;
  currentPositionSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  canFollow: boolean;
  unreliableSync: boolean;
  assetTitle: string;
  serverTimestamp: number;
  statusMessage?: string;
}

interface ActiveViewer {
  id: string;
  seatNumber: string;
  customerName: string;
  phoneNumber: string;
  startedAt: string;
  expiresAt: string;
  status: string;
}

export default function CinemaControlPage() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/simulator/playback");
      if (res.ok) {
        const data = await res.json();
        setPlayback(data.playback);
        setActiveViewers(data.activeViewers || []);
      }
    } catch {
      // silent background poll
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setLoading(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/simulator/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screeningId: playback?.screeningId,
          action,
          ...payload,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlayback(data.playback || data);
        if (data.statusMessage) {
          setStatusNotice(data.statusMessage);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setStatusNotice(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg text-ink overflow-x-clip selection:bg-amber-500 selection:text-neutral-950">
      <NavigationHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        {/* Header & Auditorium Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                  Theater Projection Console
                </h1>
                <p className="text-xs text-muted">
                  Authoritative master timeline and synchronization engine for auditorium screenings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-field border border-line px-3.5 py-2 rounded-xl shadow-card">
            <span className="text-muted">Auditorium:</span>
            <span className="font-bold text-ink">
              {playback?.screenName || "Screen 1"}
            </span>
            <span className="text-muted/40">|</span>
            <span className="text-muted">Venue:</span>
            <span className="font-semibold text-ink">
              {playback?.cinemaName || "Auditorium Hall"}
            </span>
          </div>
        </div>

        {statusNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between shadow-card">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-amber-400 hover:underline text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Master Playback Screen & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Projection Visualizer */}
          <div className="lg:col-span-2 space-y-3">
            {playback ? (
              <CinemaCanvasPlayer
                positionSeconds={playback.currentPositionSeconds}
                durationSeconds={playback.durationSeconds}
                isPaused={playback.isPaused}
                title={playback.screeningTitle}
                cinemaName={playback.cinemaName}
              />
            ) : (
              <div className="h-64 rounded-2xl bg-field border border-line flex items-center justify-center text-xs text-muted">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
                Connecting to Master Projection Clock...
              </div>
            )}

            {/* Authoritative Timeline Scrubber */}
            {playback && (
              <div className="p-4 rounded-2xl bg-field border border-line shadow-card space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-ink">
                      Authoritative Projection Clock
                    </span>
                    <span className="px-2 py-0.5 rounded bg-bg border border-line font-mono font-bold text-amber-400 text-[11px]">
                      {formatTime(playback.currentPositionSeconds)} / {formatTime(playback.durationSeconds)}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      playback.isPaused
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {playback.isPaused ? "Paused" : "Playing"}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={playback.durationSeconds}
                  value={playback.currentPositionSeconds}
                  onChange={(e) =>
                    handleAction("seek", { positionSeconds: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-muted font-mono">
                  <span>00:00 (Start)</span>
                  <span>15:00</span>
                  <span>{formatTime(playback.durationSeconds)} (End)</span>
                </div>
              </div>
            )}
          </div>

          {/* Projection Controls Column */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-field border border-line shadow-card space-y-3">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Auditorium Projection Controls</span>
              </h3>

              {playback && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleAction(playback.isPaused ? "resume" : "pause")
                    }
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                      playback.isPaused
                        ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black shadow-sm"
                        : "bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black shadow-sm"
                    }`}
                  >
                    {playback.isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleAction("seek", {
                        positionSeconds: Math.max(0, playback.currentPositionSeconds - 30),
                      })
                    }
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-bg hover:bg-field-raised text-ink border border-line flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                    <span>-30s</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleAction("seek", {
                        positionSeconds: Math.min(
                          playback.durationSeconds,
                          playback.currentPositionSeconds + 30
                        ),
                      })
                    }
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-bg hover:bg-field-raised text-ink border border-line flex items-center justify-center space-x-1 transition-colors"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>+30s</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("seek", { positionSeconds: 720.0 })}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-bg hover:bg-field-raised text-ink border border-line flex items-center justify-center space-x-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset 12m</span>
                  </button>
                </div>
              )}
            </div>

            {/* Projection Drift & Sync Telemetry */}
            <div className="p-4 rounded-2xl bg-field border border-line shadow-card space-y-3">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Synchronization Telemetry</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-bg border border-line flex justify-between items-center">
                  <span className="text-muted">Clock Authority:</span>
                  <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Server Authoritative</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-bg border border-line flex justify-between items-center">
                  <span className="text-muted">Sync Tolerance:</span>
                  <span className="font-mono font-semibold text-ink">&lt; 250ms</span>
                </div>

                <div className="p-2.5 rounded-xl bg-bg border border-line flex justify-between items-center">
                  <span className="text-muted">Companion Limit:</span>
                  <span className="font-bold text-ink">15 Minutes Hard Stop</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Break Viewers in Auditorium */}
        <div className="p-5 rounded-2xl bg-field border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Users className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-ink">
                  Active Companion Viewers in Auditorium
                </h2>
                <p className="text-xs text-muted">
                  Patrons currently on authorized viewing breaks synchronized with this screening.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {activeViewers.length} Active Stream(s)
            </span>
          </div>

          {activeViewers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted rounded-xl bg-bg border border-line">
              No patrons are currently on companion viewing breaks for this screening.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Seat</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone / SMS</th>
                    <th className="p-3">Started At</th>
                    <th className="p-3">Expires At</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {activeViewers.map((v) => (
                    <tr key={v.id} className="hover:bg-field-raised/50 transition-colors">
                      <td className="p-3 font-bold text-ink">{v.seatNumber}</td>
                      <td className="p-3 font-medium">{v.customerName || "Patron"}</td>
                      <td className="p-3 font-mono text-muted">
                        {v.phoneNumber || "Direct Entitlement"}
                      </td>
                      <td className="p-3 text-muted font-mono">
                        {new Date(v.startedAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-mono font-semibold text-emerald-400">
                        {new Date(v.expiresAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}