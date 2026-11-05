"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { GlassSurface } from "@/components/GlassSurface";
import { TabBar, Button as GlisseButton } from "@/components/glisse";
import { OnboardingCarousel } from "@/components/customer/OnboardingCarousel";
import { CustomerAuthModal } from "@/components/customer/CustomerAuthModal";
import { DiscoveryView } from "@/components/customer/DiscoveryView";
import { RemindersView } from "@/components/customer/RemindersView";
import { BathroomView } from "@/components/customer/BathroomView";
import { HistoryView } from "@/components/customer/HistoryView";
import { SettingsView } from "@/components/customer/SettingsView";
import { ProfileView } from "@/components/customer/ProfileView";
import {
  Building2,
  Bell,
  Film,
  History,
  Settings,
  ShieldAlert,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PrivacyScreen } from "@capacitor-community/privacy-screen";
import { NativeMobile } from "@/lib/native-mobile";
import { customerFetch } from "@/lib/customer-mobile-url";

type ActiveTab = "discovery" | "reminders" | "bathroom" | "history" | "profile" | "settings";

interface CustomerProfile {
  customerId: string;
  name: string | null;
  phoneNumber: string | null;
  email: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  onboardingDone: boolean;
  themePreference?: string;
  notificationPreferences?: {
    showtimeRemindersEnabled: boolean;
    breakAlertsEnabled: boolean;
  };
}

