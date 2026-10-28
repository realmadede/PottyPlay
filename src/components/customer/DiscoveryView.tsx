"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Film, Search, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";

interface CinemaDiscoveryRecord {
  id: string;
  name: string;
  location: string;
  screensCount: number;
  activeScreenings: {
    id: string;
    title: string;
    durationMinutes: number;
    status: string;
  }[];
  supportedFeatures: string[];
}

export function DiscoveryView() {
  const [cinemas, setCinemas] = useState<CinemaDiscoveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCinemas() {
      try {
        const res = await fetch("/api/cinemas/discovery");
        const data = await res.json();
        if (data.success && Array.isArray(data.cinemas)) {
          setCinemas(data.cinemas);
        } else {
          setCinemas([]);
        }
      } catch (err) {
        setErrorMessage("Unable to load partner cinemas at this time.");
      } finally {
        setLoading(false);
      }
    }
    fetchCinemas();
  }, []);

  const filtered = cinemas.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
          Participating Cinema Theaters
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          Certified venues with authoritative projection synchronization and studio rights agreements.
        </p>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search cinemas by city or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-bg text-ink placeholder-muted text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-field border border-line animate-pulse space-y-3"
            >
              <div className="h-5 bg-neutral-800 rounded w-1/3" />
              <div className="h-4 bg-neutral-800 rounded w-1/2" />
              <div className="h-16 bg-bg rounded-xl mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="p-10 rounded-3xl bg-field border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-field-raised text-muted flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-ink">No Cinemas Found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery
              ? "No participating cinemas match your search query."
              : "No cinema partners are currently approved in your territory. New theater partnerships will appear once verified."}
          </p>
        </div>
      )}

      {/* Cinemas List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((cinema) => (
            <div
              key={cinema.id}
              className="p-5 sm:p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-ink">
                      {cinema.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      CERTIFIED PARTNER
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-muted mt-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{cinema.location}</span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-muted">
                  {cinema.screensCount} {cinema.screensCount === 1 ? "Screen" : "Screens"} Enabled
                </div>
              </div>

              {/* Active screenings */}
              {cinema.activeScreenings.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted mb-2 flex items-center space-x-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live & Scheduled Screenings</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cinema.activeScreenings.map((screening) => (
                      <div
                        key={screening.id}
                        className="p-3 rounded-xl bg-bg border border-line text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-ink">{screening.title}</div>
                          <div className="text-[11px] text-muted mt-0.5">
                            {screening.durationMinutes} min runtime
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            screening.status === "PLAYING"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-field-raised text-muted border border-line"
                          }`}
                        >
                          {screening.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supported Features Tags */}
              <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-1.5">
                {cinema.supportedFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-bg text-[10px] text-muted font-medium border border-line"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
