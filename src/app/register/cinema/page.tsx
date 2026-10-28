"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Sliders,
} from "lucide-react";

interface InvitationData {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  city: string | null;
  country: string;
  screensCount: number;
  ticketingSystem: string | null;
  screeningServer: string | null;
  expiresAt: string;
}

function CinemaRegistrationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form State
  const [venueLocation, setVenueLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [ticketingSystem, setTicketingSystem] = useState("Vista Cinema POS");
  const [screeningSystem, setScreeningSystem] = useState("Dolby IMS3000 TMS");
  const [screenName, setScreenName] = useState("Main Auditorium Screen 1");
  const [totalSeats, setTotalSeats] = useState(120);
  const [managerName, setManagerName] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifyError("No invitation token provided. Please verify the link in your email.");
      setVerifying(false);
      return;
    }

    fetch(`/api/cinemas/verify-invitation?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.invitation) {
          setInvitation(json.invitation);
          setVenueLocation(json.invitation.city ? `${json.invitation.city}, ${json.invitation.country}` : "Dar es Salaam, Tanzania");
          setContactPhone(json.invitation.contactPhone || "");
          setManagerName(json.invitation.contactName || "");
          if (json.invitation.ticketingSystem) setTicketingSystem(json.invitation.ticketingSystem);
          if (json.invitation.screeningServer) setScreeningSystem(json.invitation.screeningServer);
        } else {
          setVerifyError(json.error || "Invitation link is invalid or has expired.");
        }
      })
      .catch(() => {
        setVerifyError("Failed to verify invitation link. Please check your network connection.");
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (managerPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please re-enter your security password.");
      return;
    }

    if (managerPassword.length < 8) {
      setFormError("Password must be at least 8 characters in length.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/cinemas/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          venueLocation,
          contactPhone,
          ticketingSystem,
          screeningSystem,
          screenName,
          totalSeats: Number(totalSeats),
          managerName,
          managerPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to complete cinema registration.");
      }

      setRegistrationSuccess(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Registration error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Verifying Official Cinema Invitation...
        </span>
      </div>
    );
  }

  if (verifyError || !invitation) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <div className="max-w-md w-full bg-field border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-ink tracking-tight">
            Invitation Expired or Invalid
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            {verifyError || "This cinema registration invitation link has expired or has already been completed. Invitation links remain valid for 48 hours from dispatch."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold bg-field-raised text-ink border border-line hover:bg-bg transition-colors"
            >
              Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <div className="max-w-md w-full bg-field border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-ink tracking-tight">
            Cinema Circuit Registered!
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            Congratulations! <strong className="text-ink">{invitation.organizationName}</strong> and your floor manager account have been provisioned in the platform database.
          </p>
          <div className="p-3.5 rounded-xl bg-bg border border-line text-xs text-left text-muted space-y-1">
            <div><strong className="text-ink">Manager Email:</strong> {invitation.contactEmail}</div>
            <div><strong className="text-ink">Screen:</strong> {screenName} ({totalSeats} Seats)</div>
            <div><strong className="text-ink">Next Step:</strong> Sign in at the Operator Portal</div>
          </div>
          <div className="pt-2">
            <Link
              href="/operator"
              className="w-full py-3 px-4 rounded-xl font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 shadow-sm"
            >
              <Sliders className="w-4 h-4" />
              <span>Proceed to Operator Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-amber-500 selection:text-neutral-950">
      <div className="w-full max-w-xl bg-field border border-line rounded-3xl p-6 sm:p-8 shadow-card text-left space-y-6">
        {/* Header */}
        <div className="border-b border-line pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <Building2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Exhibitor Partner Onboarding
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Register {invitation.organizationName}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Authorized via expiring invitation link for {invitation.contactEmail}
            </p>
          </div>
          <BrandLogo size="sm" variant="icon" />
        </div>

        {formError && (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Cinema Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Organization Name
              </label>
              <input
                type="text"
                disabled
                value={invitation.organizationName}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg/50 text-muted text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Contact Email
              </label>
              <input
                type="email"
                disabled
                value={invitation.contactEmail}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg/50 text-muted text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Venue Address & City *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. City Center, Dar es Salaam"
                value={venueLocation}
                onChange={(e) => setVenueLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Contact Telephone *
              </label>
              <input
                type="tel"
                required
                placeholder="+255 7XX XXX XXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Infrastructure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Ticketing System POS
              </label>
              <select
                value={ticketingSystem}
                onChange={(e) => setTicketingSystem(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Vista Cinema POS">Vista Cinema POS</option>
                <option value="Veezi Cloud POS">Veezi Cloud POS</option>
                <option value="RTS POS">RTS POS</option>
                <option value="Custom Proprietary POS">Custom Proprietary POS</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Screening Server (TMS)
              </label>
              <select
                value={screeningSystem}
                onChange={(e) => setScreeningSystem(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Dolby IMS3000 TMS">Dolby IMS3000 TMS</option>
                <option value="Christie IMB-S2">Christie IMB-S2</option>
                <option value="GDC SX-4000">GDC SX-4000</option>
                <option value="Sony SRX Server">Sony SRX Server</option>
              </select>
            </div>
          </div>

          {/* Primary Screen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Auditorium Screen Name *
              </label>
              <input
                type="text"
                required
                placeholder="Screen 1"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Total Seats *
              </label>
              <input
                type="number"
                required
                min={1}
                value={totalSeats}
                onChange={(e) => setTotalSeats(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Manager Account Setup */}
          <div className="pt-3 border-t border-line space-y-3">
            <div className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
              Configure Manager Credentials (For /operator Sign In)
            </div>
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                Manager Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cinema Floor Manager"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                  Set Security Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer z-10 flex items-center justify-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 pointer-events-none" />
                    ) : (
                      <Eye className="w-4 h-4 pointer-events-none" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-muted/50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirmPassword((prev) => !prev);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer z-10 flex items-center justify-center"
                    aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 pointer-events-none" />
                    ) : (
                      <Eye className="w-4 h-4 pointer-events-none" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-line">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Circuit...</span>
                </>
              ) : (
                <>
                  <span>Complete Cinema Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CinemaRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Loading Registration Portal...
          </span>
        </div>
      }
    >
      <CinemaRegistrationContent />
    </Suspense>
  );
}
