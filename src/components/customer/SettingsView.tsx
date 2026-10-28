"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Sun,
  Moon,
  Laptop,
  Bell,
  Shield,
  FileText,
  HelpCircle,
  Star,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface CustomerProfile {
  customerId: string;
  name: string | null;
  phoneNumber: string | null;
  email: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  themePreference?: string;
}

interface SettingsViewProps {
  customer: CustomerProfile;
  onLogout: () => void;
  onUpdateTheme: (theme: "LIGHT" | "DARK" | "SYSTEM") => void;
  currentTheme: "LIGHT" | "DARK" | "SYSTEM";
}

export function SettingsView({
  customer,
  onLogout,
  onUpdateTheme,
  currentTheme,
}: SettingsViewProps) {
  const [theme, setTheme] = useState<"LIGHT" | "DARK" | "SYSTEM">(currentTheme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationAlerts, setVibrationAlerts] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Sync theme changes
  const handleThemeChange = async (newTheme: "LIGHT" | "DARK" | "SYSTEM") => {
    setTheme(newTheme);
    onUpdateTheme(newTheme);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pp_cust_token") : null;
      await fetch("/api/auth/customer/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "theme", theme: newTheme }),
      });
    } catch (err) {
      console.error("Failed to persist theme preference:", err);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pp_cust_token") : null;
      const res = await fetch("/api/auth/customer/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "delete_account" }),
      });

      if (res.ok) {
        onLogout();
      } else {
        setMessage("Failed to submit deletion request. Please contact support.");
      }
    } catch {
      setMessage("Error submitting deletion request.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto text-left pb-12">
      {/* 1. Profile Overview */}
      <div className="p-5 sm:p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-subtle">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 text-brand-primary flex items-center justify-center font-black text-xl flex-shrink-0">
            {customer.name ? customer.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base sm:text-lg text-brand-text-primary truncate">
              {customer.name || "Cinema Patron"}
            </h3>
            <div className="flex flex-col text-xs text-brand-text-secondary mt-1 space-y-0.5">
              <div className="flex items-center space-x-1.5 truncate">
                <span>{customer.phoneNumber || "No phone linked"}</span>
                {customer.phoneVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <span>{customer.email || "No email linked"}</span>
                {customer.emailVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Theme Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-subtle space-y-3">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
          Appearance & Theme
        </h4>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleThemeChange("LIGHT")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
              theme === "LIGHT"
                ? "bg-brand-primary/15 border-brand-primary text-brand-text-primary font-bold shadow-subtle"
                : "bg-brand-bg border-brand-border text-brand-text-secondary hover:bg-neutral-50"
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs">Light</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("DARK")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
              theme === "DARK"
                ? "bg-brand-accent text-white border-brand-primary font-bold shadow-subtle"
                : "bg-brand-bg border-brand-border text-brand-text-secondary hover:bg-neutral-50"
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs">Dark</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("SYSTEM")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
              theme === "SYSTEM"
                ? "bg-brand-primary/15 border-brand-primary text-brand-text-primary font-bold shadow-subtle"
                : "bg-brand-bg border-brand-border text-brand-text-secondary hover:bg-neutral-50"
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span className="text-xs">System</span>
          </button>
        </div>
        <div className="text-[11px] text-brand-text-secondary pt-1">
          Theme preference persists across browser sessions and native mobile app launches without flashing.
        </div>
      </div>

      {/* 3. Notification Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-subtle space-y-4">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
          Notifications & Alerts
        </h4>

        <div className="flex items-center justify-between">
          <div className="pr-4">
            <div className="text-sm font-bold text-brand-text-primary">Showtime Reminders</div>
            <div className="text-xs text-brand-text-secondary mt-0.5">
              Receive alert 30 minutes before your ticketed screening begins.
            </div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-brand-border/60">
          <div className="pr-4">
            <div className="text-sm font-bold text-brand-text-primary">Break Return Warnings</div>
            <div className="text-xs text-brand-text-secondary mt-0.5">
              Gentle vibration chime at 12 and 14 minutes during bathroom breaks.
            </div>
          </div>
          <input
            type="checkbox"
            checked={vibrationAlerts}
            onChange={(e) => setVibrationAlerts(e.target.checked)}
            className="h-5 w-5 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Legal & Compliance */}
      <div className="p-5 sm:p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-subtle space-y-2.5">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-2">
          Legal & Privacy
        </h4>

        <Link
          href="/privacy"
          target="_blank"
          className="p-3 rounded-2xl bg-brand-bg border border-brand-border hover:bg-neutral-50 transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-brand-secondary" />
            <span className="font-semibold text-brand-text-primary">Privacy Policy</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-brand-text-secondary" />
        </Link>

        <Link
          href="/terms"
          target="_blank"
          className="p-3 rounded-2xl bg-brand-bg border border-brand-border hover:bg-neutral-50 transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center space-x-2.5">
            <FileText className="w-4 h-4 text-brand-secondary" />
            <span className="font-semibold text-brand-text-primary">Terms of Service</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-brand-text-secondary" />
        </Link>
      </div>

      {/* 5. Support & Feedback */}
      <div className="p-5 sm:p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-subtle space-y-3">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
          Support & App Rating
        </h4>

        {/* Rate Application action */}
        <div className="p-3.5 rounded-2xl bg-brand-bg border border-brand-border text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-brand-text-primary">Rate PottyPlay</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white px-2 py-0.5 rounded border border-brand-border">
              Pending Store Release
            </span>
          </div>
          <p className="text-[11px] text-brand-text-secondary leading-relaxed">
            The native store listing is awaiting certification by our theater pilot partner. Rating links will become active when published on Google Play and Apple App Store.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-brand-secondary" />
            <span className="font-bold text-brand-text-primary">Usher Assistance</span>
          </div>
          <span className="text-neutral-500 text-[11px]">Ask cinema floor staff</span>
        </div>
      </div>

      {/* 6. Account Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-subtle space-y-3">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
          Account Security
        </h4>

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl border border-brand-border text-xs font-bold text-brand-text-primary hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4 text-brand-text-secondary" />
          <span>Sign Out</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center space-x-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Request Account Deletion</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-accent/80 backdrop-blur-sm">
          <div className="rounded-3xl bg-white border border-brand-border shadow-elevated p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary">Request Account Deletion?</h3>
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              In compliance with the Personal Data Protection Act, 2022, all your personal details, verified phone records, and viewing history will be queued for permanent erasure.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-brand-border text-xs font-bold text-brand-text-primary hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Deletion</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
