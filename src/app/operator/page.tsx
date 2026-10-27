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
} from "lucide-react";

interface OperatorData {
  timestamp: string;
  stats: {
    activeSessions: number;
    expiredSessions: number;
    revokedSessions: number;
    totalSessionsTracked: number;
    successfulSmsDeliveries: number;
    failedSmsDeliveries: number;
  };
  sessions: Array<{
    id: string;
    sessionTokenMasked: string;
    ticketNumber: string;
    seatNumber: string;
    customerName: string;
    phoneNumber: string;
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
  billing: {
    totalBillableActivations: number;
    totalEstimatedRevenueTzs: number;
    pricePerSessionTzs: number;
    disclaimer: string;
    recentBillingEvents: Array<{
      id: string;
      sessionId: string;
      cinemaName?: string;
      ticketNumber: string;
      priceTzs: number;
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
}

export default function OperatorPage() {
  const [data, setData] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "sms" | "billing" | "audit">("sessions");
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("Auditorium re-entry confirmed by cinema usher.");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/operator/dashboard");
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
  }, []);

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
        setActionNotice("Session revoked successfully.");
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-cinema-950 text-cinema-100">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title and Disclaimer Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cinema-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cinema-900 border border-cinema-750 text-gold-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-cinema-50 tracking-tight">
                Cinema Operator Console
              </h1>
            </div>
            <p className="text-xs text-cinema-400 mt-1">
              Live companion break monitoring, verification auditing, and usage billing ledger.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-cinema-900 border border-cinema-800 text-cinema-300">
              Century Cinemax - Mlimani City (Simulated)
            </span>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 text-cinema-300"
              title="Refresh console"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 rounded-xl bg-cinema-900 border border-cinema-700 text-xs text-cinema-200 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-gold-400 hover:text-gold-300 underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Primary Operational Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block">
                Active Breaks
              </span>
              <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {data?.stats.activeSessions ?? 0}
              </span>
              <span className="text-[10px] text-cinema-500">Live streaming right now</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block">
                Concluded Sessions
              </span>
              <span className="text-2xl font-bold text-cinema-100 font-mono mt-0.5 block">
                {(data?.stats.expiredSessions ?? 0) + (data?.stats.revokedSessions ?? 0)}
              </span>
              <span className="text-[10px] text-cinema-500">
                {data?.stats.expiredSessions ?? 0} expired • {data?.stats.revokedSessions ?? 0} revoked
              </span>
            </div>
            <div className="p-3 rounded-xl bg-cinema-800 border border-cinema-700 text-cinema-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block">
                SMS Deliveries
              </span>
              <span className="text-2xl font-bold text-gold-400 font-mono mt-0.5 block">
                {data?.stats.successfulSmsDeliveries ?? 0}
              </span>
              <span className="text-[10px] text-cinema-500">
                Africa&apos;s Talking API verified
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-gold-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-cinema-400 uppercase tracking-wider block">
                Qualifying Billable
              </span>
              <span className="text-2xl font-bold text-gold-400 font-mono mt-0.5 block">
                TZS {(data?.billing.totalEstimatedRevenueTzs ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-cinema-500">
                {data?.billing.totalBillableActivations ?? 0} activations @ 500 TZS
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gold-950/60 border border-gold-800/80 text-gold-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-cinema-800 space-x-1 sm:space-x-4">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "sessions"
                ? "border-gold-400 text-gold-400"
                : "border-transparent text-cinema-400 hover:text-cinema-200"
            }`}
          >
            Break Sessions ({data?.sessions.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "sms"
                ? "border-gold-400 text-gold-400"
                : "border-transparent text-cinema-400 hover:text-cinema-200"
            }`}
          >
            SMS Logs ({data?.smsAttempts.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "billing"
                ? "border-gold-400 text-gold-400"
                : "border-transparent text-cinema-400 hover:text-cinema-200"
            }`}
          >
            Billing Ledger
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "audit"
                ? "border-gold-400 text-gold-400"
                : "border-transparent text-cinema-400 hover:text-cinema-200"
            }`}
          >
            Security Audit Trail ({data?.auditEvents.length ?? 0})
          </button>
        </div>

        {/* Tab 1: Break Sessions Table */}
        {activeTab === "sessions" && (
          <div className="p-5 rounded-2xl bg-cinema-900 border border-cinema-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cinema-800 text-cinema-400">
                    <th className="pb-3 font-medium">Ticket / Seat</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Screening</th>
                    <th className="pb-3 font-medium">Started At</th>
                    <th className="pb-3 font-medium">Expires At</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Operator Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-850 text-cinema-200">
                  {(data?.sessions || []).map((s) => (
                    <tr key={s.id} className="hover:bg-cinema-850/50">
                      <td className="py-3">
                        <span className="font-bold text-gold-400 block">{s.seatNumber}</span>
                        <span className="text-[10px] font-mono text-cinema-500">{s.ticketNumber}</span>
                      </td>
                      <td className="py-3 font-medium">{s.customerName}</td>
                      <td className="py-3 font-mono text-cinema-400">{s.phoneNumber}</td>
                      <td className="py-3 text-cinema-300">{s.screeningTitle}</td>
                      <td className="py-3 text-cinema-400">
                        {new Date(s.startedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 text-cinema-400">
                        {new Date(s.expiresAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                              : s.status === "EXPIRED"
                              ? "bg-cinema-800 text-cinema-400 border-cinema-700"
                              : "bg-rose-950/60 text-rose-400 border-rose-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {s.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => setRevokeSessionId(s.id)}
                            className="py-1 px-2.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-[11px] text-cinema-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: SMS Delivery Logs */}
        {activeTab === "sms" && (
          <div className="p-5 rounded-2xl bg-cinema-900 border border-cinema-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cinema-800 text-cinema-400">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Recipient</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Provider</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-850 text-cinema-200">
                  {(data?.smsAttempts || []).map((m) => (
                    <tr key={m.id} className="hover:bg-cinema-850/50">
                      <td className="py-3 font-mono text-cinema-400">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 font-mono text-cinema-300">{m.phoneNumber}</td>
                      <td className="py-3 text-cinema-300">{m.messageType}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cinema-800 text-gold-300 border border-cinema-700">
                          {m.provider}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            m.status === "SENT" || m.status === "DELIVERED"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                              : "bg-rose-950/60 text-rose-400 border-rose-800"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-cinema-400">{m.cost || "TZS 0.00"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Billing & Revenue Summary */}
        {activeTab === "billing" && (
          <div className="p-5 rounded-2xl bg-cinema-900 border border-cinema-800 space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
              <strong>Simulated Business Model Assumption:</strong> {data?.billing.disclaimer}. No actual customer payments are processed during the hackathon.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cinema-800 text-cinema-400">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Ticket Reference</th>
                    <th className="pb-3 font-medium">Cinema Venue</th>
                    <th className="pb-3 font-medium">Assumed Fee</th>
                    <th className="pb-3 font-medium">Accounting State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-850 text-cinema-200">
                  {(data?.billing.recentBillingEvents || []).map((b) => (
                    <tr key={b.id} className="hover:bg-cinema-850/50">
                      <td className="py-3 font-mono text-cinema-400">
                        {new Date(b.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 font-mono text-gold-400">{b.ticketNumber}</td>
                      <td className="py-3 text-cinema-300">{b.cinemaName || "Century Cinemax"}</td>
                      <td className="py-3 font-mono font-bold text-cinema-100">
                        TZS {b.priceTzs.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                          Qualifying (Idempotent)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Security Audit Trail */}
        {activeTab === "audit" && (
          <div className="p-5 rounded-2xl bg-cinema-900 border border-cinema-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cinema-800 text-cinema-400">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Event Type</th>
                    <th className="pb-3 font-medium">Actor</th>
                    <th className="pb-3 font-medium">Entity</th>
                    <th className="pb-3 font-medium">Sanitized Audit Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-850 text-cinema-200 font-mono">
                  {(data?.auditEvents || []).map((a) => (
                    <tr key={a.id} className="hover:bg-cinema-850/50">
                      <td className="py-3 text-cinema-400">
                        {new Date(a.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3">
                        <span className="text-gold-400 font-semibold">{a.eventType}</span>
                      </td>
                      <td className="py-3 text-cinema-300">{a.actor}</td>
                      <td className="py-3 text-cinema-400">{a.entityType}</td>
                      <td className="py-3 text-[11px] text-cinema-400 max-w-xs truncate font-sans">
                        {a.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Operator Revocation Modal */}
        {revokeSessionId && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-cinema-900 border border-cinema-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center space-x-3 text-rose-400">
                <Ban className="w-6 h-6" />
                <h3 className="text-lg font-bold text-cinema-50">Revoke Break Session</h3>
              </div>

              <p className="text-xs text-cinema-300 leading-relaxed">
                Revoking this session will immediately cut companion stream playback and record an audit event.
              </p>

              <form onSubmit={handleRevoke} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-cinema-300 mb-1.5">
                    Revocation Reason
                  </label>
                  <input
                    type="text"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full bg-cinema-950 border border-cinema-700 rounded-xl py-2.5 px-3 text-cinema-100 text-xs focus:outline-none focus:border-gold-400"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevokeSessionId(null)}
                    className="w-1/2 py-2.5 rounded-xl font-medium text-cinema-300 bg-cinema-800 hover:bg-cinema-750 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-500 text-xs transition-colors disabled:opacity-50"
                  >
                    Confirm Revoke
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