export default function CustomerApplication() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("bathroom");

  const handleTabChange = (tab: ActiveTab) => {
    NativeMobile.triggerHaptic(tab === "bathroom" ? "medium" : "light");
    setActiveTab(tab);
  };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const authNoticeRef = useRef<string | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const customerRef = useRef(customer);
  customerRef.current = customer;
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"LIGHT" | "DARK" | "SYSTEM">("SYSTEM");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    authNoticeRef.current = authNotice;
  }, [authNotice]);

  // Monitor network connectivity via NativeMobile
  useEffect(() => {
    NativeMobile.getNetworkStatus().then((status) => {
      setIsOffline(!status.connected);
    });
    const sub = NativeMobile.onNetworkStatusChange((status) => {
      setIsOffline(!status.connected);
    });
    return () => sub.remove();
  }, []);

  // Hardware back button handler for Android
  useEffect(() => {
    const sub = NativeMobile.onHardwareBack(() => {
      if (authModalOpen && customer && !authNotice) {
        setAuthModalOpen(false);
        return true;
      }
      if (showOnboarding && customer) {
        setShowOnboarding(false);
        return true;
      }
      if (activeTab !== "bathroom") {
        setActiveTab("bathroom");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [authModalOpen, authNotice, customer, showOnboarding, activeTab]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setAuthNotice("Your session expired. Sign in again to continue; your current screen and unsent form fields will remain open.");
      setAuthModalOpen(true);
    };
    window.addEventListener("pottyplay:session-expired", handleSessionExpired);
    return () => window.removeEventListener("pottyplay:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    const handleAppUrl = (rawUrl: string) => {
      try {
        const url = new URL(rawUrl);
        const route = url.pathname.replace(/\/+$/, "") || "/";
        const pathClaim = route.startsWith("/claim/") ? route.slice("/claim/".length) : "";
        const claim = url.searchParams.get("claim") || url.searchParams.get("ticket") || pathClaim;

        if (route === "/app" || route === "/watch" || route.startsWith("/claim/")) {
          setActiveTab("bathroom");
          if (claim) {
            void NativeMobile.setStorageItem("pp_pending_ticket", claim);
            window.dispatchEvent(new CustomEvent("pottyplay:ticket-claim", { detail: claim }));
          }
          if (!customerRef.current && claim && !authNoticeRef.current) {
            setAuthNotice("Sign in to verify the ticket linked from your cinema QR code.");
          }
        }
      } catch {
        // Ignore malformed external URLs.
      }
    };

    let active = true;
    let listener: { remove: () => Promise<void> } | null = null;
    void NativeMobile.onAppUrlOpen((url) => {
      if (active) handleAppUrl(url);
    }).then((registered) => {
      listener = registered;
      if (!active) void registered.remove();
    });
    void NativeMobile.getLaunchUrl().then((url) => {
      if (active && url) handleAppUrl(url);
    });

    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, []);

  // Initialize theme from storage
  useEffect(() => {
    async function loadTheme() {
      const savedTheme = (await NativeMobile.getStorageItem("pp_theme")) as "LIGHT" | "DARK" | "SYSTEM" | null;
      if (savedTheme) {
        applyTheme(savedTheme);
      }
    }
    loadTheme();
  }, []);

  const applyTheme = (theme: "LIGHT" | "DARK" | "SYSTEM") => {
    setCurrentTheme(theme);
    NativeMobile.setStorageItem("pp_theme", theme);

    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "DARK") {
      root.classList.add("dark");
      root.removeAttribute("data-theme");
    } else if (theme === "LIGHT") {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    } else {
      // System
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isSystemDark) {
        root.classList.add("dark");
        root.removeAttribute("data-theme");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    }
  };

  // Check persistent session and onboarding status on mount
  useEffect(() => {
    // Enforce OS-level screenshot and screen recording blocking on native Android / iOS
    if (Capacitor.isNativePlatform() && !window.POTTYPLAY_EMULATOR_DEV) {
      PrivacyScreen.enable().catch(() => {});
    }

    async function initApp() {
      // 1. Instant offline-first cache hydration from native secure preferences
      const storedOnboarding = await NativeMobile.getStorageItem("pp_onboarding_done");
      const cachedProfile = await NativeMobile.getStorageItem("pp_cust_profile");
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          setCustomer(parsed);
          setLoadingProfile(false);
          if (parsed.themePreference) {
            applyTheme(parsed.themePreference as any);
          }
        } catch {
          // silent fallback
        }
      }

      // 2. Fetch authenticated profile
      try {
        const token = await NativeMobile.getStorageItem("pp_cust_token");
        if (!token) {
          if (!storedOnboarding) {
            setShowOnboarding(true);
          } else {
            setAuthModalOpen(true);
          }
          setLoadingProfile(false);
          return;
        }

        const res = await customerFetch("/api/auth/customer/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.customer) {
            setCustomer(data.customer);
            await NativeMobile.setStorageItem("pp_cust_profile", JSON.stringify(data.customer));
            if (data.customer.themePreference) {
              applyTheme(data.customer.themePreference as any);
            }
            if (!storedOnboarding && !data.customer.onboardingDone) {
              setShowOnboarding(true);
            }
          } else {
            await NativeMobile.removeStorageItem("pp_cust_token");
            await NativeMobile.removeStorageItem("pp_cust_profile");
            setAuthModalOpen(true);
          }
        } else if (res.status === 401) {
          await NativeMobile.removeStorageItem("pp_cust_token");
          await NativeMobile.removeStorageItem("pp_cust_profile");
          setAuthModalOpen(true);
        }
      } catch (err) {
        // Network offline: maintain cached profile
        setIsOffline(true);
      } finally {
        setLoadingProfile(false);
      }
    }

    initApp();
  }, []);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await NativeMobile.setStorageItem("pp_onboarding_done", "true");

    // After onboarding, transition directly to mandatory registration if unauthenticated
    if (!customer) {
      setAuthModalOpen(true);
    } else {
      try {
        const token = await NativeMobile.getStorageItem("pp_cust_token");
        await customerFetch("/api/auth/customer/onboarding", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (err) {
        console.error("Save onboarding status error:", err);
      }
    }
  };

  const handleLogout = async (notice?: string) => {
    setAuthNotice(notice || null);
    const token = await NativeMobile.getStorageItem("pp_cust_token");
    if (token && !notice) {
      try {
        await customerFetch("/api/auth/customer/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Local credentials must still be removed if the server is unreachable.
      }
    }
    await NativeMobile.removeStorageItem("pp_cust_token");
    await NativeMobile.removeStorageItem("pp_cust_profile");
    setCustomer(null);
    setAuthModalOpen(true);
  };

  if (loadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-bg text-ink p-6 selection:bg-amber-500 selection:text-neutral-950">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Initializing Secure Session...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg text-ink min-h-[100dvh] selection:bg-amber-500 selection:text-neutral-950">
      {/* First-Launch Onboarding Carousel */}
      {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}

      {/* Mandatory Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen || (!customer && !showOnboarding)}
        mandatory={!customer || Boolean(authNotice)}
        notice={authNotice}
        onClose={customer && !authNotice ? () => setAuthModalOpen(false) : undefined}
        onSuccess={(session) => {
          setAuthNotice(null);
          setCustomer(session);
          setAuthModalOpen(false);
          if (session.themePreference) {
            applyTheme(session.themePreference);
          }
        }}
      />

      {/* Top Application Bar */}
      <GlassSurface variant="dock" className="sticky top-0 z-40 border-b border-white/10 px-4 sm:px-6 pt-safe min-h-16 flex items-center justify-between">
        <BrandLogo size="sm" variant="full" href="" />

        <div className="flex items-center space-x-2 sm:space-x-3">
          {isOffline && (
            <span className="hidden min-[380px]:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Offline
            </span>
          )}
          {customer && (
            <button
              type="button"
              onClick={() => handleTabChange("profile")}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-field border border-transparent hover:border-line transition-all text-left"
              title="View Account Profile"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-ink truncate max-w-[140px]">
                  {customer.name || customer.phoneNumber || customer.email}
                </div>
                <div className="text-[10px] text-muted flex items-center justify-end space-x-1">
                  {customer.phoneVerified && customer.emailVerified ? (
                    <span className="text-emerald-400 font-semibold">Verified</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Pending</span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>
      </GlassSurface>

      {/* Main Tab Content View */}
      {customer ? (
        <main className="flex-1 max-w-4xl lg:max-w-5xl mx-auto w-full p-3 min-[380px]:p-4 sm:p-6 pb-28 md:pb-32">
          {activeTab === "discovery" && <DiscoveryView />}
          {activeTab === "reminders" && <RemindersView />}
          {activeTab === "bathroom" && <BathroomView />}
          {activeTab === "history" && <HistoryView />}
          {activeTab === "profile" && (
            <ProfileView
              customer={customer as any}
              onUpdateCustomer={(updated) => setCustomer(updated as any)}
            />
          )}
          {activeTab === "settings" && (
            <SettingsView
              customer={customer}
              onLogout={handleLogout}
              onUpdateTheme={applyTheme}
              currentTheme={currentTheme}
              onNavigateToProfile={() => handleTabChange("profile")}
            />
          )}
        </main>
      ) : (
        /* Gated State: Unauthenticated user view is strictly blocked until sign-in/registration succeeds */
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-ink tracking-tight">
            Account Required
          </h2>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Sign in and verify your phone number to start a cinema break.
          </p>
          <GlisseButton
            variant="filled"
            onClick={() => setAuthModalOpen(true)}
            className="mt-6 font-black text-xs shadow-sm"
          >
            Open Registration & Sign In
          </GlisseButton>
        </main>
      )}

      {/* Fixed Floating Bottom Mobile Navigation Dock with Glisse Liquid Glass TabBar */}
      {customer && (
        <div className="fixed bottom-safe-dock left-2 right-2 min-[380px]:left-4 min-[380px]:right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md md:max-w-lg w-auto z-40 flex justify-center">
          <TabBar
            aria-label="Main customer navigation"
            items={[
              { value: "discovery", label: "Cinemas", icon: <Building2 className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { value: "reminders", label: "Reminders", icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { value: "bathroom", label: "Break", icon: <Film className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { value: "history", label: "History", icon: <History className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { value: "profile", label: "Account", icon: <User className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { value: "settings", label: "Settings", icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> },
            ]}
            value={activeTab}
            onValueChange={(val) => handleTabChange(val as ActiveTab)}
            className="w-full max-w-lg shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
}
