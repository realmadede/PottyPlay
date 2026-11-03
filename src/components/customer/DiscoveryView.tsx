"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Film, Search, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { customerFetch } from "@/lib/customer-mobile-url";
import { NativeMobile } from "@/lib/native-mobile";

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
  const [cinemaList, setCinemaList] = useState<CinemaDiscoveryRecord[]>([]);
  const [usingCachedData, setUsingCachedData] = useState(false);

  const loadCinemas = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await customerFetch("/api/cinemas/discovery");
      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.cinemas)) {
        throw new Error(data.error || "Cinema listings could not be loaded.");
      }
      setErrorMessage(null);
      setCinemas(data.cinemas);
      setCinemaList(data.cinemas);
      setUsingCachedData(false);
      await NativeMobile.setStorageItem("pp_cinema_discovery_cache", JSON.stringify(data.cinemas));
    } catch (err) {
      const cached = await NativeMobile.getStorageItem("pp_cinema_discovery_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setCinemas(parsed);
            setCinemaList(parsed);
            setUsingCachedData(true);
          }
        } catch {
          // Ignore invalid cached public discovery data.
        }
      }
      setErrorMessage(err instanceof Error ? err.message : "Unable to load partner cinemas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = typeof window !== "undefined"
      ? window.localStorage.getItem("pp_cinema_discovery_cache")
      : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCinemas(parsed);
          setCinemaList(parsed);
          setUsingCachedData(true);
          setLoading(false);
        }
      } catch {
        window.localStorage.removeItem("pp_cinema_discovery_cache");
      }
    }
    void loadCinemas();
  }, []);

  const filtered = cinemas.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const searchSuggestion = searchQuery.trim()
    ? findClosestCinemaTerm(searchQuery, cinemaList)
    : null;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
          Participating Cinema Theaters
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          Find participating cinemas and check their upcoming screenings.
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

      {usingCachedData && (
        <p role="status" className="text-[11px] text-amber-300">Showing saved cinema listings. Screening and ticket status requires a connection.</p>
      )}

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
        <div role="alert" className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-3">
          <span>{errorMessage} Check your connection and try again.</span>
          <button type="button" onClick={() => void loadCinemas()} className="shrink-0 rounded-lg border border-red-400/30 px-3 py-2 font-bold text-red-200">Retry</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMessage && filtered.length === 0 && (
        <GlassSurface variant="dock" className="p-10 border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-field-raised text-muted flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-ink">{searchQuery ? "No Search Results" : "No Participating Cinemas Yet"}</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery
              ? "No participating cinemas match that spelling or location. Try a nearby city or choose the suggested correction below."
              : "No cinema partners are currently approved in your territory. New theater partnerships will appear once verified."}
          </p>
          {searchQuery && searchSuggestion && (
            <button type="button" onClick={() => setSearchQuery(searchSuggestion)} className="mx-auto text-xs font-bold text-amber-400 underline underline-offset-2">Did you mean “{searchSuggestion}”?</button>
          )}
        </GlassSurface>
      )}

      {/* Cinemas List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((cinema) => (
            <GlassSurface
              key={cinema.id}
              variant="panel"
              className="p-5 sm:p-6 border border-line shadow-card hover:border-amber-500/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-ink">
                      {cinema.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Participating Cinema
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
                          {screening.status === "PLAYING" ? "Playing now" : "Scheduled"}
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
            </GlassSurface>
          ))}
        </div>
      )}
    </div>
  );
}

function findClosestCinemaTerm(query: string, cinemas: CinemaDiscoveryRecord[]): string | null {
  const candidates = [...new Set(cinemas.flatMap((cinema) => [cinema.name, cinema.location]))];
  const normalizedQuery = query.trim().toLowerCase();
  let closest: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase();
    const distance = editDistance(normalizedQuery, normalizedCandidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = candidate;
    }
  }

  return closest && bestDistance <= Math.max(2, Math.floor(normalizedQuery.length * 0.3))
    ? closest
    : null;
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}
