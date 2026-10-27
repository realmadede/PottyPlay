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
import {
  Building2,
  Bell,
  Film,
  History,
  User,
  LogOut,
  ShieldAlert,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

type ActiveTab = "discovery" | "reminders" | "bathroom" | "history";

interface CustomerProfile {
  customerId: string;
  name: string | null;
  phoneNumber: string | null;
  email: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingDone: boolean;
}

export default function CustomerApplication() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("bathroom");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Check persistent session and onboarding status on mount
  useEffect(() => {
    async function initApp() {
      // 1. Check local storage for onboarding
      const storedOnboarding = typeof window !== "undefined" ? localStorage.getItem("pp_onboarding_done") : null;
      if (!storedOnboarding) {
        setShowOnboarding(true);
      }

      // 2. Fetch authenticated profile
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("pp_cust_token") : null;
        const res = await fetch("/api/auth/customer/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.customer) {
            setCustomer(data.customer);
            if (data.customer.onboardingDone) {
              setShowOnboarding(false);
              localStorage.setItem("pp_onboarding_done", "true");
            }
          }
        }
      } catch (err) {
        console.error("Profile check error:", err);
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

    // If authenticated, persist to backend
    if (customer) {
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
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-bg text-brand-text-primary min-h-[100dvh]">
      {/* First-Launch Onboarding Carousel */}
      {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}

      {/* Auth Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(session) => {
          setCustomer(session);
        }}
      />

      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border px-4 sm:px-6 h-16 flex items-center justify-between">
        <BrandLogo size="sm" variant="full" href="/" />

        <div className="flex items-center space-x-3">
          {customer ? (
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-brand-text-primary">
                  {customer.name || customer.phoneNumber || customer.email}
                </div>
                <div className="text-[10px] text-brand-text-secondary flex items-center justify-end space-x-1">
                  {customer.phoneVerified ? (
                    <span className="text-emerald-700 font-semibold">Phone Verified</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Unverified Phone</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-neutral-50 transition-colors"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="py-2 px-3.5 rounded-xl font-bold text-xs bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          <Link
            href="/"
            className="hidden md:inline-flex items-center space-x-1 text-xs text-brand-text-secondary hover:text-brand-text-primary pl-2 border-l border-brand-border"
          >
            <span>Cinema Site</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Unverified Phone Warning Banner */}
      {customer && !customer.phoneVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Verify your phone number to authorize Bathroom Mode viewing.</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="font-bold underline text-amber-900 hover:text-black ml-2"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Main Tab Content View */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 pb-24">
        {activeTab === "discovery" && <DiscoveryView />}
        {activeTab === "reminders" && <RemindersView />}
        {activeTab === "bathroom" && <BathroomView />}
        {activeTab === "history" && <HistoryView />}
      </main>

      {/* Fixed Bottom Mobile Navigation Bar */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border px-2 py-2 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={() => setActiveTab("discovery")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === "discovery"
              ? "text-brand-text-primary font-bold"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          <Building2 className={`w-5 h-5 ${activeTab === "discovery" ? "text-brand-primary" : ""}`} />
          <span className="text-[10px] mt-1">Cinemas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === "reminders"
              ? "text-brand-text-primary font-bold"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          <Bell className={`w-5 h-5 ${activeTab === "reminders" ? "text-brand-primary" : ""}`} />
          <span className="text-[10px] mt-1">Reminders</span>
        </button>

        {/* Center Golden Button for Bathroom Mode */}
        <button
          type="button"
          onClick={() => setActiveTab("bathroom")}
          className={`flex flex-col items-center py-1 px-4 rounded-2xl transition-all ${
            activeTab === "bathroom"
              ? "bg-brand-primary text-brand-accent shadow-subtle font-extrabold"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Bathroom</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === "history"
              ? "text-brand-text-primary font-bold"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === "history" ? "text-brand-primary" : ""}`} />
          <span className="text-[10px] mt-1">History</span>
        </button>
      </nav>
    </div>
  );
}
