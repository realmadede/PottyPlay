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
    phoneNumber: string | null;
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FFFDF7] text-[#111111]">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#FFB800]/20 border border-[#FFB800]/40 text-[#D97706]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                  Cinema Operations Dashboard
                </h1>
                <p className="text-xs text-[#6B7280]">
                  Live companion break monitoring, Africa&apos;s Talking verification ledger, and audit log.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#111111] font-semibold shadow-sm">
              Century Cinemax &middot; Mlimani City
            </span>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-white hover:bg-[#FFFDF7] border border-[#E5E7EB] text-[#6B7280] shadow-sm transition-colors"
              title="Refresh dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs text-[#111111] flex items-center justify-between">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-[#D97706] hover:underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Active Breaks
              </span>
              <span className="text-2xl font-bold text-[#16A34A] font-mono mt-0.5 block">
                {data?.stats.activeSessions ?? 0}
              </span>
              <span className="text-[10px] text-[#6B7280]">Live companion streams</span>
            </div>
            <div className="p-3 rounded-xl bg-[#16A34A]/10 text-[#16A34A]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Concluded Breaks
              </span>
              <span className="text-2xl font-bold text-[#111111] font-mono mt-0.5 block">
                {(data?.stats.expiredSessions ?? 0) + (data?.stats.revokedSessions ?? 0)}
              </span>
              <span className="text-[10px] text-[#6B7280]">
                {data?.stats.expiredSessions ?? 0} expired &middot; {data?.stats.revokedSessions ?? 0} revoked
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#171717]/5 text-[#111111]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                SMS Notifications
              </span>
              <span className="text-2xl font-bold text-[#D97706] font-mono mt-0.5 block">
                {data?.stats.successfulSmsDeliveries ?? 0}
              </span>
              <span className="text-[10px] text-[#6B7280]">
                Africa&apos;s Talking API verified
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFB800]/20 text-[#D97706]">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Qualifying Revenue
              </span>
              <span className="text-2xl font-bold text-[#111111] font-mono mt-0.5 block">
                TZS {(data?.billing.totalEstimatedRevenueTzs ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#6B7280]">
                {data?.billing.totalBillableActivations ?? 0} activations @ 500 TZS
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#16A34A]/10 text-[#16A34A]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E5E7EB] space-x-1 sm:space-x-4">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "sessions"
                ? "border-[#FFB800] text-[#111111]"
                : "border-transparent text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            Break Sessions ({data?.sessions.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "sms"
                ? "border-[#FFB800] text-[#111111]"
                : "border-transparent text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            SMS Logs ({data?.smsAttempts.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "billing"
                ? "border-[#FFB800] text-[#111111]"
                : "border-transparent text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            Billing Ledger
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "audit"
                ? "border-[#FFB800] text-[#111111]"
                : "border-transparent text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            Security Audit Trail ({data?.auditEvents.length ?? 0})
          </button>
        </div>

        {/* Tab 1: Break Sessions Table */}
        {activeTab === "sessions" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
            {data?.sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] rounded-xl bg-[#FFFDF7] border border-[#E5E7EB]">
                No viewing break sessions currently recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="pb-3 font-semibold">Seat / Ticket</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Phone / SMS</th>
                      <th className="pb-3 font-semibold">Screening</th>
                      <th className="pb-3 font-semibold">Started At</th>
                      <th className="pb-3 font-semibold">Expires At</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Operator Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#111111]">
                    {(data?.sessions || []).map((s) => (
                      <tr key={s.id} className="hover:bg-[#FFFDF7]">
                        <td className="py-3">
                          <span className="font-bold text-[#111111] block">{s.seatNumber}</span>
                          <span className="text-[10px] font-mono text-[#6B7280]">{s.ticketNumber}</span>
                        </td>
                        <td className="py-3 font-medium">{s.customerName || "Patron"}</td>
                        <td className="py-3 font-mono text-[#6B7280]">{s.phoneNumber || "Direct Entitlement"}</td>
                        <td className="py-3 text-[#111111]">{s.screeningTitle}</td>
                        <td className="py-3 text-[#6B7280]">
                          {new Date(s.startedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 text-[#6B7280]">
                          {new Date(s.expiresAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === "ACTIVE"
                                ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                                : s.status === "EXPIRED"
                                ? "bg-[#171717]/5 text-[#6B7280] border border-[#E5E7EB]"
                                : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20"
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
                              className="py-1 px-3 rounded-lg bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#DC2626] text-[11px] font-bold transition-colors"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#6B7280]">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SMS Delivery Logs */}
        {activeTab === "sms" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
            {data?.smsAttempts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] rounded-xl bg-[#FFFDF7] border border-[#E5E7EB]">
                No Africa&apos;s Talking SMS attempts recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold">Recipient</th>
                      <th className="pb-3 font-semibold">Message Type</th>
                      <th className="pb-3 font-semibold">Provider</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#111111]">
                    {(data?.smsAttempts || []).map((m) => (
                      <tr key={m.id} className="hover:bg-[#FFFDF7]">
                        <td className="py-3 font-mono text-[#6B7280]">
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 font-mono text-[#111111]">{m.phoneNumber}</td>
                        <td className="py-3 text-[#6B7280]">{m.messageType}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFFDF7] text-[#111111] border border-[#E5E7EB]">
                            {m.provider}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === "SENT" || m.status === "DELIVERED"
                                ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                                : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[#6B7280]">{m.cost || "TZS 0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Billing & Revenue Summary */}
        {activeTab === "billing" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
            <div className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#FFB800]/40 text-xs text-[#111111]">
              <strong>Commercial Pricing Model:</strong> {data?.billing.disclaimer}.
            </div>

            {data?.billing.recentBillingEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] rounded-xl bg-[#FFFDF7] border border-[#E5E7EB]">
                No billable activation events recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold">Ticket Reference</th>
                      <th className="pb-3 font-semibold">Cinema Venue</th>
                      <th className="pb-3 font-semibold">Assumed Fee</th>
                      <th className="pb-3 font-semibold">Accounting State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#111111]">
                    {(data?.billing.recentBillingEvents || []).map((b) => (
                      <tr key={b.id} className="hover:bg-[#FFFDF7]">
                        <td className="py-3 font-mono text-[#6B7280]">
                          {new Date(b.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 font-mono font-bold text-[#111111]">{b.ticketNumber}</td>
                        <td className="py-3 text-[#6B7280]">{b.cinemaName || "Century Cinemax"}</td>
                        <td className="py-3 font-mono font-bold text-[#111111]">
                          TZS {b.priceTzs.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                            Qualifying (Idempotent)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Security Audit Trail */}
        {activeTab === "audit" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
            {data?.auditEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] rounded-xl bg-[#FFFDF7] border border-[#E5E7EB]">
                No security audit events recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold">Event Type</th>
                      <th className="pb-3 font-semibold">Actor</th>
                      <th className="pb-3 font-semibold">Entity</th>
                      <th className="pb-3 font-semibold">Audit Record Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#111111] font-mono">
                    {(data?.auditEvents || []).map((a) => (
                      <tr key={a.id} className="hover:bg-[#FFFDF7]">
                        <td className="py-3 text-[#6B7280]">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3">
                          <span className="text-[#D97706] font-bold">{a.eventType}</span>
                        </td>
                        <td className="py-3 text-[#111111]">{a.actor}</td>
                        <td className="py-3 text-[#6B7280]">{a.entityType}</td>
                        <td className="py-3 text-[11px] text-[#6B7280] max-w-xs truncate font-sans">
                          {a.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Operator Revocation Modal */}
        {revokeSessionId && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-[#DC2626]">
                <Ban className="w-6 h-6" />
                <h3 className="text-lg font-bold text-[#111111]">Revoke Companion Break</h3>
              </div>

              <p className="text-xs text-[#6B7280] leading-relaxed">
                Revoking this session will immediately disconnect the patron companion stream and record an immutable audit event.
              </p>

              <form onSubmit={handleRevoke} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Revocation Reason
                  </label>
                  <input
                    type="text"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl py-2 px-3 text-[#111111] text-xs focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevokeSessionId(null)}
                    className="w-1/2 py-2.5 rounded-xl font-semibold text-[#6B7280] bg-[#FFFDF7] hover:bg-[#E5E7EB]/50 border border-[#E5E7EB] text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-2.5 rounded-xl font-bold text-white bg-[#DC2626] hover:bg-red-700 text-xs transition-colors disabled:opacity-50"
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
