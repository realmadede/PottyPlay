"use client";

import React, { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { CinemaCanvasPlayer } from "@/components/CinemaCanvasPlayer";
import {
  Tv,
  Play,
  Pause,
  RotateCcw,
  Clock,
  AlertTriangle,
  Users,
  Film,
  RefreshCw,
  FastForward,
  Rewind,
  Sliders,
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

export default function CinemaSimulatorPage() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const [screeningRes, dashboardRes] = await Promise.all([
        fetch("/api/screenings/current?screeningId=screening_prime_01"),
        fetch("/api/operator/dashboard"),
      ]);

      if (screeningRes.ok) {
        const data = await screeningRes.json();
        setPlayback(data);
      }

      if (dashboardRes.ok) {
        const dData = await dashboardRes.json();
        const active = (dData.sessions || []).filter(
          (s: any) => s.status === "ACTIVE"
        );
        setActiveViewers(active);
      }
    } catch (err) {
      console.error("Simulator poll error:", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, extra: Record<string, any> = {}) => {
    setLoading(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/simulator/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screeningId: playback?.screeningId || "screening_prime_01",
          action,
          ...extra,
        }),
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
    <div className="flex-1 flex flex-col min-h-screen bg-cinema-950 text-cinema-100">
      <NavigationHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Simulator Title and Cinema Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cinema-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cinema-900 border border-cinema-750 text-gold-400">
                <Tv className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-cinema-50 tracking-tight">
                Authoritative Cinema Projection Simulator
              </h1>
            </div>
            <p className="text-xs text-cinema-400 mt-1">
              Controls the master projection clock that feeds companion break viewers.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-cinema-900 border border-cinema-800 px-3.5 py-2 rounded-xl">
            <span className="text-cinema-400">Cinema:</span>
            <span className="font-semibold text-cinema-200">
              {playback?.cinemaName || "Century Cinemax - Mlimani City"}
            </span>
            <span className="text-cinema-600">|</span>
            <span className="text-cinema-400">Hall:</span>
            <span className="font-semibold text-gold-400">
              {playback?.screenName || "Screen 1"}
            </span>
          </div>
        </div>

        {statusNotice && (
          <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-amber-400 hover:text-amber-200 text-xs underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Master Playback Screen & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Display */}
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
              <div className="h-64 rounded-2xl bg-cinema-900 border border-cinema-800 flex items-center justify-center text-xs text-cinema-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Connecting to Authoritative Projection Clock...
              </div>
            )}

            {/* Authoritative Timeline Scrubber */}
            {playback && (
              <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-cinema-200">
                      Authoritative Position
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cinema-800 font-mono text-gold-400 text-[11px]">
                      {formatTime(playback.currentPositionSeconds)} / {formatTime(playback.durationSeconds)}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      playback.isPaused
                        ? "bg-rose-950/60 text-rose-400 border border-rose-800"
                        : "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
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
                  className="w-full accent-gold-400 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-cinema-500 font-mono">
                  <span>00:00 (Film Start)</span>
                  <span>15:00</span>
                  <span>30:00 (Film End)</span>
                </div>
              </div>
            )}
          </div>

          {/* Presenter Controls Column */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 space-y-3">
              <h3 className="text-xs font-bold text-cinema-300 uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-gold-400" />
                <span>Projection Controls</span>
              </h3>

              {playback && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      handleAction(playback.isPaused ? "resume" : "pause")
                    }
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                      playback.isPaused
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-cinema-800 hover:bg-cinema-750 text-cinema-100 border border-cinema-700"
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
                    className="py-2.5 px-3 rounded-lg text-xs font-medium bg-cinema-850 hover:bg-cinema-800 text-cinema-200 border border-cinema-700 flex items-center justify-center space-x-1"
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
                    className="py-2.5 px-3 rounded-lg text-xs font-medium bg-cinema-850 hover:bg-cinema-800 text-cinema-200 border border-cinema-700 flex items-center justify-center space-x-1"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>+30s</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("seek", { positionSeconds: 720.0 })}
                    className="py-2.5 px-3 rounded-lg text-xs font-medium bg-cinema-850 hover:bg-cinema-800 text-gold-300 border border-cinema-700 flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset 12m</span>
                  </button>
                </div>
              )}
            </div>

            {/* Special Hackathon Scenarios */}
            <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 space-y-3">
              <h3 className="text-xs font-bold text-cinema-300 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Hackathon Demo Scenarios</span>
              </h3>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction("simulate_delay", { delayMinutes: 10 })}
                  className="w-full py-2.5 px-3 rounded-lg text-left bg-cinema-850 hover:bg-cinema-800 text-cinema-200 border border-cinema-700 flex flex-col space-y-0.5"
                >
                  <span className="font-semibold text-cinema-100">
                    Simulate Delayed Start (10m delay)
                  </span>
                  <span className="text-[11px] text-cinema-400">
                    Demonstrates late projection start without scheduled drift.
                  </span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction("simulate_sync_failure")}
                  className="w-full py-2.5 px-3 rounded-lg text-left bg-cinema-850 hover:bg-cinema-800 text-rose-300 border border-cinema-700 flex flex-col space-y-0.5"
                >
                  <span className="font-semibold text-rose-400">
                    Reproduce Synchronization Interruption
                  </span>
                  <span className="text-[11px] text-cinema-400">
                    Demonstrates fail-closed security when clock state is interrupted.
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Break Viewers */}
        <div className="p-5 rounded-2xl bg-cinema-900 border border-cinema-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Users className="w-5 h-5 text-gold-400" />
              <h2 className="text-sm sm:text-base font-bold text-cinema-100">
                Active Companion Viewers for This Screening
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cinema-800 text-gold-400 border border-cinema-700">
              {activeViewers.length} Active Stream(s)
            </span>
          </div>

          {activeViewers.length === 0 ? (
            <div className="p-8 text-center text-xs text-cinema-500 rounded-xl bg-cinema-950/50 border border-cinema-850">
              No cinema patrons currently on active companion breaks for this screening.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cinema-800 text-cinema-400">
                    <th className="pb-2.5 font-medium">Seat</th>
                    <th className="pb-2.5 font-medium">Customer</th>
                    <th className="pb-2.5 font-medium">Phone</th>
                    <th className="pb-2.5 font-medium">Started At</th>
                    <th className="pb-2.5 font-medium">Expires At</th>
                    <th className="pb-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-850 text-cinema-200">
                  {activeViewers.map((v) => (
                    <tr key={v.id} className="hover:bg-cinema-850/50">
                      <td className="py-2.5 font-bold text-gold-400">{v.seatNumber}</td>
                      <td className="py-2.5">{v.customerName}</td>
                      <td className="py-2.5 font-mono text-cinema-400">{v.phoneNumber}</td>
                      <td className="py-2.5 text-cinema-400">
                        {new Date(v.startedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 font-mono text-emerald-400">
                        {new Date(v.expiresAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
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
