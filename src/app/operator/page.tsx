"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { NavigationHeader } from "@/components/NavigationHeader";
import { BrandLogo } from "@/components/BrandLogo";
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
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  LogOut,
  Check,
  Ticket,
} from "lucide-react";

interface OperatorSession {
  id: string;
  cinemaId: string;
  email: string;
  name: string;
  role: string;
  cinema: {
    id: string;
    name: string;
    location: string;
  };
}

interface OperatorData {
  timestamp: string;
  hasCinemas?: boolean;
  availableCinemas?: Array<{ id: string; name: string; location: string }>;
  cinema: {
    id: string;
    name: string;
    location: string;
    timezone: string;
    ticketingSystem: string;
    screeningSystem: string;
    status: string;
    screens: Array<{ id: string; name: string; totalSeats: number }>;
  } | null;
  pricing: {
    currentPrice: number | null;
    currency: string;
    status: string;
    configuredAt: string | null;
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
  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [operator, setOperator] = useState<OperatorSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sign In Form State
  const [authMode, setAuthMode] = useState<"signin" | "forgot" | "reset">("signin");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Forgot Password Form State
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset Password Form State
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Operator Workspace Data State
  const [cinemaId, setCinemaId] = useState("");
  const [data, setData] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "sessions" | "screenings" | "tickets" | "pricing" | "billing" | "sms" | "audit"
  >("sessions");

  // Screening Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleScreenId, setScheduleScreenId] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showIssueTicketModal, setShowIssueTicketModal] = useState(false);
  const [ticketScreeningId, setTicketScreeningId] = useState("");
  const [ticketSeatNumber, setTicketSeatNumber] = useState("");
  const [ticketCustomerName, setTicketCustomerName] = useState("");
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [issuedTicketSuccess, setIssuedTicketSuccess] = useState<{
    ticketNumber: string;
    claimToken: string;
    watchClaimUrl: string;
  } | null>(null);

  // Revoke State
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState(
    "Auditorium re-entry confirmed by cinema usher."
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Pricing Rule State
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newCurrency, setNewCurrency] = useState("TZS");
  const [newPricingStatus, setNewPricingStatus] = useState("ACTIVE");
  const [pricingNotes, setPricingNotes] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  // Verify stored operator token on mount
  useEffect(() => {
    const savedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("pp_operator_token")
        : null;

    if (savedToken && savedToken.startsWith("opr_")) {
      fetch("/api/operator/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.operator) {
            setToken(savedToken);
            setOperator(json.operator);
            setCinemaId(json.operator.cinemaId);
          } else {
            localStorage.removeItem("pp_operator_token");
            setToken(null);
            setOperator(null);
          }
        })
        .catch(() => {
          setToken(null);
          setOperator(null);
        })
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch("/api/operator/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Authentication failed.");
      }

      setToken(json.token);
      setOperator(json.operator);
      setCinemaId(json.operator.cinemaId);
      localStorage.setItem("pp_operator_token", json.token);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotNotice(null);
    setForgotLoading(true);

    try {
      const res = await fetch("/api/operator/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Request failed.");
      }

      setForgotNotice(json.message || "Reset instructions dispatched.");
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetNotice(null);
    setResetLoading(true);

    try {
      const res = await fetch("/api/operator/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetNewPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Password reset failed.");
      }

      setResetNotice(json.message || "Password successfully reset.");
      setResetToken("");
      setResetNewPassword("");
      setTimeout(() => {
        setAuthMode("signin");
        setResetNotice(null);
      }, 2500);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/operator/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore logout network failure
      }
    }
    setToken(null);
    setOperator(null);
    setData(null);
    localStorage.removeItem("pp_operator_token");
    setAuthMode("signin");
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const url = cinemaId
        ? `/api/operator/dashboard?cinemaId=${cinemaId}`
        : `/api/operator/dashboard`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: OperatorData = await res.json();
        setData(json);
        if (!cinemaId && json.cinema?.id) {
          setCinemaId(json.cinema.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch operator dashboard:", err);
    }
  }, [cinemaId, token]);

  const fetchTickets = useCallback(async () => {
    if (!token || !cinemaId) return;
    setTicketsLoading(true);
    try {
      const res = await fetch(`/api/operator/tickets?cinemaId=${cinemaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTickets(json.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  }, [cinemaId, token]);

  useEffect(() => {
    if (!token) return;
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData, token]);

  useEffect(() => {
    if (activeTab === "tickets" && token && cinemaId) {
      fetchTickets();
    }
  }, [activeTab, fetchTickets, token, cinemaId]);

  const handleScheduleScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cinemaId || !scheduleTitle || !scheduleScreenId || !scheduleStartTime) return;
    setSchedulingLoading(true);
    try {
      const res = await fetch("/api/operator/screenings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cinemaId,
          screenId: scheduleScreenId,
          title: scheduleTitle,
          scheduledStart: new Date(scheduleStartTime).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to schedule screening.");
      }
      setActionNotice(`Screening "${scheduleTitle}" successfully scheduled!`);
      setShowScheduleModal(false);
      setScheduleTitle("");
      setScheduleScreenId("");
      setScheduleStartTime("");
      await fetchData();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to schedule screening.");
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cinemaId || !ticketScreeningId || !ticketSeatNumber || !ticketCustomerName) return;
    setIssuingTicket(true);
    try {
      const res = await fetch("/api/operator/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cinemaId,
          screeningId: ticketScreeningId,
          seatNumber: ticketSeatNumber,
          customerName: ticketCustomerName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to issue demonstration ticket.");
      }
      setIssuedTicketSuccess({
        ticketNumber: json.ticket.ticketNumber,
        claimToken: json.ticket.claimToken,
        watchClaimUrl: json.watchClaimUrl,
      });
      setActionNotice(`Ticket ${json.ticket.ticketNumber} issued successfully!`);
      setTicketSeatNumber("");
      setTicketCustomerName("");
      await fetchTickets();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to issue ticket.");
    } finally {
      setIssuingTicket(false);
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeSessionId || !token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/operator/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    if (!token) return;
    if (newPrice === "" || Number(newPrice) < 0) {
      setActionNotice("Please enter a valid commercial session rate.");
      return;
    }
    const targetCinemaId = cinemaId || data?.cinema?.id;
    if (!targetCinemaId) {
      setActionNotice("No authorized cinema selected for pricing updates.");
      return;
    }

    setSavingPrice(true);
    try {
      const res = await fetch("/api/operator/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cinemaId: targetCinemaId,
          pricePerSession: Number(newPrice),
          currency: newCurrency,
          status: newPricingStatus,
          notes: pricingNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setActionNotice("Cinema pricing rule updated successfully.");
        setNewPrice("");
        setPricingNotes("");
        await fetchData();
      } else {
        const errorJson = await res.json();
        setActionNotice(`Failed to update pricing: ${errorJson.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pricing error";
      setActionNotice(msg);
    } finally {
      setSavingPrice(false);
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Loading Session Check
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Verifying Operator Session...
        </span>
      </div>
    );
  }

  // Unauthenticated State: Show ONLY the Sign In Page with Forgot Password
  if (!token || !operator) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <div className="w-full max-w-md glass-ios26 glass-ios26-rim glass-ios26-glint border border-white/20 rounded-3xl p-6 sm:p-8 shadow-card text-left">
          {/* Header */}
          <div className="text-center pb-6 border-b border-line">
            <div className="w-12 h-12 rounded-2xl bg-bg border border-line flex items-center justify-center mx-auto mb-3 text-amber-400">
              <Sliders className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              Cinema Operator Portal
            </h1>
            <p className="text-xs text-muted mt-1">
              Authorized Exhibitor Operations & Telemetry
            </p>
          </div>

          {/* MODE 1: Sign In */}
          {authMode === "signin" && (
            <>
              {loginError && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                    Operator Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="manager@cinema.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-ink uppercase tracking-wider text-[11px]">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot");
                        setLoginError(null);
                      }}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowLoginPassword((prev) => !prev);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer z-10 flex items-center justify-center"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4 pointer-events-none" />
                      ) : (
                        <Eye className="w-4 h-4 pointer-events-none" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {loggingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Cinema Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-field-raised/60 border border-line text-[11px] text-muted space-y-1 mt-4">
                  <span className="font-bold text-ink block">Platform Registration Notice</span>
                  <p>
                    Every cinema is registered exclusively through Platform Administration. Operators authenticate with credentials provisioned during venue onboarding.
                  </p>
                </div>
              </form>
            </>
          )}

          {/* MODE 2: Forgot Password */}
          {authMode === "forgot" && (
            <div className="mt-6 space-y-4 text-xs">
              <div>
                <h2 className="text-sm font-bold text-ink">Reset Operator Password</h2>
                <p className="text-[11px] text-muted mt-0.5">
                  Enter your registered cinema email address to receive password reset instructions.
                </p>
              </div>

              {forgotNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{forgotNotice}</span>
                </div>
              )}

              {forgotError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                    Registered Operator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="manager@cinema.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-line flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("reset");
                    setForgotError(null);
                  }}
                  className="font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Have a reset token? Enter here
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setForgotError(null);
                    setForgotNotice(null);
                  }}
                  className="text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: Enter Reset Token & Set New Password */}
          {authMode === "reset" && (
            <div className="mt-6 space-y-4 text-xs">
              <div>
                <h2 className="text-sm font-bold text-ink">Set New Operator Password</h2>
                <p className="text-[11px] text-muted mt-0.5">
                  Enter the reset token dispatched to your account and specify your new security password.
                </p>
              </div>

              {resetNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{resetNotice}</span>
                </div>
              )}

              {resetError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="opr_rst_..."
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                    New Password (Min 8 Characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type={showResetNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="••••••••••••"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-line bg-bg text-ink text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowResetNewPassword((prev) => !prev);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer z-10 flex items-center justify-center"
                      aria-label={showResetNewPassword ? "Hide password" : "Show password"}
                    >
                      {showResetNewPassword ? (
                        <EyeOff className="w-4 h-4 pointer-events-none" />
                      ) : (
                        <Eye className="w-4 h-4 pointer-events-none" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Update Operator Password</span>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-line text-center text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setResetError(null);
                    setResetNotice(null);
                  }}
                  className="text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasNoCinemas =
    data &&
    (!data.hasCinemas ||
      !data.cinema ||
      !data.availableCinemas ||
      data.availableCinemas.length === 0);

  // Authenticated State: Full Workspace Scoped to Operator
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg text-ink overflow-x-clip">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-w-0 text-left">
        {/* Workspace Title & Operator Bar */}
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  TENANT ISOLATED
                </span>
              </div>
              <p className="text-xs text-muted">
                {operator.cinema.name} &bull; {operator.cinema.location}
              </p>
            </div>
          </div>

          {/* Operator Badge and Sign Out */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl text-xs font-semibold bg-bg text-ink border border-line">
              {operator.email}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {operator.role}
            </span>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-line bg-field hover:bg-field-raised text-muted hover:text-ink transition-colors cursor-pointer"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-field hover:bg-field-raised text-muted hover:text-ink border border-line flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex justify-between items-center animate-fade-in">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="font-bold underline text-amber-400 ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Truthful Empty State when 0 registered cinemas */}
        {hasNoCinemas ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-field border border-line shadow-card text-center max-w-2xl mx-auto space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              Awaiting Platform Provisioning
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Your operator account has been authenticated, but auditorium screens and commercial pricing are currently undergoing configuration by platform administration.
            </p>
          </div>
        ) : (
          <>
            {/* Operator Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-ios26 glass-ios26-rim glass-ios26-glint p-4 rounded-2xl border border-white/10 shadow-card">
                <span className="text-[11px] font-semibold text-muted uppercase">
                  Active Breaks
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                  {data?.stats?.activeSessions ?? 0}
                </div>
                <span className="text-[11px] text-muted">Currently in restroom</span>
              </div>

              <div className="glass-ios26 glass-ios26-rim glass-ios26-glint p-4 rounded-2xl border border-white/10 shadow-card">
                <span className="text-[11px] font-semibold text-muted uppercase">
                  Total Completed
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                  {data?.stats?.expiredSessions ?? 0}
                </div>
                <span className="text-[11px] text-muted">Ended or expired</span>
              </div>

              <div className="glass-ios26 glass-ios26-rim glass-ios26-glint p-4 rounded-2xl border border-white/10 shadow-card">
                <span className="text-[11px] font-semibold text-muted uppercase">
                  Manual Revocations
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                  {data?.stats?.revokedSessions ?? 0}
                </div>
                <span className="text-[11px] text-muted">Floor usher interventions</span>
              </div>

              <div className="glass-ios26 glass-ios26-rim glass-ios26-glint p-4 rounded-2xl border border-white/10 shadow-card">
                <span className="text-[11px] font-semibold text-muted uppercase">
                  Total Tracked
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                  {data?.stats?.totalSessionsTracked ?? 0}
                </div>
                <span className="text-[11px] text-muted">Audited admissions</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-line pb-3">
              {[
                { id: "sessions", label: "Active & Recent Breaks", count: data?.sessions?.length },
                { id: "screenings", label: "Auditorium Screens", count: data?.screenings?.length },
                { id: "tickets", label: "Tickets & Entitlements", count: tickets.length || null },
                { id: "pricing", label: "Commercial Pricing", count: null },
                { id: "billing", label: "Billed Transactions", count: data?.billing?.totalBillableActivations },
                { id: "sms", label: "Delivery Telemetry", count: data?.smsAttempts?.length },
                { id: "audit", label: "Usher Audit Ledger", count: data?.auditEvents?.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                      : "bg-field text-muted border border-line hover:text-ink hover:bg-field-raised"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        activeTab === tab.id
                          ? "bg-neutral-950/20 text-neutral-950"
                          : "bg-bg text-muted border border-line"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* TAB 1: SESSIONS */}
            {activeTab === "sessions" && (
              <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
                <div className="p-4 border-b border-line flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted">
                    Companion Viewing Break Sessions
                  </span>
                  <span className="text-[11px] text-muted">Auto-refreshes every 4s</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                      <tr>
                        <th className="p-3">Patron & Seat</th>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Auditorium / Film</th>
                        <th className="p-3">Break Window</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Usher Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data?.sessions?.map((s) => (
                        <tr key={s.id} className="hover:bg-field-raised/50 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-ink">{s.customerName}</div>
                            <div className="text-[11px] text-muted">Seat: {s.seatNumber}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-ink">{s.ticketNumber}</td>
                          <td className="p-3">
                            <div className="font-semibold text-ink">{s.screeningTitle}</div>
                            <div className="text-[11px] text-muted">{s.screenName}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-muted">
                            <div>Start: {new Date(s.startedAt).toLocaleTimeString()}</div>
                            <div>Expires: {new Date(s.expiresAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                s.status === "ACTIVE"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                  : s.status === "EXPIRED"
                                  ? "bg-neutral-800 text-muted"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {s.status === "ACTIVE" ? (
                              <button
                                onClick={() => setRevokeSessionId(s.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-field-raised text-muted hover:text-red-400 hover:bg-red-500/10 border border-line transition-colors cursor-pointer"
                              >
                                Revoke Access
                              </button>
                            ) : (
                              <span className="text-[11px] text-muted">Closed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {data?.sessions?.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-muted">
                            No active bathroom breaks right now.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: AUDITORIUM SCREENS */}
            {activeTab === "screenings" && (
              <div className="space-y-4">
                <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
                  <div className="p-4 border-b border-line flex justify-between items-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted">
                      Live Auditorium Screenings & Timeline Positions
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500 hover:text-neutral-950 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule Screening</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {data?.screenings?.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-4 rounded-xl border border-line bg-bg space-y-3 shadow-card"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                              {sc.screen.name} &bull; {sc.screen.totalSeats} Seats
                            </span>
                            <h3 className="font-bold text-sm sm:text-base text-ink mt-0.5">
                              {sc.title}
                            </h3>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sc.status === "PLAYING" || sc.status === "IN_PROGRESS"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-field text-muted border border-line"
                            }`}
                          >
                            {sc.status}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] text-muted font-mono">
                            <span>Timeline: {formatSeconds(sc.currentPositionSeconds)}</span>
                            <span>Duration: {formatSeconds(sc.contentAsset.durationSeconds)}</span>
                          </div>
                          <div className="w-full bg-field-raised h-2 rounded-full overflow-hidden border border-line">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (sc.currentPositionSeconds / sc.contentAsset.durationSeconds) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-muted pt-2 border-t border-line">
                          <span>Playback State: {sc.isPaused ? "PAUSED" : "PLAYING"}</span>
                          <span>Start: {new Date(sc.scheduledStart).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                    {data?.screenings?.length === 0 && (
                      <div className="col-span-2 p-8 text-center text-xs text-muted">
                        No auditorium screenings configured.
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Screening Modal */}
                {showScheduleModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-field border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-line pb-3">
                        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                          Schedule Auditorium Screening
                        </h3>
                        <button
                          onClick={() => setShowScheduleModal(false)}
                          className="text-muted hover:text-ink cursor-pointer"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleScheduleScreening} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-muted font-bold mb-1">Film / Presentation Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Serengeti Symphony - 4K Feature"
                            value={scheduleTitle}
                            onChange={(e) => setScheduleTitle(e.target.value)}
                            className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-muted font-bold mb-1">Auditorium Screen</label>
                          <select
                            required
                            value={scheduleScreenId}
                            onChange={(e) => setScheduleScreenId(e.target.value)}
                            className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400"
                          >
                            <option value="">Select an auditorium screen...</option>
                            {data?.cinema?.screens?.map((screen) => (
                              <option key={screen.id} value={screen.id}>
                                {screen.name} ({screen.totalSeats} seats)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-muted font-bold mb-1">Scheduled Start Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={scheduleStartTime}
                            onChange={(e) => setScheduleStartTime(e.target.value)}
                            className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowScheduleModal(false)}
                            className="px-4 py-2 rounded-xl bg-field-raised border border-line text-muted hover:text-ink cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={schedulingLoading}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition cursor-pointer flex items-center space-x-1"
                          >
                            {schedulingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Confirm & Schedule</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: TICKETS & ENTITLEMENTS */}
            {activeTab === "tickets" && (
              <div className="space-y-4">
                <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
                  <div className="p-4 border-b border-line flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted">
                        Demonstration Tickets & QR Entitlements
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        Issue verified tickets for live companion viewing testing
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowIssueTicketModal(true);
                        setIssuedTicketSuccess(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500 hover:text-neutral-950 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Issue Demonstration Ticket</span>
                    </button>
                  </div>

                  {issuedTicketSuccess && (
                    <div className="m-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                      <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ticket Issued Successfully</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-ink">
                        <div>Ticket Number: <span className="font-mono font-bold text-amber-300">{issuedTicketSuccess.ticketNumber}</span></div>
                        <div>Claim Token: <span className="font-mono font-bold text-amber-300">{issuedTicketSuccess.claimToken}</span></div>
                      </div>
                      <div className="pt-1 flex items-center space-x-2">
                        <Link
                          href={issuedTicketSuccess.watchClaimUrl}
                          target="_blank"
                          className="inline-flex items-center space-x-1 text-amber-400 underline font-mono text-[11px] hover:text-amber-300"
                        >
                          <span>Open Direct Companion Stream</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-field-raised text-muted uppercase font-mono text-[10px] border-b border-line">
                        <tr>
                          <th className="p-3">Ticket #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Screen & Seat</th>
                          <th className="p-3">Screening</th>
                          <th className="p-3">Claim Token</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-ink">
                        {ticketsLoading ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-xs text-muted">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                            </td>
                          </tr>
                        ) : tickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-xs text-muted">
                              No tickets issued yet. Click &quot;Issue Demonstration Ticket&quot; above to create one.
                            </td>
                          </tr>
                        ) : (
                          tickets.map((t: any) => (
                            <tr key={t.id} className="hover:bg-field-raised/50 transition">
                              <td className="p-3 font-mono font-bold text-amber-400">
                                {t.ticketNumber}
                              </td>
                              <td className="p-3 font-medium">{t.customerName}</td>
                              <td className="p-3">
                                {t.screening?.screen?.name || "Screen"} &bull; Seat {t.seatNumber}
                              </td>
                              <td className="p-3 max-w-[180px] truncate">
                                {t.screening?.title || "Screening"}
                              </td>
                              <td className="p-3 font-mono text-muted text-[11px]">
                                {t.claimToken || "-"}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    t.status === "VALID_ADMITTED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-field text-muted border border-line"
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {t.claimToken ? (
                                  <Link
                                    href={`/watch?claim=${encodeURIComponent(t.claimToken)}`}
                                    target="_blank"
                                    className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-neutral-950 font-bold text-[11px] border border-amber-500/30 transition inline-flex items-center space-x-1"
                                  >
                                    <span>Stream</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </Link>
                                ) : (
                                  <span className="text-muted text-[11px]">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Issue Ticket Modal */}
                {showIssueTicketModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-field border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-line pb-3">
                        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                          Issue Demonstration Ticket
                        </h3>
                        <button
                          onClick={() => setShowIssueTicketModal(false)}
                          className="text-muted hover:text-ink cursor-pointer"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleIssueTicket} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-muted font-bold mb-1">Target Screening</label>
                          <select
                            required
                            value={ticketScreeningId}
                            onChange={(e) => setTicketScreeningId(e.target.value)}
                            className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400"
                          >
                            <option value="">Select a screening...</option>
                            {data?.screenings?.map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                {sc.title} ({sc.screen.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-muted font-bold mb-1">Patron Customer Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Amani Mwamba"
                            value={ticketCustomerName}
                            onChange={(e) => setTicketCustomerName(e.target.value)}
                            className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-muted font-bold mb-1">Seat Number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. F12 or D04"
                            value={ticketSeatNumber}
                            onChange={(e) => setTicketSeatNumber(e.target.value)}
                            className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowIssueTicketModal(false)}
                            className="px-4 py-2 rounded-xl bg-field-raised border border-line text-muted hover:text-ink cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={issuingTicket}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition cursor-pointer flex items-center space-x-1"
                          >
                            {issuingTicket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Generate & Issue</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COMMERCIAL PRICING */}
            {activeTab === "pricing" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-field rounded-2xl border border-line p-6 shadow-card space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                      Commercial Pricing per Restroom Activation
                    </h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Configure cinema rate terms for bathroom companion access. Historical billing ledgers preserve previous effective rates without retroactively altering audited invoices.
                    </p>
                  </div>

                  <form onSubmit={handleSavePricing} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                          Price Per Session *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder={data?.pricing.currentPrice != null ? String(data.pricing.currentPrice) : "Enter agreed rate"}
                          value={newPrice}
                          onChange={(e) =>
                            setNewPrice(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                          Currency
                        </label>
                        <select
                          value={newCurrency}
                          onChange={(e) => setNewCurrency(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-line bg-bg text-ink text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                        >
                          <option value="TZS">TZS - Tanzanian Shilling</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="KES">KES - Kenyan Shilling</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Pricing Revision Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Seasonal promotion agreed in addendum #4"
                        value={pricingNotes}
                        onChange={(e) => setPricingNotes(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingPrice || newPrice === ""}
                      className="py-2.5 px-5 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      {savingPrice ? "Updating Rate..." : "Commit Commercial Rate Rule"}
                    </button>
                  </form>
                </div>

                {/* Current Active Rule Card */}
                <div className="bg-field rounded-2xl border border-line p-6 shadow-card space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                    Authoritative Effective Pricing
                  </h4>
                  <div className="p-4 rounded-xl bg-bg border border-line space-y-2">
                    <span className="text-[11px] text-muted">Active Platform Rate</span>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {data?.pricing.currentPrice != null
                        ? `${data.pricing.currentPrice} ${data.pricing.currency}`
                        : "Not Configured"}
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 block">
                      Status: {data?.pricing.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Note: Pricing agreements are configured in the platform database. The platform will never bill patrons directly without verified cinema commercial authorization.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: BILLED TRANSACTIONS */}
            {activeTab === "billing" && (
              <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
                <div className="p-4 border-b border-line flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-muted">
                    Restroom Activation Billing Ledger
                  </span>
                  <span className="text-[11px] text-muted">
                    Total Estimated Accrual:{" "}
                    <strong className="text-amber-400 font-mono">
                      {data?.billing?.totalEstimatedRevenueTzs?.toLocaleString() ?? 0}{" "}
                      {data?.billing?.currency ?? "TZS"}
                    </strong>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                      <tr>
                        <th className="p-3">Event ID</th>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Charged Amount</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data?.billing?.recentBillingEvents?.map((ev) => (
                        <tr key={ev.id} className="hover:bg-field-raised/50 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-muted">{ev.id}</td>
                          <td className="p-3 font-mono font-semibold text-ink">{ev.ticketNumber}</td>
                          <td className="p-3 font-mono font-bold text-amber-400">
                            {ev.priceTzs.toLocaleString()} {ev.currency}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-muted">
                            {new Date(ev.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {data?.billing?.recentBillingEvents?.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-xs text-muted">
                            No billing events recorded for this cinema yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: SMS TELEMETRY */}
            {activeTab === "sms" && (
              <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
                <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
                  SMS Gateway Delivery Attempts
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg text-muted border-b border-line text-[11px] font-bold uppercase">
                      <tr>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data?.smsAttempts?.map((sms) => (
                        <tr key={sms.id} className="hover:bg-field-raised/50 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-ink">{sms.phoneNumber}</td>
                          <td className="p-3 font-semibold text-muted">{sms.messageType}</td>
                          <td className="p-3 text-muted">{sms.provider}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                sms.status === "DELIVERED" || sms.status === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {sms.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-muted">
                            {new Date(sms.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {data?.smsAttempts?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-xs text-muted">
                            No SMS attempts logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: AUDIT LEDGER */}
            {activeTab === "audit" && (
              <div className="bg-field rounded-2xl border border-line overflow-hidden shadow-card">
                <div className="p-4 border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
                  Cinema Floor Usher & Security Event Ledger
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
                      {data?.auditEvents?.map((a) => (
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
                      {data?.auditEvents?.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-xs text-muted">
                            No audit ledger events recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Revoke Modal Dialog */}
        {revokeSessionId && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-field border border-line rounded-3xl max-w-md w-full p-6 shadow-card space-y-4 text-left">
              <div className="flex items-center space-x-3 text-red-400">
                <Ban className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-bold text-base text-ink">
                  Manual Usher Revocation
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Revoking immediately terminates companion video playback for this patron session and records the usher action in the security audit trail.
              </p>

              <form onSubmit={handleRevoke} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    Revocation Rationale *
                  </label>
                  <select
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <option value="Auditorium re-entry confirmed by cinema usher.">
                      Auditorium re-entry confirmed by cinema usher
                    </option>
                    <option value="Ticket invalidation or fraudulent access detection.">
                      Ticket invalidation or fraudulent access detection
                    </option>
                    <option value="Patron departed cinema premises.">
                      Patron departed cinema premises
                    </option>
                    <option value="Restroom break duration exceeded maximum permissible grace.">
                      Restroom break duration exceeded maximum grace
                    </option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevokeSessionId(null)}
                    className="py-2 px-3.5 rounded-xl font-semibold text-xs bg-bg text-muted hover:text-ink border border-line transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2 px-4 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {loading ? "Revoking..." : "Confirm Revoke"}
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
