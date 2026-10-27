"use client";

import React, { useState, useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  ShieldAlert,
  Lock,
  Building2,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  RefreshCw,
  LogOut,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sliders,
} from "lucide-react";

export default function AdminPortalPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin dashboard state
  const [data, setData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "partners" | "accounting" | "cinemas" | "sessions" | "audit"
  >("partners");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Check stored admin token on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pp_admin_token") : null;
    if (saved && saved.startsWith("adm_")) {
      setToken(saved);
    }
  }, []);

  const fetchDashboard = async (authToken: string) => {
    setLoadingDashboard(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Token invalid or expired
        setToken(null);
        localStorage.removeItem("pp_admin_token");
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Authentication failed.");
      }

      setToken(json.token);
      localStorage.setItem("pp_admin_token", json.token);
      await fetchDashboard(json.token);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("pp_admin_token");
    setData(null);
  };

  const handlePartnerDecision = async (
    applicationId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/partners/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId, decision }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionNotice(
          decision === "APPROVED"
            ? "Partner application approved. Cinema venue and screens provisioned."
            : "Partner application declined."
        );
        await fetchDashboard(token);
      } else {
        setActionNotice(`Action failed: ${json.error}`);
      }
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Review error");
    }
  };

  // If not authenticated, show strict admin login form
  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center p-4 selection:bg-brand-primary selection:text-black">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
          <div className="text-center pb-6 border-b border-neutral-800">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto mb-3 text-brand-primary">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Private Platform Administration
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              setapart.pottyplay.co.tz &bull; Restricted Access
            </p>
          </div>

          {loginError && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-300 mb-1 uppercase tracking-wider">
                Admin Username or Identifier
              </label>
              <input
                type="text"
                required
                placeholder="administrator"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-300 mb-1 uppercase tracking-wider">
                Security Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-brand-primary text-black hover:bg-brand-secondary transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-neutral-500 pt-2">
              Security Notice: Unauthorized access attempts are monitored and logged with origin IP.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-brand-accent text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <BrandLogo size="sm" variant="full" />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-brand-primary border border-neutral-700">
            setapart.pottyplay.co.tz
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchDashboard(token)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Refresh Ledger"
            aria-label="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-left">
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex justify-between items-center">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="font-bold underline text-amber-950 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Financial & Accounting KPI Ledger */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
              Total Usage
            </span>
            <div className="text-xl font-extrabold text-brand-text-primary mt-1">
              {data?.accounting.totalUsageEvents ?? 0}
            </div>
            <span className="text-[10px] text-neutral-500">Break activations</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
              Billable Breaks
            </span>
            <div className="text-xl font-extrabold text-brand-primary mt-1">
              {data?.accounting.billableUsageEvents ?? 0}
            </div>
            <span className="text-[10px] text-neutral-500">Qualifying sessions</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
              Accrued Charges
            </span>
            <div className="text-lg font-extrabold text-brand-text-primary mt-1">
              {data?.accounting.accruedChargesTzs.toLocaleString() ?? 0}{" "}
              <span className="text-[10px] font-normal text-neutral-500">TZS</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Ledger recorded</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
              Invoiced Amount
            </span>
            <div className="text-lg font-extrabold text-neutral-700 mt-1">
              0 <span className="text-[10px] font-normal text-neutral-500">TZS</span>
            </div>
            <span className="text-[10px] text-neutral-400">Cycle settlement</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
              Payments Received
            </span>
            <div className="text-lg font-extrabold text-neutral-700 mt-1">
              0 <span className="text-[10px] font-normal text-neutral-500">TZS</span>
            </div>
            <span className="text-[10px] text-neutral-400">Separated ledger</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-subtle">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">
              Outstanding
            </span>
            <div className="text-lg font-extrabold text-amber-700 mt-1">
              {data?.accounting.outstandingBalancesTzs.toLocaleString() ?? 0}{" "}
              <span className="text-[10px] font-normal text-neutral-500">TZS</span>
            </div>
            <span className="text-[10px] text-amber-800">Pending settlement</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-brand-border pb-3">
          {[
            { id: "partners", label: "Partner Applications", count: data?.partnerApplications?.length },
            { id: "cinemas", label: "Approved Cinemas", count: data?.cinemas?.length },
            { id: "sessions", label: "Active & Past Sessions", count: data?.sessions?.length },
            { id: "accounting", label: "Billing Ledger", count: data?.billingEvents?.length },
            { id: "audit", label: "Audit & Security Logs", count: data?.auditEvents?.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? "bg-brand-accent text-white shadow-subtle"
                  : "bg-white text-brand-text-secondary border border-brand-border hover:text-brand-text-primary"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="px-1.5 py-0.2 rounded-md bg-neutral-200 text-neutral-800 text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: Partner Applications Review Workflow */}
        {activeTab === "partners" && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-brand-border flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-brand-text-secondary">
                Cinema Partner Applications for Review
              </span>
              <span className="text-[11px] text-brand-text-secondary">
                Approving automatically provisions tenant cinema workspace
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Venues / Screens</th>
                    <th className="p-3">Ticketing & TMS</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.partnerApplications?.map((app: any) => (
                    <tr key={app.id} className="hover:bg-neutral-50">
                      <td className="p-3">
                        <div className="font-bold text-brand-text-primary">{app.organizationName}</div>
                        <div className="text-[11px] text-brand-text-secondary">{app.city}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-brand-text-primary">{app.contactName}</div>
                        <div className="text-[11px] text-brand-text-secondary">{app.contactEmail}</div>
                      </td>
                      <td className="p-3 text-brand-text-secondary">
                        {app.venueCount} venues &bull; {app.screensCount} screens
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-brand-bg font-mono text-[10px] border border-brand-border">
                          {app.ticketingSystem} / {app.screeningServer}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            app.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {app.status === "PENDING" ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handlePartnerDecision(app.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handlePartnerDecision(app.id, "REJECTED")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-neutral-200 text-neutral-800 hover:bg-red-100 hover:text-red-800"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data?.partnerApplications?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-brand-text-secondary">
                        No partner applications submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Approved Cinemas */}
        {activeTab === "cinemas" && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-brand-border text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
              Approved Cinema Circuits & Venues
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Cinema Name</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Screens</th>
                    <th className="p-3">Active Pricing</th>
                    <th className="p-3">TMS Architecture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.cinemas?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-brand-text-primary">{c.name}</td>
                      <td className="p-3 text-brand-text-secondary">{c.location}</td>
                      <td className="p-3 font-semibold">{c.screensCount} Screens</td>
                      <td className="p-3 font-mono font-bold text-brand-primary">
                        {c.activePriceTzs} TZS
                      </td>
                      <td className="p-3 font-mono text-[11px] text-neutral-500">
                        {c.ticketingSystem} / {c.screeningSystem}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Global Sessions */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-brand-border text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
              Global Companion Sessions ({data?.sessions?.length ?? 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Cinema & Screen</th>
                    <th className="p-3">Feature</th>
                    <th className="p-3">Ticket & Seat</th>
                    <th className="p-3">Break</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.sessions?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="p-3">
                        <div className="font-bold text-brand-text-primary">{s.cinemaName}</div>
                        <div className="text-[11px] text-brand-text-secondary">{s.screenName}</div>
                      </td>
                      <td className="p-3 font-semibold text-brand-text-primary">{s.screeningTitle}</td>
                      <td className="p-3 font-mono text-brand-text-secondary">
                        {s.ticketNumber} &bull; Seat {s.seatNumber}
                      </td>
                      <td className="p-3">Break {s.breakNumber} of 2</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.status === "EXPIRED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Accounting Ledger */}
        {activeTab === "accounting" && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-brand-border text-xs">
              <span className="font-bold uppercase tracking-wider text-brand-text-secondary">
                Qualifying Commercial Billing Events
              </span>
              <div className="text-[11px] text-brand-text-secondary mt-1">
                {data?.accounting.disclaimer}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Cinema Venue</th>
                    <th className="p-3">Ticket</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.billingEvents?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-brand-text-primary">{b.cinemaName}</td>
                      <td className="p-3 font-mono">{b.ticketNumber}</td>
                      <td className="p-3 font-mono font-bold text-brand-primary">
                        {b.priceTzs} {b.currency}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-brand-text-secondary">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Audit & Security */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-brand-border text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
              Platform Security & Operational Audit Log
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-bg text-brand-text-secondary border-b border-brand-border text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {data?.auditEvents?.map((a: any) => (
                    <tr key={a.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono font-bold text-brand-primary">{a.eventType}</td>
                      <td className="p-3 font-semibold">{a.actor}</td>
                      <td className="p-3 font-mono text-[11px] text-neutral-600 max-w-sm truncate">
                        {a.details}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-brand-text-secondary">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
