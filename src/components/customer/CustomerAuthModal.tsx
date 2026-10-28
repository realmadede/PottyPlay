"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Smartphone,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (session: any) => void;
  initialMode?: "register" | "login";
  mandatory?: boolean;
}

export function CustomerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "register",
  mandatory = false,
}: CustomerAuthModalProps) {
  const [view, setView] = useState<"register" | "login" | "verify" | "forgot">("register");

  // Registration state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Verification state
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [phoneChallengeId, setPhoneChallengeId] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [simulatedEmail, setSimulatedEmail] = useState<string | null>(null);

  // Sign in state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage("You must accept the Privacy Policy and Terms of Service to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email,
          password,
          termsAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register account.");
      }

      setPendingCustomerId(data.customerId);
      setPhoneChallengeId(data.phoneChallengeId);
      if (data.simulatedSmsCode) setSimulatedSms(data.simulatedSmsCode);
      if (data.simulatedEmailCode) setSimulatedEmail(data.simulatedEmailCode);

      setView("verify");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Phone SMS OTP
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!pendingCustomerId || !phoneChallengeId || !phoneCode) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: pendingCustomerId,
          challengeId: phoneChallengeId,
          code: phoneCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Phone verification failed.");
      }

      setPhoneVerified(true);

      if (data.isFullyActivated && data.session) {
        if (typeof window !== "undefined" && data.session.sessionToken) {
          localStorage.setItem("pp_cust_token", data.session.sessionToken);
        }
        onSuccess(data.session);
        if (onClose) onClose();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Phone verification error.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Email Code
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!pendingCustomerId || !emailCode) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: pendingCustomerId,
          code: emailCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Email verification failed.");
      }

      setEmailVerified(true);

      if (data.isFullyActivated && data.session) {
        if (typeof window !== "undefined" && data.session.sessionToken) {
          localStorage.setItem("pp_cust_token", data.session.sessionToken);
        }
        onSuccess(data.session);
        if (onClose) onClose();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Email verification error.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.needsVerification) {
          setPendingCustomerId(data.customerId);
          setView("verify");
          throw new Error("Please complete phone and email verification before accessing your account.");
        }
        throw new Error(data.error || "Authentication failed.");
      }

      if (typeof window !== "undefined" && data.session?.sessionToken) {
        localStorage.setItem("pp_cust_token", data.session.sessionToken);
      }

      onSuccess(data.session);
      if (onClose) onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Forgot Password Request
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", identifier: forgotIdentifier }),
      });

      const data = await res.json();
      setForgotSuccessMessage(data.message || "Reset instructions sent.");
      setForgotStep("reset");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Password reset request failed.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Reset Password Completion
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token: resetToken, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Password reset failed.");
      }

      setView("login");
      setErrorMessage(null);
      alert("Password reset successfully. Please sign in with your new password.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md my-8 rounded-3xl bg-field border border-line shadow-elevated p-6 sm:p-8 text-left text-ink">
        {/* Close Button (if non-mandatory) */}
        {!mandatory && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-muted hover:text-ink hover:bg-field-raised transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" variant="icon" href="" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            {view === "register" && "Create Your Account"}
            {view === "login" && "Sign In to PottyPlay"}
            {view === "verify" && "Verify Your Account"}
            {view === "forgot" && "Reset Password"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {view === "register" && "Mandatory verification required for companion viewing."}
            {view === "login" && "Access your saved tickets, screening alerts, and breaks."}
            {view === "verify" && "Confirm your phone and email to activate viewing access."}
            {view === "forgot" && "Recover secure access to your account."}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: REGISTRATION FORM                                      */}
        {/* ============================================================== */}
        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Amani Mwamba"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                <input
                  type="tel"
                  required
                  placeholder="+255 7XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <span className="text-[10px] text-muted mt-0.5 block">
                SMS verification OTP will be sent to this number.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Single unchecked checkbox for Privacy Policy and Terms of Service */}
            <div className="pt-2">
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-amber-500 focus:ring-amber-500 cursor-pointer bg-bg"
                />
                <span className="text-xs text-muted leading-snug">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-bold text-ink underline hover:text-amber-400"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-ink underline hover:text-amber-400"
                  >
                    Privacy Policy
                  </Link>
                  . *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl font-black text-xs sm:text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors duration-150 shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-line text-center text-xs text-muted">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setErrorMessage(null);
                }}
                className="font-bold text-ink hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: VERIFICATION STEP (SMS OTP + EMAIL CODE)              */}
        {/* ============================================================== */}
        {view === "verify" && (
          <div className="space-y-5">
            {/* Simulation Helpers for Evaluation in Dev */}
            {(simulatedSms || simulatedEmail) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                <div className="font-bold uppercase tracking-wider text-[10px]">Verification Codes Dispatched</div>
                {simulatedSms && (
                  <div>SMS OTP: <span className="font-mono font-bold text-amber-400">{simulatedSms}</span></div>
                )}
                {simulatedEmail && (
                  <div>Email Code: <span className="font-mono font-bold text-amber-400">{simulatedEmail}</span></div>
                )}
              </div>
            )}

            {/* Stage 1: Phone SMS Verification */}
            <form onSubmit={handleVerifyPhone} className="p-4 rounded-2xl bg-field border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Phone SMS OTP</span>
                </span>
                {phoneVerified ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted font-mono">6-digit code</span>
                )}
              </div>

              {!phoneVerified ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit SMS code"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-line bg-bg text-ink placeholder-muted text-sm font-mono tracking-widest text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <button
                    type="submit"
                    disabled={loading || phoneCode.length !== 6}
                    className="w-full py-2 rounded-lg text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    Confirm Phone Code
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted">Phone ownership successfully validated.</div>
              )}
            </form>

            {/* Stage 2: Email Verification */}
            <form onSubmit={handleVerifyEmail} className="p-4 rounded-2xl bg-field border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Email Ownership Code</span>
                </span>
                {emailVerified ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted font-mono">6-digit code</span>
                )}
              </div>

              {!emailVerified ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit email code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-line bg-bg text-ink placeholder-muted text-sm font-mono tracking-widest text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                  <button
                    type="submit"
                    disabled={loading || emailCode.length !== 6}
                    className="w-full py-2 rounded-lg text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    Confirm Email Code
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted">Email ownership successfully validated.</div>
              )}
            </form>

            <div className="text-center text-xs text-muted">
              Both verifications are strictly mandatory before viewing authorization is granted.
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: SIGN IN                                                */}
        {/* ============================================================== */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Email or Phone Number *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="you@example.com or +255 7XX XXX XXX"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setView("forgot");
                    setErrorMessage(null);
                  }}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                <input
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl font-black text-xs sm:text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors duration-150 shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-line text-center text-xs text-muted">
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("register");
                  setErrorMessage(null);
                }}
                className="font-bold text-ink hover:underline"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: FORGOT / RESET PASSWORD                               */}
        {/* ============================================================== */}
        {view === "forgot" && (
          <div className="space-y-4">
            {forgotSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span>{forgotSuccessMessage}</span>
              </div>
            )}

            {forgotStep === "request" ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    Account Email or Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="you@example.com or +255 7XX XXX XXX"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-black text-xs sm:text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? "Sending..." : "Send Reset Instructions"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    Reset Token / Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm font-mono text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-black text-xs sm:text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? "Resetting..." : "Set New Password"}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-line text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setErrorMessage(null);
                  setForgotStep("request");
                  setForgotSuccessMessage(null);
                }}
                className="font-bold text-ink hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
