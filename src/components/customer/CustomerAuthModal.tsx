"use client";

import React, { useState } from "react";
import { X, Smartphone, Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: any) => void;
}

export function CustomerAuthModal({ isOpen, onClose, onSuccess }: CustomerAuthModalProps) {
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const [emailMode, setEmailMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Request phone OTP
  const handleRequestPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/customer/login-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      if (data.simulatedCode) {
        setSimulatedCode(data.simulatedCode);
      }
      setPhoneStep("verify");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error requesting code.");
    } finally {
      setLoading(false);
    }
  };

  // Verify phone OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/customer/login-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: otpCode, name }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed.");
      }

      // Store in localStorage for persistent client session across app restarts
      if (typeof window !== "undefined" && data.session?.sessionToken) {
        localStorage.setItem("pp_cust_token", data.session.sessionToken);
      }

      onSuccess(data.session);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification error.");
    } finally {
      setLoading(false);
    }
  };

  // Email authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/customer/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: emailMode, email, password, name }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (typeof window !== "undefined" && data.session?.sessionToken) {
        localStorage.setItem("pp_cust_token", data.session.sessionToken);
      }

      onSuccess(data.session);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface w-full max-w-md rounded-3xl p-6 sm:p-8 border border-brand-border shadow-elevated relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-brand-text-secondary hover:text-brand-text-primary hover:bg-neutral-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-5 border-b border-brand-border">
          <BrandLogo size="sm" variant="full" className="justify-center" />
          <h3 className="mt-3 text-xl font-extrabold text-brand-text-primary tracking-tight">
            Patron Account Access
          </h3>
          <p className="mt-1 text-xs text-brand-text-secondary">
            Keep persistent access to your cinema tickets and bathroom breaks.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tabs: Phone vs Email */}
        <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-brand-bg border border-brand-border">
          <button
            type="button"
            onClick={() => {
              setTab("phone");
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "phone"
                ? "bg-brand-surface text-brand-text-primary shadow-subtle border border-brand-border"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            Phone Number (Recommended)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("email");
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "email"
                ? "bg-brand-surface text-brand-text-primary shadow-subtle border border-brand-border"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            Email & Password
          </button>
        </div>

        {/* Form: Phone Tab */}
        {tab === "phone" && (
          <div className="mt-5">
            {phoneStep === "input" ? (
              <form onSubmit={handleRequestPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-primary mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-brand-text-secondary absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+255 7XX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-brand-text-secondary">
                    We will send a 6-digit OTP code via Africa&apos;s Talking SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                {simulatedCode && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <strong className="font-bold">Test Simulator Code:</strong>{" "}
                    <span className="font-mono font-bold tracking-widest">{simulatedCode}</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-brand-text-primary">
                      Enter 6-Digit Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhoneStep("input")}
                      className="text-[11px] text-brand-primary hover:underline font-semibold"
                    >
                      Change Phone
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-widest rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-primary mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Juma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Access Account</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Form: Email Tab */}
        {tab === "email" && (
          <form onSubmit={handleEmailAuth} className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-brand-border">
              <span className="text-brand-text-secondary">
                {emailMode === "login" ? "Need an account?" : "Already registered?"}
              </span>
              <button
                type="button"
                onClick={() => setEmailMode(emailMode === "login" ? "register" : "login")}
                className="font-bold text-brand-primary hover:underline"
              >
                {emailMode === "login" ? "Create Account" : "Sign In"}
              </button>
            </div>

            {emailMode === "register" && (
              <div>
                <label className="block text-xs font-bold text-brand-text-primary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-brand-text-primary mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-text-secondary absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-primary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-text-secondary absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Note: Phone verification is required before activating Bathroom Mode viewing.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{emailMode === "login" ? "Sign In" : "Register Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* OAuth Divider */}
        <div className="mt-6 pt-5 border-t border-brand-border text-center">
          <span className="text-[11px] text-brand-text-secondary uppercase tracking-wider font-semibold">
            Or Continue With
          </span>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                alert("Google sign-in initialized. Phone verification will be prompted next.");
              }}
              className="py-2.5 px-4 rounded-xl border border-brand-border bg-white hover:bg-neutral-50 text-xs font-semibold text-brand-text-primary flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                alert("Apple sign-in initialized. Phone verification will be prompted next.");
              }}
              className="py-2.5 px-4 rounded-xl border border-brand-border bg-white hover:bg-neutral-50 text-xs font-semibold text-brand-text-primary flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
