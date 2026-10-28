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
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlayback(data);
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
    <div className="flex-1 flex flex-col min-h-screen bg-brand-bg text-brand-text-primary overflow-x-clip">
      <NavigationHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        {/* Header & Auditorium Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-brand-primary/20 border border-brand-primary/40 text-brand-primary">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">
                  Theater Projection Console
                </h1>
                <p className="text-xs text-brand-text-secondary">
                  Authoritative master timeline and synchronization engine for auditorium screenings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-brand-surface border border-brand-border px-3.5 py-2 rounded-xl shadow-sm">
            <span className="text-brand-text-secondary">Auditorium:</span>
            <span className="font-bold text-brand-text-primary">
              {playback?.screenName || "Screen 1"}
            </span>
            <span className="text-brand-border">|</span>
            <span className="text-brand-text-secondary">Venue:</span>
            <span className="font-semibold text-brand-text-primary">
              {playback?.cinemaName || "Auditorium Hall"}
            </span>
          </div>
        </div>

        {statusNotice && (
          <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-brand-text-primary text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-brand-secondary flex-shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-brand-secondary hover:underline text-xs font-semibold"
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
              <div className="h-64 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-xs text-brand-text-secondary">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Connecting to Master Projection Clock...
              </div>
            )}

            {/* Authoritative Timeline Scrubber */}
            {playback && (
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-brand-text-primary">
                      Authoritative Projection Clock
                    </span>
                    <span className="px-2 py-0.5 rounded bg-brand-bg border border-brand-border font-mono font-bold text-brand-text-primary text-[11px]">
                      {formatTime(playback.currentPositionSeconds)} / {formatTime(playback.durationSeconds)}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      playback.isPaused
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
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
                  className="w-full accent-heather cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-brand-text-secondary font-mono">
                  <span>00:00 (Start)</span>
                  <span>15:00</span>
                  <span>{formatTime(playback.durationSeconds)} (End)</span>
                </div>
              </div>
            )}
          </div>

          {/* Projection Controls Column */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-brand-secondary" />
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
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-brand-accent hover:bg-black text-brand-bg"
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
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-brand-bg hover:bg-brand-surface text-brand-text-primary border border-brand-border flex items-center justify-center space-x-1 transition-colors"
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
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-brand-bg hover:bg-brand-surface text-brand-text-primary border border-brand-border flex items-center justify-center space-x-1 transition-colors"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>+30s</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("seek", { positionSeconds: 720.0 })}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-brand-bg hover:bg-brand-surface text-brand-text-primary border border-brand-border flex items-center justify-center space-x-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset 12m</span>
                  </button>
                </div>
              )}
            </div>

            {/* Projection Drift & Sync Telemetry */}
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <span>Synchronization Telemetry</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border flex justify-between items-center">
                  <span className="text-brand-text-secondary">Clock Authority:</span>
                  <span className="font-semibold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Server Authoritative</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border flex justify-between items-center">
                  <span className="text-brand-text-secondary">Sync Tolerance:</span>
                  <span className="font-mono font-semibold text-brand-text-primary">&lt; 250ms</span>
                </div>

                <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border flex justify-between items-center">
                  <span className="text-brand-text-secondary">Companion Limit:</span>
                  <span className="font-bold text-brand-text-primary">15 Minutes Hard Stop</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Break Viewers in Auditorium */}
        <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Users className="w-5 h-5 text-brand-secondary" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-brand-text-primary">
                  Active Companion Viewers in Auditorium
                </h2>
                <p className="text-xs text-brand-text-secondary">
                  Patrons currently on authorized viewing breaks synchronized with this screening.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/20 text-brand-text-primary border border-brand-primary/40">
              {activeViewers.length} Active Stream(s)
            </span>
          </div>

          {activeViewers.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-text-secondary rounded-xl bg-brand-bg border border-brand-border">
              No patrons are currently on companion viewing breaks for this screening.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-text-secondary">
                    <th className="pb-2.5 font-semibold">Seat</th>
                    <th className="pb-2.5 font-semibold">Customer</th>
                    <th className="pb-2.5 font-semibold">Phone / SMS</th>
                    <th className="pb-2.5 font-semibold">Started At</th>
                    <th className="pb-2.5 font-semibold">Expires At</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-brand-text-primary">
                  {activeViewers.map((v) => (
                    <tr key={v.id} className="hover:bg-brand-bg">
                      <td className="py-2.5 font-bold text-brand-text-primary">{v.seatNumber}</td>
                      <td className="py-2.5">{v.customerName || "Patron"}</td>
                      <td className="py-2.5 font-mono text-brand-text-secondary">
                        {v.phoneNumber || "Direct Entitlement"}
                      </td>
                      <td className="py-2.5 text-brand-text-secondary">
                        {new Date(v.startedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 font-mono font-semibold text-emerald-600">
                        {new Date(v.expiresAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
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
