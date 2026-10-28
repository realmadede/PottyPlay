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
    <div className="flex-1 flex flex-col min-h-screen bg-brand-bg text-brand-text-primary overflow-x-clip">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        {/* Workspace Title & Venue Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-brand-primary/20 border border-brand-primary/40 text-brand-accent">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-text-primary tracking-tight">
                  Cinema Operator Workspace
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  TENANT ISOLATED
                </span>
              </div>
              <p className="text-xs text-brand-text-secondary">
                Auditorium screen synchronization, active bathroom breaks, and commercial pricing.
              </p>
            </div>
          </div>

          {/* Cinema Venue Switcher */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-brand-text-secondary uppercase">
              Venue:
            </label>
            <select
              value={cinemaId}
              onChange={(e) => setCinemaId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="cinema_mlimani_01">Century Cinemax - Mlimani City</option>
              <option value="cinema_oasis_02">Oasis Cinema - Masaki</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-brand-border bg-white hover:bg-neutral-50 text-brand-text-secondary"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex justify-between items-center animate-fade-in">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="font-bold underline text-amber-950 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Operator Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[11px] font-semibold text-brand-text-secondary uppercase">
              Active Breaks
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-primary mt-1">
              {data?.stats.activeSessions ?? 0}
            </div>
            <span className="text-[10px] text-brand-text-secondary mt-1 block">
              15-minute cap active
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[11px] font-semibold text-brand-text-secondary uppercase">
              Screens Connected
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-text-primary mt-1">
              {data?.cinema.screens.length ?? 0}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              {data?.cinema.screeningSystem}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[11px] font-semibold text-brand-text-secondary uppercase">
              Agreed Pricing
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-brand-text-primary mt-1">
              {data?.pricing.currentPrice ?? 500}{" "}
              <span className="text-xs font-semibold text-brand-text-secondary">
                {data?.pricing.currency ?? "TZS"}
              </span>
            </div>
            <span className="text-[10px] text-brand-text-secondary mt-1 block">
              Status: {data?.pricing.status}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[11px] font-semibold text-brand-text-secondary uppercase">
              Recorded Usage
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-brand-text-primary mt-1">
              {data?.stats.totalRecordedAmount.toLocaleString() ?? 0}{" "}
              <span className="text-xs font-semibold text-brand-text-secondary">
                {data?.pricing.currency ?? "TZS"}
              </span>
            </div>
            <span className="text-[10px] text-brand-text-secondary mt-1 block">
              {data?.stats.totalBillableActivations ?? 0} qualifying breaks
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-brand-border pb-3">
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
                    ? "bg-brand-accent text-white shadow-subtle"
                    : "bg-white text-brand-text-secondary border border-brand-border hover:text-brand-text-primary hover:bg-neutral-50"
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
            <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle min-w-0 w-full">
              <div className="p-4 border-b border-brand-border flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-brand-text-secondary">
                  Auditorium Companion Sessions ({data?.sessions.length ?? 0})
                </span>
                <span className="text-[11px] text-brand-text-secondary">
                  Strict 900s server enforcement
                </span>
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Patron & Seat</th>
                      <th className="p-3">Screening</th>
                      <th className="p-3">Break</th>
                      <th className="p-3">Started</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {data?.sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-neutral-50">
                        <td className="p-3">
                          <div className="font-bold text-brand-text-primary">
                            {session.customerName || "Admitted Patron"}
                          </div>
                          <div className="text-[11px] text-brand-text-secondary font-mono">
                            Seat {session.seatNumber} &bull; {session.ticketNumber}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-brand-text-primary">
                            {session.screeningTitle}
                          </div>
                          <div className="text-[11px] text-brand-text-secondary">
                            {session.screenName}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-brand-bg font-bold text-[11px] border border-brand-border">
                            Break {session.breakNumber} of 2
                          </span>
                        </td>
                        <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
                          {new Date(session.startedAt).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              session.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 animate-pulse"
                                : session.status === "EXPIRED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {session.status === "ACTIVE" && (
                            <button
                              onClick={() => setRevokeSessionId(session.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
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
                className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-3"
              >
                <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Manual Usher Revocation</span>
                </div>
                <p className="text-xs text-red-700">
                  Revoking this session will immediately disconnect patron companion playback and record an auditable event.
                </p>
                <input
                  type="text"
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-red-300 bg-white text-xs"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                  >
                    Confirm Disconnection
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeSessionId(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-800 hover:bg-neutral-50"
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
                  className="p-5 rounded-2xl bg-white border border-brand-border shadow-subtle space-y-3"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-brand-border">
                    <div>
                      <h3 className="font-extrabold text-base text-brand-text-primary">
                        {sc.title}
                      </h3>
                      <div className="text-xs text-brand-text-secondary mt-0.5">
                        {sc.screen.name} &bull; {sc.screen.totalSeats} Seats Capacity
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sc.status === "PLAYING"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {sc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
                      <span className="text-[10px] text-brand-text-secondary uppercase">
                        Authoritative Timecode
                      </span>
                      <div className="font-mono font-bold text-base text-brand-text-primary mt-0.5">
                        {formatSeconds(sc.currentPositionSeconds)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-brand-bg border border-brand-border">
                      <span className="text-[10px] text-brand-text-secondary uppercase">
                        Feature Runtime
                      </span>
                      <div className="font-mono font-bold text-base text-brand-text-primary mt-0.5">
                        {formatSeconds(sc.contentAsset.durationSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-brand-text-secondary">Projection Pause State:</span>
                    <span className="font-bold text-brand-text-primary">
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
            <div className="p-6 rounded-3xl bg-white border border-brand-border shadow-card max-w-xl">
              <div className="flex items-center space-x-2 border-b border-brand-border pb-4 mb-4">
                <Tag className="w-5 h-5 text-brand-primary" />
                <h3 className="font-extrabold text-base text-brand-text-primary">
                  Cinema Commercial Pricing Schedule
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border text-xs space-y-1 mb-5">
                <div>
                  <strong className="text-brand-text-primary">Current Active Price:</strong>{" "}
                  {data?.pricing.currentPrice} {data?.pricing.currency} per qualifying break
                </div>
                <div>
                  <strong className="text-brand-text-primary">Agreement Status:</strong>{" "}
                  <span className="text-emerald-700 font-bold">{data?.pricing.status}</span>
                </div>
                <p className="text-[11px] text-brand-text-secondary pt-1">
                  Historical transactions strictly preserve the terms applied when created. Past billing records are never mutated.
                </p>
              </div>

              <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">
                      Per-Session Rate
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">
                      Currency
                    </label>
                    <select
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-xs"
                    >
                      <option value="TZS">TZS (Tanzanian Shillings)</option>
                      <option value="KES">KES (Kenyan Shillings)</option>
                      <option value="USD">USD (US Dollars)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">
                    Pricing Status
                  </label>
                  <select
                    value={newPricingStatus}
                    onChange={(e) => setNewPricingStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-xs"
                  >
                    <option value="ACTIVE">ACTIVE (Agreed Commercial Terms)</option>
                    <option value="PENDING_AGREEMENT">PENDING_AGREEMENT (Under Review)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-brand-text-primary mb-1">
                    Schedule Notes / Contract Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exhibitor Agreement 2026 Q4 Schedule A"
                    value={pricingNotes}
                    onChange={(e) => setPricingNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPrice}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2 disabled:opacity-50"
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
            <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
              <div className="p-4 border-b border-brand-border flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-brand-text-secondary">
                    Audited Qualifying Events ({data?.billing.totalBillableActivations ?? 0})
                  </span>
                  <div className="text-[11px] text-brand-text-secondary mt-0.5">
                    {data?.billing.disclaimer}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Ticket</th>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Recorded Rate</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {data?.billing.recentBillingEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-mono font-bold text-brand-text-primary">
                          {event.ticketNumber}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-brand-text-secondary">
                          {event.sessionId}
                        </td>
                        <td className="p-3 font-mono font-bold text-brand-text-primary">
                          {event.priceTzs} {event.currency}
                        </td>
                        <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
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
            <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
              <div className="p-4 border-b border-brand-border text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                Africa&apos;s Talking Delivery Log ({data?.smsAttempts.length ?? 0})
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {data?.smsAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-mono font-semibold text-brand-text-primary">
                          {attempt.phoneNumber}
                        </td>
                        <td className="p-3 text-[11px] text-brand-text-secondary">
                          {attempt.provider}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              attempt.status === "SENT" || attempt.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {attempt.status}
                          </span>
                        </td>
                        <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
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
            <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
              <div className="p-4 border-b border-brand-border text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                Audited System Operations ({data?.auditEvents.length ?? 0})
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Details</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {data?.auditEvents.map((a) => (
                      <tr key={a.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-mono font-bold text-brand-primary">
                          {a.eventType}
                        </td>
                        <td className="p-3 font-semibold text-brand-text-primary">
                          {a.actor}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-neutral-600 max-w-xs truncate">
                          {a.details}
                        </td>
                        <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
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
