"use client";

import React, { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import {
  Sliders,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  XCircle,
  FileText,
  MessageSquare,
  Ban,
  Film,
  Building2,
  Tag,
  DollarSign,
  Plus,
  Loader2,
} from "lucide-react";

interface OperatorData {
  timestamp: string;
  cinema: {
    id: string;
    name: string;
    location: string;
    timezone: string;
    ticketingSystem: string;
    screeningSystem: string;
    status: string;
    screens: Array<{ id: string; name: string; totalSeats: number }>;
  };
  pricing: {
    currentPrice: number;
    currency: string;
    status: string;
    configuredAt: string;
  };
  stats: {
    activeSessions: number;
    expiredSessions: number;
    revokedSessions: number;
    totalSessionsTracked: number;
    totalBillableActivations: number;
    totalRecordedAmount: number;
  };
  screenings: Array<{
    id: string;
    title: string;
    status: string;
    scheduledStart: string;
    actualStart: string | null;
    isPaused: boolean;
    currentPositionSeconds: number;
    screen: { name: string; totalSeats: number };
    contentAsset: { durationSeconds: number; title: string };
  }>;
  sessions: Array<{
    id: string;
    sessionTokenMasked: string;
    ticketNumber: string;
    seatNumber: string;
    customerName: string;
    phoneNumber: string | null;
    breakNumber: number;
    screeningTitle: string;
    cinemaName: string;
    screenName: string;
    startedAt: string;
    expiresAt: string;
    endedAt: string | null;
    status: string;
    revokedReason: string | null;
    billed: boolean;
  }>;
  billing: {
    totalBillableActivations: number;
    totalEstimatedRevenueTzs: number;
    currency: string;
    pricePerSessionTzs: number;
    disclaimer: string;
    recentBillingEvents: Array<{
      id: string;
      sessionId: string;
      ticketNumber: string;
      priceTzs: number;
      currency: string;
      createdAt: string;
    }>;
  };
  auditEvents: Array<{
    id: string;
    eventType: string;
    entityType: string;
    entityId: string | null;
    actor: string;
    details: string;
    createdAt: string;
  }>;
  smsAttempts: Array<{
    id: string;
    phoneNumber: string;
    messageType: string;
    provider: string;
    status: string;
    cost: string | null;
    errorDetails: string | null;
    createdAt: string;
  }>;
}

export default function OperatorPage() {
  const [cinemaId, setCinemaId] = useState("cinema_mlimani_01");
  const [data, setData] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "sessions" | "screenings" | "pricing" | "billing" | "sms" | "audit"
  >("sessions");

  // Revoke state
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState(
    "Auditorium re-entry confirmed by cinema usher."
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New pricing rule state
  const [newPrice, setNewPrice] = useState(500);
  const [newCurrency, setNewCurrency] = useState("TZS");
  const [newPricingStatus, setNewPricingStatus] = useState("ACTIVE");
  const [pricingNotes, setPricingNotes] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/operator/dashboard?cinemaId=${cinemaId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch operator dashboard:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [cinemaId]);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeSessionId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/operator/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: revokeSessionId,
          reason: revokeReason,
        }),
      });

      if (res.ok) {
        setActionNotice("Session revoked successfully. Companion stream disconnected.");
        setRevokeSessionId(null);
        await fetchData();
      } else {
        const errorJson = await res.json();
        setActionNotice(`Failed to revoke session: ${errorJson.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Revoke error";
      setActionNotice(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrice(true);
    try {
      const res = await fetch("/api/operator/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cinemaId,
          currency: newCurrency,
          pricePerSession: Number(newPrice),
          status: newPricingStatus,
          notes: pricingNotes,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionNotice("Commercial pricing rule updated successfully.");
        setPricingNotes("");
        await fetchData();
      } else {
        setActionNotice(`Failed to update pricing: ${json.error}`);
      }
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Pricing error");
    } finally {
      setSavingPrice(false);
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg text-ink overflow-x-clip">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 text-left">
        {/* Workspace Title & Venue Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-line">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                  Cinema Operator Workspace
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  TENANT ISOLATED
                </span>
              </div>
              <p className="text-xs text-muted">
                Auditorium screen synchronization, active bathroom breaks, and commercial pricing.
              </p>
            </div>
          </div>

          {/* Cinema Venue Switcher */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-muted uppercase">
              Venue:
            </label>
            <select
              value={cinemaId}
              onChange={(e) => setCinemaId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            >
              <option value="cinema_mlimani_01" className="bg-field text-ink">Century Cinemax - Mlimani City</option>
              <option value="cinema_oasis_02" className="bg-field text-ink">Oasis Cinema - Masaki</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-line bg-field hover:bg-field-raised text-muted hover:text-ink"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex justify-between items-center animate-fade-in">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="font-bold underline text-amber-400 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Operator Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-field p-4 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] font-semibold text-muted uppercase">
              Active Breaks
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {data?.stats.activeSessions ?? 0}
            </div>
            <span className="text-[10px] text-muted mt-1 block">
              15-minute cap active
            </span>
          </div>

          <div className="bg-field p-4 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] font-semibold text-muted uppercase">
              Screens Connected
            </span>
            <div className="text-2xl sm:text-3xl font-black text-ink mt-1">
              {data?.cinema.screens.length ?? 0}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
              {data?.cinema.screeningSystem}
            </span>
          </div>

          <div className="bg-field p-4 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] font-semibold text-muted uppercase">
              Agreed Pricing
            </span>
            <div className="text-xl sm:text-2xl font-black text-ink mt-1">
              {data?.pricing.currentPrice ?? 500}{" "}
              <span className="text-xs font-semibold text-muted">
                {data?.pricing.currency ?? "TZS"}
              </span>
            </div>
            <span className="text-[10px] text-muted mt-1 block">
              Status: {data?.pricing.status}
            </span>
          </div>

          <div className="bg-field p-4 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] font-semibold text-muted uppercase">
              Recorded Usage
            </span>
            <div className="text-xl sm:text-2xl font-black text-ink mt-1">
              {data?.stats.totalRecordedAmount.toLocaleString() ?? 0}{" "}
              <span className="text-xs font-semibold text-muted">
                {data?.pricing.currency ?? "TZS"}
              </span>
            </div>
            <span className="text-[10px] text-muted mt-1 block">
              {data?.stats.totalBillableActivations ?? 0} qualifying breaks
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-line pb-3">
          {[
            { id: "sessions", label: "Live Sessions", icon: Users },
            { id: "screenings", label: "Screens & Schedules", icon: Film },
            { id: "pricing", label: "Commercial Pricing", icon: DollarSign },
            { id: "billing", label: "Usage Ledger", icon: CreditCard },
            { id: "sms", label: "SMS Carrier Logs", icon: MessageSquare },
            { id: "audit", label: "Audit History", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                    : "bg-field text-muted border border-line hover:text-ink hover:bg-field-raised"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Live Sessions */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card min-w-0 w-full">
              <div className="p-4 border-b border-line flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-muted">
                  Auditorium Companion Sessions ({data?.sessions.length ?? 0})
                </span>
                <span className="text-[11px] text-muted">
                  Strict 900s server enforcement
                </span>
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Patron & Seat</th>
                      <th className="p-3">Screening</th>
                      <th className="p-3">Break</th>
                      <th className="p-3">Started</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data?.sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-field-raised/50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-ink">
                            {session.customerName || "Admitted Patron"}
                          </div>
                          <div className="text-[11px] text-muted font-mono">
                            Seat {session.seatNumber} &bull; {session.ticketNumber}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-ink">
                            {session.screeningTitle}
                          </div>
                          <div className="text-[11px] text-muted">
                            {session.screenName}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-bg text-ink font-bold text-[11px] border border-line">
                            Break {session.breakNumber} of 2
                          </span>
                        </td>
                        <td className="p-3 text-muted font-mono text-[11px]">
                          {new Date(session.startedAt).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              session.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse"
                                : session.status === "EXPIRED"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {session.status === "ACTIVE" && (
                            <button
                              onClick={() => setRevokeSessionId(session.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Revoke Dialog */}
            {revokeSessionId && (
              <form
                onSubmit={handleRevoke}
                className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3"
              >
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Manual Usher Revocation</span>
                </div>
                <p className="text-xs text-red-300">
                  Revoking this session will immediately disconnect patron companion playback and record an auditable event.
                </p>
                <input
                  type="text"
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-red-500/30 bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors"
                  >
                    Confirm Disconnection
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeSessionId(null)}
                    className="px-4 py-2 rounded-xl bg-field border border-line text-xs font-semibold text-ink hover:bg-field-raised transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Screenings & Screens */}
        {activeTab === "screenings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.screenings.map((sc) => (
                <div
                  key={sc.id}
                  className="p-5 rounded-2xl bg-field border border-line shadow-card space-y-3"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-line">
                    <div>
                      <h3 className="font-extrabold text-base text-ink">
                        {sc.title}
                      </h3>
                      <div className="text-xs text-muted mt-0.5">
                        {sc.screen.name} &bull; {sc.screen.totalSeats} Seats Capacity
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sc.status === "PLAYING"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-field-raised text-muted border border-line"
                      }`}
                    >
                      {sc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-bg border border-line">
                      <span className="text-[10px] text-muted uppercase">
                        Authoritative Timecode
                      </span>
                      <div className="font-mono font-bold text-base text-ink mt-0.5">
                        {formatSeconds(sc.currentPositionSeconds)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-bg border border-line">
                      <span className="text-[10px] text-muted uppercase">
                        Feature Runtime
                      </span>
                      <div className="font-mono font-bold text-base text-ink mt-0.5">
                        {formatSeconds(sc.contentAsset.durationSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted">Projection Pause State:</span>
                    <span className="font-bold text-ink">
                      {sc.isPaused ? "Paused (Companion Frozen)" : "Normal Projection"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Commercial Pricing */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-field border border-line shadow-card max-w-xl">
              <div className="flex items-center space-x-2 border-b border-line pb-4 mb-4">
                <Tag className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-ink">
                  Cinema Commercial Pricing Schedule
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-bg border border-line text-xs space-y-1 mb-5">
                <div>
                  <strong className="text-ink">Current Active Price:</strong>{" "}
                  {data?.pricing.currentPrice} {data?.pricing.currency} per qualifying break
                </div>
                <div>
                  <strong className="text-ink">Agreement Status:</strong>{" "}
                  <span className="text-emerald-400 font-bold">{data?.pricing.status}</span>
                </div>
                <p className="text-[11px] text-muted pt-1">
                  Historical transactions strictly preserve the terms applied when created. Past billing records are never mutated.
                </p>
              </div>

              <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Per-Session Rate
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Currency
                    </label>
                    <select
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="TZS">TZS (Tanzanian Shillings)</option>
                      <option value="KES">KES (Kenyan Shillings)</option>
                      <option value="USD">USD (US Dollars)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Pricing Status
                  </label>
                  <select
                    value={newPricingStatus}
                    onChange={(e) => setNewPricingStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="ACTIVE">ACTIVE (Agreed Commercial Terms)</option>
                    <option value="PENDING_AGREEMENT">PENDING_AGREEMENT (Under Review)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Schedule Notes / Contract Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exhibitor Agreement 2026 Q4 Schedule A"
                    value={pricingNotes}
                    onChange={(e) => setPricingNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPrice}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {savingPrice ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Update Commercial Terms</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: Usage Ledger */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
              <div className="p-4 border-b border-line flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-muted">
                    Audited Qualifying Events ({data?.billing.totalBillableActivations ?? 0})
                  </span>
                  <div className="text-[11px] text-muted mt-0.5">
                    {data?.billing.disclaimer}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Ticket</th>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Recorded Rate</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data?.billing.recentBillingEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-field-raised/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-ink">
                          {event.ticketNumber}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted">
                          {event.sessionId}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {event.priceTzs} {event.currency}
                        </td>
                        <td className="p-3 text-muted font-mono text-[11px]">
                          {new Date(event.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SMS Carrier Logs */}
        {activeTab === "sms" && (
          <div className="space-y-4">
            <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
              <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
                Africa&apos;s Talking Delivery Log ({data?.smsAttempts.length ?? 0})
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data?.smsAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-field-raised/50 transition-colors">
                        <td className="p-3 font-mono font-semibold text-ink">
                          {attempt.phoneNumber}
                        </td>
                        <td className="p-3 text-[11px] text-muted">
                          {attempt.provider}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              attempt.status === "SENT" || attempt.status === "DELIVERED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {attempt.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted font-mono text-[11px]">
                          {new Date(attempt.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Audit History */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
              <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
                Audited System Operations ({data?.auditEvents.length ?? 0})
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Details</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data?.auditEvents.map((a) => (
                      <tr key={a.id} className="hover:bg-field-raised/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {a.eventType}
                        </td>
                        <td className="p-3 font-semibold text-ink">
                          {a.actor}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted max-w-xs truncate">
                          {a.details}
                        </td>
                        <td className="p-3 text-muted font-mono text-[11px]">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
