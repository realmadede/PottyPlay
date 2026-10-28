"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Smartphone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { CustomerAuthSession } from "@/features/auth/customer-auth-service";

interface ProfileViewProps {
  customer: CustomerAuthSession;
  onUpdateCustomer: (updated: CustomerAuthSession) => void;
}

export function ProfileView({ customer, onUpdateCustomer }: ProfileViewProps) {
  // 1. Name state
  const [name, setName] = useState(customer.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // 2. Email state (Strict Verification)
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailChallengeActive, setEmailChallengeActive] = useState(false);
  const [simulatedEmailCode, setSimulatedEmailCode] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // 3. Phone state (Strict SMS OTP Verification)
  const [newPhone, setNewPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneChallengeId, setPhoneChallengeId] = useState<string | null>(null);
  const [phoneChallengeActive, setPhoneChallengeActive] = useState(false);
  const [simulatedPhoneCode, setSimulatedPhoneCode] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // 4. Password state (Strict Verification with toggling eye buttons)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const getAuthToken = () => {
    return typeof window !== "undefined" ? localStorage.getItem("pp_cust_token") : null;
  };

  // Handler 1: Update Name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameError(null);
    setNameSuccess(null);

    const token = getAuthToken();
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "update_name", name }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update full name.");
      }

      setNameSuccess("Full name updated successfully.");
      if (json.customer) {
        onUpdateCustomer(json.customer);
      }
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Name update failed.");
    } finally {
      setNameLoading(false);
    }
  };

  // Handler 2a: Request Email Change
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    const token = getAuthToken();
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "request_email_change", newEmail }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to initiate email change.");
      }

      setEmailChallengeActive(true);
      if (json.simulatedCode) {
        setSimulatedEmailCode(json.simulatedCode);
      }
      setEmailSuccess("Verification code sent to your new email address.");
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Email change request failed.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler 2b: Confirm Email Change
  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    const token = getAuthToken();
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "confirm_email_change",
          newEmail,
          code: emailCode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Invalid email verification code.");
      }

      setEmailSuccess("Email address successfully verified and updated.");
      setEmailChallengeActive(false);
      setNewEmail("");
      setEmailCode("");
      setSimulatedEmailCode(null);
      if (json.customer) {
        onUpdateCustomer(json.customer);
      }
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Email confirmation failed.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler 3a: Request Phone Change
  const handleRequestPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    const token = getAuthToken();
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "request_phone_change", newPhone }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to dispatch verification SMS.");
      }

      setPhoneChallengeId(json.challengeId);
      setPhoneChallengeActive(true);
      if (json.simulatedCode) {
        setSimulatedPhoneCode(json.simulatedCode);
      }
      setPhoneSuccess("SMS OTP dispatched via Africa's Talking.");
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Phone change request failed.");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handler 3b: Confirm Phone Change
  const handleConfirmPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneChallengeId) return;

    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    const token = getAuthToken();
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "confirm_phone_change",
          newPhone,
          challengeId: phoneChallengeId,
          code: phoneCode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Invalid SMS verification code.");
      }

      setPhoneSuccess("Phone number successfully verified and updated.");
      setPhoneChallengeActive(false);
      setNewPhone("");
      setPhoneCode("");
      setPhoneChallengeId(null);
      setSimulatedPhoneCode(null);
      if (json.customer) {
        onUpdateCustomer(json.customer);
      }
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Phone confirmation failed.");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handler 4: Change Password (Strict verification of current password)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match. Please re-enter.");
      return;
    }

    setPasswordLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch("/api/auth/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "change_password",
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update security password.");
      }

      setPasswordSuccess("Security password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-field border border-line shadow-card flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xl flex-shrink-0">
          {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-black text-ink tracking-tight truncate">
              {customer.name || "Authenticated Patron"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              Account Verified
            </span>
            <span className="text-[11px] text-muted font-mono truncate">
              {customer.email || customer.phoneNumber}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 1: Full Name */}
      <div className="p-6 rounded-3xl bg-field border border-line shadow-card space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-line">
          <User className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-ink">Personal Profile Name</h2>
            <p className="text-[11px] text-muted">The name printed on tickets and companion sessions.</p>
          </div>
        </div>

        {nameSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{nameSuccess}</span>
          </div>
        )}
        {nameError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{nameError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateName} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Juma Mwanamvua"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={nameLoading || name === (customer.name || "")}
            className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all shadow-sm"
          >
            {nameLoading ? "Saving..." : "Save Name"}
          </button>
        </form>
      </div>

      {/* CARD 2: Email Address (Strict Verification) */}
      <div className="p-6 rounded-3xl bg-field border border-line shadow-card space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-line">
          <Mail className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-ink">Email Address</h2>
            <p className="text-[11px] text-muted">Requires verification code sent to new email.</p>
          </div>
        </div>

        <div className="text-xs space-y-1">
          <span className="text-muted block">Current Verified Email:</span>
          <span className="font-mono font-bold text-ink text-sm bg-bg px-3 py-1.5 rounded-xl border border-line inline-block">
            {customer.email || "No email assigned"}
          </span>
        </div>

        {emailSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{emailSuccess}</span>
          </div>
        )}
        {emailError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{emailError}</span>
          </div>
        )}

        {simulatedEmailCode && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <strong className="block font-bold">Simulator / Test Verification Code:</strong>
            <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
              {simulatedEmailCode}
            </span>
          </div>
        )}

        {!emailChallengeActive ? (
          <form onSubmit={handleRequestEmailChange} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                New Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new.email@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading || !newEmail.trim()}
              className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all shadow-sm"
            >
              {emailLoading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmEmailChange} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                6-Digit Code sent to {newEmail}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm font-mono tracking-widest text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={emailLoading || emailCode.length < 6}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all shadow-sm"
              >
                {emailLoading ? "Verifying..." : "Confirm & Update Email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailChallengeActive(false);
                  setEmailCode("");
                  setSimulatedEmailCode(null);
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-bg border border-line text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CARD 3: Phone Number (Strict SMS Verification) */}
      <div className="p-6 rounded-3xl bg-field border border-line shadow-card space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-line">
          <Smartphone className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-ink">Phone Number</h2>
            <p className="text-[11px] text-muted">Verified via Africa&apos;s Talking SMS Gateway.</p>
          </div>
        </div>

        <div className="text-xs space-y-1">
          <span className="text-muted block">Current Verified Phone:</span>
          <span className="font-mono font-bold text-ink text-sm bg-bg px-3 py-1.5 rounded-xl border border-line inline-block">
            {customer.phoneNumber || "No phone assigned"}
          </span>
        </div>

        {phoneSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{phoneSuccess}</span>
          </div>
        )}
        {phoneError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{phoneError}</span>
          </div>
        )}

        {simulatedPhoneCode && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <strong className="block font-bold">SMS OTP Simulator Code:</strong>
            <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
              {simulatedPhoneCode}
            </span>
          </div>
        )}

        {!phoneChallengeActive ? (
          <form onSubmit={handleRequestPhoneChange} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                New Phone Number
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+255 712 345 678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={phoneLoading || !newPhone.trim()}
              className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all shadow-sm"
            >
              {phoneLoading ? "Dispatching SMS..." : "Send SMS OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmPhoneChange} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                6-Digit SMS Code sent to {newPhone}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-sm font-mono tracking-widest text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={phoneLoading || phoneCode.length < 6}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all shadow-sm"
              >
                {phoneLoading ? "Verifying..." : "Confirm & Update Phone"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneChallengeActive(false);
                  setPhoneCode("");
                  setSimulatedPhoneCode(null);
                }}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-bg border border-line text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CARD 4: Security & Password (Strict Verification with toggling eye buttons) */}
      <div className="p-6 rounded-3xl bg-field border border-line shadow-card space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-line">
          <Lock className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-ink">Account Security & Password</h2>
            <p className="text-[11px] text-muted">Strict verification requires your current password.</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}
        {passwordError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 transition-colors focus:outline-none"
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              New Password (Minimum 8 Characters) *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 transition-colors focus:outline-none"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-line bg-bg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all shadow-sm"
          >
            {passwordLoading ? "Verifying & Updating..." : "Update Security Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
