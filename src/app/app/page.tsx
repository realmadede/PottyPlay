"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingCarousel } from "@/components/customer/OnboardingCarousel";
import { CustomerAuthModal } from "@/components/customer/CustomerAuthModal";
import { DiscoveryView } from "@/components/customer/DiscoveryView";
import { RemindersView } from "@/components/customer/RemindersView";
import { BathroomView } from "@/components/customer/BathroomView";
import { HistoryView } from "@/components/customer/HistoryView";
import { SettingsView } from "@/components/customer/SettingsView";
import {
  Building2,
  Bell,
  Film,
  History,
  Settings,
  ShieldAlert,
  Loader2,
  Lock,
} from "lucide-react";

type ActiveTab = "discovery" | "reminders" | "bathroom" | "history" | "settings";

interface CustomerProfile {
  customerId: string;
  name: string | null;
  phoneNumber: string | null;
  email: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingDone: boolean;
  themePreference?: string;
}

export default function CustomerApplication() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("bathroom");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"LIGHT" | "DARK" | "SYSTEM">("SYSTEM");

  // Initialize theme from storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("pp_theme") as "LIGHT" | "DARK" | "SYSTEM" | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: "LIGHT" | "DARK" | "SYSTEM") => {
    setCurrentTheme(theme);
    if (typeof window === "undefined") return;
    localStorage.setItem("pp_theme", theme);

    const root = document.documentElement;
    if (theme === "DARK") {
      root.classList.add("dark");
    } else if (theme === "LIGHT") {
      root.classList.remove("dark");
    } else {
      // System
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  // Check persistent session and onboarding status on mount
  useEffect(() => {
    async function initApp() {
      // 1. Check local storage for onboarding completion
      const storedOnboarding = typeof window !== "undefined" ? localStorage.getItem("pp_onboarding_done") : null;

      // 2. Fetch authenticated profile
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("pp_cust_token") : null;
        if (!token) {
          // If unauthenticated, show onboarding if not done, or show auth modal immediately
          if (!storedOnboarding) {
            setShowOnboarding(true);
          } else {
            setAuthModalOpen(true);
          }
          setLoadingProfile(false);
          return;
        }

        const res = await fetch("/api/auth/customer/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.customer) {
            setCustomer(data.customer);
            if (data.customer.themePreference) {
              applyTheme(data.customer.themePreference as any);
            }
            if (!storedOnboarding && !data.customer.onboardingDone) {
              setShowOnboarding(true);
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem("pp_cust_token");
            setAuthModalOpen(true);
          }
        } else {
          localStorage.removeItem("pp_cust_token");
          setAuthModalOpen(true);
        }
      } catch (err) {
        console.error("Profile check error:", err);
        setAuthModalOpen(true);
      } finally {
        setLoadingProfile(false);
      }
    }

    initApp();
  }, []);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_onboarding_done", "true");
    }

    // After onboarding, transition directly to mandatory registration if unauthenticated
    if (!customer) {
      setAuthModalOpen(true);
    } else {
      try {
        const token = localStorage.getItem("pp_cust_token");
        await fetch("/api/auth/customer/onboarding", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (err) {
        console.error("Save onboarding status error:", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("pp_cust_token") : null;
      await fetch("/api/auth/customer/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("pp_cust_token");
      }
      setCustomer(null);
      setAuthModalOpen(true); // Mandatory authentication gating
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-brand-bg text-brand-text-primary p-6">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
          Initializing Secure Session...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-bg text-brand-text-primary min-h-[100dvh]">
      {/* First-Launch Onboarding Carousel */}
      {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}

      {/* Mandatory Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen || (!customer && !showOnboarding)}
        mandatory={!customer}
        onClose={customer ? () => setAuthModalOpen(false) : undefined}
        onSuccess={(session) => {
          setCustomer(session);
          setAuthModalOpen(false);
          if (session.themePreference) {
            applyTheme(session.themePreference);
          }
        }}
      />

      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border px-4 sm:px-6 h-16 flex items-center justify-between">
        <BrandLogo size="sm" variant="full" href="/app" />

        <div className="flex items-center space-x-3">
          {customer && (
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-brand-text-primary">
                  {customer.name || customer.phoneNumber || customer.email}
                </div>
                <div className="text-[10px] text-brand-text-secondary flex items-center justify-end space-x-1">
                  {customer.phoneVerified && customer.emailVerified ? (
                    <span className="text-emerald-700 font-semibold">Account Verified</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Pending Verification</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Tab Content View */}
      {customer ? (
        <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 pb-28">
          {activeTab === "discovery" && <DiscoveryView />}
          {activeTab === "reminders" && <RemindersView />}
          {activeTab === "bathroom" && <BathroomView />}
          {activeTab === "history" && <HistoryView />}
          {activeTab === "settings" && (
            <SettingsView
              customer={customer}
              onLogout={handleLogout}
              onUpdateTheme={applyTheme}
              currentTheme={currentTheme}
            />
          )}
        </main>
      ) : (
        /* Gated State: Unauthenticated user view is strictly blocked until sign-in/registration succeeds */
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 text-brand-primary flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-brand-accent" />
          </div>
          <h2 className="text-xl font-black text-brand-text-primary tracking-tight">
            Account Required
          </h2>
          <p className="mt-2 text-xs text-brand-text-secondary leading-relaxed">
            PottyPlay companion viewing is restricted to authenticated patrons with verified phone numbers. Please complete registration or sign in to continue.
          </p>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="mt-6 py-3 px-6 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary shadow-subtle transition-colors"
          >
            Open Registration & Sign In
          </button>
        </main>
      )}

      {/* Fixed Bottom Mobile Navigation Bar with 5 Tabs */}
      {customer && (
        <nav
          aria-label="Main customer navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border px-1.5 py-1.5 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Tab 1: Cinemas */}
          <button
            type="button"
            onClick={() => setActiveTab("discovery")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "discovery"
                ? "text-brand-text-primary font-bold"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            <Building2 className={`w-5 h-5 ${activeTab === "discovery" ? "text-brand-primary" : ""}`} />
            <span className="text-[10px] mt-0.5">Cinemas</span>
          </button>

          {/* Tab 2: Reminders */}
          <button
            type="button"
            onClick={() => setActiveTab("reminders")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "reminders"
                ? "text-brand-text-primary font-bold"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            <Bell className={`w-5 h-5 ${activeTab === "reminders" ? "text-brand-primary" : ""}`} />
            <span className="text-[10px] mt-0.5">Reminders</span>
          </button>

          {/* Tab 3: Center Golden Button for Bathroom Mode */}
          <button
            type="button"
            onClick={() => setActiveTab("bathroom")}
            className={`flex flex-col items-center py-1.5 px-3.5 rounded-2xl transition-all ${
              activeTab === "bathroom"
                ? "bg-brand-primary text-brand-accent shadow-subtle font-extrabold"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Bathroom</span>
          </button>

          {/* Tab 4: History */}
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "history"
                ? "text-brand-text-primary font-bold"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            <History className={`w-5 h-5 ${activeTab === "history" ? "text-brand-primary" : ""}`} />
            <span className="text-[10px] mt-0.5">History</span>
          </button>

          {/* Tab 5: Settings */}
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "settings"
                ? "text-brand-text-primary font-bold"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === "settings" ? "text-brand-primary" : ""}`} />
            <span className="text-[10px] mt-0.5">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}
