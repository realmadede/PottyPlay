"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Tv, CheckCircle2, Film, Clock, Search, Loader2 } from "lucide-react";

interface CinemaItem {
  id: string;
  name: string;
  location: string;
  timezone: string;
  status: string;
  screensCount: number;
  screens: { id: string; name: string; totalSeats: number }[];
  activeScreenings: {
    id: string;
    title: string;
    status: string;
    scheduledStart: string;
    durationMinutes: number;
  }[];
  supportedFeatures: string[];
}

export function DiscoveryView() {
  const [cinemas, setCinemas] = useState<CinemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCinemas() {
      try {
        setLoading(true);
        const res = await fetch("/api/cinemas/discovery");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load cinemas.");
        }
        setCinemas(data.cinemas || []);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load cinemas.");
      } finally {
        setLoading(false);
      }
    }
    loadCinemas();
  }, []);

  const filtered = cinemas.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header and Search */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text-primary tracking-tight">
          Participating Cinema Theaters
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-brand-text-secondary">
          Certified venues with authoritative projection synchronization and studio rights agreements.
        </p>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-brand-text-secondary absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search cinemas by city or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-brand-border animate-pulse space-y-3"
            >
              <div className="h-5 bg-neutral-200 rounded w-1/3" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
              <div className="h-16 bg-neutral-100 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="p-10 rounded-3xl bg-white border border-brand-border text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-brand-text-primary">No Cinemas Found</h3>
          <p className="text-xs text-brand-text-secondary max-w-sm mx-auto">
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
              className="p-5 sm:p-6 rounded-2xl bg-white border border-brand-border shadow-subtle hover:border-brand-primary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-brand-text-primary">
                      {cinema.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      CERTIFIED PARTNER
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-brand-text-secondary mt-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{cinema.location}</span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-brand-text-secondary">
                  {cinema.screensCount} {cinema.screensCount === 1 ? "Screen" : "Screens"} Enabled
                </div>
              </div>

              {/* Active screenings */}
              {cinema.activeScreenings.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-brand-text-secondary mb-2 flex items-center space-x-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>Live & Scheduled Screenings</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cinema.activeScreenings.map((screening) => (
                      <div
                        key={screening.id}
                        className="p-3 rounded-xl bg-brand-bg border border-brand-border text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-brand-text-primary">{screening.title}</div>
                          <div className="text-[11px] text-brand-text-secondary mt-0.5">
                            {screening.durationMinutes} min runtime
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            screening.status === "PLAYING"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-700"
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
              <div className="mt-4 pt-3 border-t border-brand-border/60 flex flex-wrap gap-1.5">
                {cinema.supportedFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-neutral-50 text-[10px] text-brand-text-secondary font-medium border border-neutral-200"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
