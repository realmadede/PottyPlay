"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Moon,
  Sun,
  Laptop,
  Bell,
  Shield,
  FileText,
  LogOut,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";
import { ReportIssueModal } from "@/components/customer/ReportIssueModal";
import { customerFetch, customerUrl } from "@/lib/customer-mobile-url";
import { NativeMobile } from "@/lib/native-mobile";

interface SettingsViewProps {
  customer: {
    customerId: string;
    name: string | null;
    phoneNumber: string | null;
    email: string | null;
    phoneVerified: boolean;
    emailVerified: boolean;
    themePreference?: string;
    notificationPreferences?: {
      showtimeRemindersEnabled: boolean;
      breakAlertsEnabled: boolean;
    };
  };
  onLogout: (notice?: string) => void;
  onUpdateTheme: (theme: "LIGHT" | "DARK" | "SYSTEM") => void;
  currentTheme: "LIGHT" | "DARK" | "SYSTEM";
  onNavigateToProfile?: () => void;
}

export function SettingsView({
  customer,
  onLogout,
  onUpdateTheme,
  currentTheme,
  onNavigateToProfile,
}: SettingsViewProps) {
  const [theme, setTheme] = useState<"LIGHT" | "DARK" | "SYSTEM">(currentTheme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(customer.notificationPreferences?.showtimeRemindersEnabled ?? true);
  const [breakAlertsEnabled, setBreakAlertsEnabled] = useState(customer.notificationPreferences?.breakAlertsEnabled ?? true);
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const showtimeEnabled = customer.notificationPreferences?.showtimeRemindersEnabled ?? true;
    const breakEnabled = customer.notificationPreferences?.breakAlertsEnabled ?? true;
    setNotificationsEnabled(showtimeEnabled);
    setBreakAlertsEnabled(breakEnabled);
    void NativeMobile.setStorageItem("pp_break_alerts_enabled", String(breakEnabled));
    const refreshPermission = () => {
      void NativeMobile.getNotificationPermission().then(setNotificationPermission);
    };
    refreshPermission();
    let active = true;
    let appStateListener: { remove: () => Promise<void> } | null = null;
    void NativeMobile.onAppStateChange((isActive) => {
      if (active && isActive) refreshPermission();
    }).then((listener) => {
      if (!active) void listener.remove();
      else appStateListener = listener;
    });
    return () => {
      active = false;
      if (appStateListener) void appStateListener.remove();
    };
  }, [customer.customerId, customer.notificationPreferences?.showtimeRemindersEnabled, customer.notificationPreferences?.breakAlertsEnabled]);

  const saveNotificationPreferences = async (
    next: { showtimeRemindersEnabled: boolean; breakAlertsEnabled: boolean },
    previous: { showtimeRemindersEnabled: boolean; breakAlertsEnabled: boolean }
  ) => {
    setMessage(null);
    setNotificationsEnabled(next.showtimeRemindersEnabled);
    setBreakAlertsEnabled(next.breakAlertsEnabled);
    await NativeMobile.setStorageItem("pp_break_alerts_enabled", String(next.breakAlertsEnabled));
    window.dispatchEvent(new CustomEvent("pottyplay:break-alerts-changed", {
      detail: { enabled: next.breakAlertsEnabled },
    }));
    try {
      const response = await customerFetch("/api/auth/customer/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: next }),
      });
      if (!response.ok) throw new Error("Notification preferences could not be saved.");
    } catch (error) {
      setNotificationsEnabled(previous.showtimeRemindersEnabled);
      setBreakAlertsEnabled(previous.breakAlertsEnabled);
      await NativeMobile.setStorageItem("pp_break_alerts_enabled", String(previous.breakAlertsEnabled));
      setMessage(error instanceof Error ? error.message : "Notification preferences could not be saved.");
    }
  };

  const handleBreakAlertsChange = async (enabled: boolean) => {
    const previous = { showtimeRemindersEnabled: notificationsEnabled, breakAlertsEnabled };
    if (enabled && NativeMobile.isNative()) {
      const granted = await NativeMobile.requestNotificationPermission();
      setNotificationPermission(granted);
      const previous = { showtimeRemindersEnabled: notificationsEnabled, breakAlertsEnabled };
      await saveNotificationPreferences({ ...previous, breakAlertsEnabled: enabled }, previous);
      if (!granted) setMessage("Break reminders are turned off. You can enable them in your device settings; notifications are not required to use PottyPlay.");
      return;
    }
    await saveNotificationPreferences({ ...previous, breakAlertsEnabled: enabled }, previous);
  };

  const handleThemeChange = async (newTheme: "LIGHT" | "DARK" | "SYSTEM") => {
    setTheme(newTheme);
    onUpdateTheme(newTheme);

    try {
      await customerFetch("/api/auth/customer/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themePreference: newTheme }),
      });
    } catch {
      // Local fallback already applied
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await customerFetch("/api/auth/customer/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_account" }),
      });

      if (res.ok) {
        onLogout("Deletion confirmed. Account access is revoked. Account identifiers and linked support details are scheduled for anonymization after 30 days; cinema or legally required records may be retained in anonymized form.");
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
      <GlassSurface variant="dock" className="p-5 sm:p-6 border border-line shadow-card">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl flex-shrink-0">
            {customer.name ? customer.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base sm:text-lg text-ink truncate">
              {customer.name || "Cinema Patron"}
            </h3>
            <div className="flex flex-col text-xs text-muted mt-1 space-y-0.5">
              <div className="flex items-center space-x-1.5 truncate">
                <span>{customer.phoneNumber || "No phone linked"}</span>
                {customer.phoneVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center space-x-1.5 truncate">
                <span>{customer.email || "No email linked"}</span>
                {customer.emailVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
              </div>
            </div>

            {onNavigateToProfile && (
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="mt-3 py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold inline-flex items-center space-x-1.5 transition-colors"
              >
                <span>Edit Profile & Security</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </GlassSurface>

      {/* 2. Theme Preferences */}
      <GlassSurface variant="dock" className="p-5 sm:p-6 border border-line shadow-card space-y-3">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          Appearance & Theme
        </h4>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleThemeChange("LIGHT")}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
              theme === "LIGHT"
                ? "bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-sm"
                : "bg-bg border-line text-muted hover:text-ink hover:bg-field-raised"
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
                ? "bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-sm"
                : "bg-bg border-line text-muted hover:text-ink hover:bg-field-raised"
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
                ? "bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-sm"
                : "bg-bg border-line text-muted hover:text-ink hover:bg-field-raised"
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span className="text-xs">System</span>
          </button>
        </div>
        <div className="text-[11px] text-muted pt-1">
          Your appearance preference is saved on this device.
        </div>
      </GlassSurface>

      {/* 3. Notification Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl bg-field border border-line shadow-card space-y-4">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          Notifications & Alerts
        </h4>

        <div className="flex items-center justify-between">
          <div className="pr-4">
            <div className="text-sm font-bold text-ink">Showtime Reminders</div>
            <div className="text-xs text-muted mt-0.5">
              Allow configured ticket reminders by SMS and email before showtime.
            </div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => {
              const previous = { showtimeRemindersEnabled: notificationsEnabled, breakAlertsEnabled };
              void saveNotificationPreferences({ ...previous, showtimeRemindersEnabled: e.target.checked }, previous);
            }}
            className="h-5 w-5 rounded border-line text-amber-500 focus:ring-amber-500 bg-bg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-line">
          <div className="pr-4">
            <div className="text-sm font-bold text-ink">Break Return Warnings</div>
            <div className="text-xs text-muted mt-0.5">
              Get a reminder near the end of an active break.
            </div>
          </div>
          <input
            type="checkbox"
            checked={breakAlertsEnabled}
            onChange={(e) => void handleBreakAlertsChange(e.target.checked)}
            className="h-5 w-5 rounded border-line text-amber-500 focus:ring-amber-500 bg-bg cursor-pointer"
          />
        </div>
        <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
          {notificationPermission === null
            ? "Enable notifications to receive a reminder when your break is nearly over. You can change this preference at any time."
            : notificationPermission
            ? "Notifications are enabled for break reminders on this device. You can change this preference at any time."
            : "Notifications are turned off. You can still use PottyPlay without them."}
        </p>
        {message && <p role="status" className="text-xs text-amber-300">{message}</p>}
      </div>

      {/* 4. Legal & Compliance */}
      <div className="p-5 sm:p-6 rounded-3xl bg-field border border-line shadow-card space-y-2.5">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
          Legal & Privacy
        </h4>

        <a
          href="/privacy/"
          target="_blank"
          className="p-3 rounded-2xl bg-bg border border-line hover:bg-field-raised transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-ink">Privacy Policy</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted" />
        </a>

        <a
          href="/terms/"
          target="_blank"
          className="p-3 rounded-2xl bg-bg border border-line hover:bg-field-raised transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center space-x-2.5">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-ink">Terms of Service</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted" />
        </a>
      </div>

      {/* 5. Support & Feedback */}
      <div className="p-5 sm:p-6 rounded-3xl bg-field border border-line shadow-card space-y-3">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          Support & Feedback
        </h4>

        {/* Dedicated Support Page */}
        <a
          href="/support/"
          className="p-3.5 rounded-2xl bg-bg border border-line hover:bg-field-raised transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-ink">Help Center & Frequently Asked Questions</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
        </a>

        {/* Comment and Report Issue Trigger */}
        <button
          type="button"
          onClick={() => setFeedbackModalOpen(true)}
          className="w-full p-3.5 rounded-2xl bg-bg border border-line hover:bg-field-raised transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-ink">Comment or Report an Issue</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
        </button>

        <div className="p-3.5 rounded-2xl bg-bg border border-line flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-ink">Auditorium Usher Assistance</span>
          </div>
          <span className="text-muted text-[11px]">Ask cinema floor staff</span>
        </div>
      </div>

      {/* Report Issue / Feedback Modal */}
      <ReportIssueModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />

      {/* 6. Account Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-field border border-line shadow-card space-y-3">
        <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          Account Security
        </h4>

        <button
          type="button"
          onClick={() => onLogout()}
          className="w-full py-3 px-4 rounded-xl border border-line text-xs font-bold text-ink hover:bg-field-raised transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4 text-muted" />
          <span>Sign Out</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center space-x-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Request Account Deletion</span>
        </button>
        <a
          href={customerUrl("/account-deletion")}
          className="block text-center text-[11px] text-muted underline underline-offset-2"
        >
          Request deletion without access to the app
        </a>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="rounded-3xl bg-field border border-line shadow-elevated p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink">Request Account Deletion?</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Confirming revokes your account access and active companion sessions immediately. Account identifiers and linked support details are scheduled for anonymization after a 30-day grace period. Cinema, billing, security, or legally required records may be retained in anonymized form.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-line text-xs font-bold text-ink hover:bg-field-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 disabled:opacity-50 flex items-center justify-center space-x-1"
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
