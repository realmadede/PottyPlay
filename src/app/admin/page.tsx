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
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminPortalPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <div className="w-full max-w-md bg-field border border-line rounded-3xl p-6 sm:p-8 shadow-card text-left">
          <div className="text-center pb-6 border-b border-line">
            <div className="w-12 h-12 rounded-2xl bg-bg border border-line flex items-center justify-center mx-auto mb-3 text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              Private Platform Administration
            </h1>
            <p className="text-xs text-muted mt-1">
              setapart.pottyplay.co.tz &bull; Restricted Access
            </p>
          </div>

          {loginError && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider">
                Admin Username or Identifier
              </label>
              <input
                type="text"
                required
                placeholder="administrator"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
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

            <p className="text-[11px] text-center text-muted pt-2">
              Security Notice: Unauthorized access attempts are monitored and logged with origin IP.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      {/* Admin Top Header */}
      <header className="bg-field/90 backdrop-blur-md text-ink px-4 sm:px-6 h-16 flex items-center justify-between border-b border-line sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <BrandLogo size="sm" variant="full" />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            setapart.pottyplay.co.tz
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchDashboard(token)}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-field-raised transition-colors"
            title="Refresh Ledger"
            aria-label="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-field-raised hover:bg-field-raised/80 text-ink border border-line flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-muted" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-left">
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex justify-between items-center shadow-card">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="font-bold underline text-amber-400 hover:text-amber-300 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Financial & Accounting KPI Ledger */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-field p-3.5 rounded-2xl border border-line shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase">
              Total Usage
            </span>
            <div className="text-xl font-extrabold text-ink mt-1">
              {data?.accounting.totalUsageEvents ?? 0}
            </div>
            <span className="text-[10px] text-muted">Break activations</span>
          </div>

          <div className="bg-field p-3.5 rounded-2xl border border-line shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase">
              Billable Breaks
            </span>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {data?.accounting.billableUsageEvents ?? 0}
            </div>
            <span className="text-[10px] text-muted">Qualifying sessions</span>
          </div>

          <div className="bg-field p-3.5 rounded-2xl border border-line shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase">
              Accrued Charges
            </span>
            <div className="text-lg font-extrabold text-ink mt-1">
              {data?.accounting.accruedChargesTzs.toLocaleString() ?? 0}{" "}
              <span className="text-[10px] font-normal text-muted">TZS</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Ledger recorded</span>
          </div>

          <div className="bg-field p-3.5 rounded-2xl border border-line shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase">
              Invoiced Amount
            </span>
            <div className="text-lg font-extrabold text-ink mt-1">
              0 <span className="text-[10px] font-normal text-muted">TZS</span>
            </div>
            <span className="text-[10px] text-muted">Cycle settlement</span>
          </div>

          <div className="bg-field p-3.5 rounded-2xl border border-line shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase">
              Payments Received
            </span>
            <div className="text-lg font-extrabold text-ink mt-1">
              0 <span className="text-[10px] font-normal text-muted">TZS</span>
            </div>
            <span className="text-[10px] text-muted">Separated ledger</span>
          </div>

          <div className="bg-field p-3.5 rounded-2xl border border-line shadow-card">
            <span className="text-[10px] font-bold text-muted uppercase">
              Outstanding
            </span>
            <div className="text-lg font-extrabold text-amber-400 mt-1">
              {data?.accounting.outstandingBalancesTzs.toLocaleString() ?? 0}{" "}
              <span className="text-[10px] font-normal text-muted">TZS</span>
            </div>
            <span className="text-[10px] text-amber-400/80">Pending settlement</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-line pb-3">
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
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "bg-field text-muted border border-line hover:text-ink hover:bg-field-raised"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  activeTab === tab.id
                    ? "bg-neutral-950/20 text-neutral-950"
                    : "bg-bg text-muted border border-line"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: Partner Applications Review Workflow */}
        {activeTab === "partners" && (
          <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
            <div className="p-4 border-b border-line flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-muted">
                Cinema Partner Applications for Review
              </span>
              <span className="text-[11px] text-muted">
                Approving automatically provisions tenant cinema workspace
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Venues / Screens</th>
                    <th className="p-3">Ticketing & TMS</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.partnerApplications?.map((app: any) => (
                    <tr key={app.id} className="hover:bg-field-raised/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-ink">{app.organizationName}</div>
                        <div className="text-[11px] text-muted">{app.city}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-ink">{app.contactName}</div>
                        <div className="text-[11px] text-muted">{app.contactEmail}</div>
                      </td>
                      <td className="p-3 text-muted">
                        {app.venueCount} venues &bull; {app.screensCount} screens
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-bg font-mono text-[10px] border border-line text-ink">
                          {app.ticketingSystem} / {app.screeningServer}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            app.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : app.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handlePartnerDecision(app.id, "REJECTED")}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-field-raised text-muted hover:text-red-400 hover:bg-red-500/10 border border-line transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data?.partnerApplications?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-muted">
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
          <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
            <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
              Approved Cinema Circuits & Venues
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Cinema Name</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Screens</th>
                    <th className="p-3">Active Pricing</th>
                    <th className="p-3">TMS Architecture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.cinemas?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-field-raised/50 transition-colors">
                      <td className="p-3 font-bold text-ink">{c.name}</td>
                      <td className="p-3 text-muted">{c.location}</td>
                      <td className="p-3 font-semibold text-ink">{c.screensCount} Screens</td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {c.activePriceTzs} TZS
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted">
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
          <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
            <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
              Global Companion Sessions ({data?.sessions?.length ?? 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Cinema & Screen</th>
                    <th className="p-3">Feature</th>
                    <th className="p-3">Ticket & Seat</th>
                    <th className="p-3">Break</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.sessions?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-field-raised/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-ink">{s.cinemaName}</div>
                        <div className="text-[11px] text-muted">{s.screenName}</div>
                      </td>
                      <td className="p-3 font-semibold text-ink">{s.screeningTitle}</td>
                      <td className="p-3 font-mono text-muted">
                        {s.ticketNumber} &bull; Seat {s.seatNumber}
                      </td>
                      <td className="p-3 text-ink">Break {s.breakNumber} of 2</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : s.status === "EXPIRED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
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
          <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
            <div className="p-4 border-b border-line text-xs">
              <span className="font-bold uppercase tracking-wider text-muted">
                Qualifying Commercial Billing Events
              </span>
              <div className="text-[11px] text-muted mt-1">
                {data?.accounting.disclaimer}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Cinema Venue</th>
                    <th className="p-3">Ticket</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.billingEvents?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-field-raised/50 transition-colors">
                      <td className="p-3 font-bold text-ink">{b.cinemaName}</td>
                      <td className="p-3 font-mono text-ink">{b.ticketNumber}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {b.priceTzs} {b.currency}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted">
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
          <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
            <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
              Platform Security & Operational Audit Log
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                  <tr>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data?.auditEvents?.map((a: any) => (
                    <tr key={a.id} className="hover:bg-field-raised/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">{a.eventType}</td>
                      <td className="p-3 font-semibold text-ink">{a.actor}</td>
                      <td className="p-3 font-mono text-[11px] text-muted max-w-sm truncate">
                        {a.details}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted">
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