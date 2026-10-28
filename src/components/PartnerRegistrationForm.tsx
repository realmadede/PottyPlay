"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Building2, Mail, Phone, MapPin, Monitor } from "lucide-react";

export function PartnerRegistrationForm() {
  const [formData, setFormData] = useState({
    organizationName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    country: "Tanzania",
    venueCount: 1,
    screensCount: 4,
    ticketingSystem: "Vista",
    screeningServer: "Dolby TMS",
    technicalContactEmail: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit partner application.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while submitting.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-brand-surface border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center shadow-card max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-extrabold text-brand-text-primary tracking-tight">
          Application Received
        </h3>
        <p className="mt-3 text-sm text-brand-text-secondary leading-relaxed">
          Thank you for registering <strong className="text-brand-text-primary">{formData.organizationName}</strong>.
          Our cinema partnership and technical solutions team will review your theater details and contact you at <strong className="text-brand-text-primary">{formData.contactEmail}</strong> to schedule an integration consultation.
        </p>
        <div className="mt-6 p-4 rounded-xl bg-brand-bg border border-brand-border text-xs text-left text-brand-text-secondary space-y-1">
          <div><strong className="text-brand-text-primary">Next Step:</strong> Administrative Review & Compatibility Check</div>
          <div><strong className="text-brand-text-primary">Turnaround:</strong> Within 1 to 2 business days</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setFormData({
              organizationName: "",
              contactName: "",
              contactEmail: "",
              contactPhone: "",
              city: "",
              country: "Tanzania",
              venueCount: 1,
              screensCount: 4,
              ticketingSystem: "Vista",
              screeningServer: "Dolby TMS",
              technicalContactEmail: "",
              notes: "",
            });
          }}
          className="mt-6 py-2.5 px-5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-text-primary hover:bg-neutral-50"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-10 shadow-elevated max-w-3xl mx-auto text-left">
      <div className="border-b border-brand-border pb-6 mb-6">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-text-primary tracking-tight">
          Cinema Partner Application
        </h3>
        <p className="mt-2 text-sm text-brand-text-secondary leading-relaxed">
          Apply to pilot or deploy PottyPlay across your cinema auditoriums. We integrate directly with your existing POS ticketing and theater management systems.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Cinema Organization / Circuit *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cinema Circuit, Premier Theaters"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Authorized Contact Person *
            </label>
            <input
              type="text"
              required
              placeholder="Full name & title"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Business Email *
            </label>
            <input
              type="email"
              required
              placeholder="operations@cinemagroup.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Direct Phone / WhatsApp *
            </label>
            <input
              type="tel"
              required
              placeholder="+255 7XX XXX XXX"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Location & Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Primary City *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dar es Salaam, Nairobi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Total Venues
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.venueCount}
              onChange={(e) => setFormData({ ...formData, venueCount: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Total Screens
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={formData.screensCount}
              onChange={(e) => setFormData({ ...formData, screensCount: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Technical Infrastructure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Ticketing POS System
            </label>
            <select
              value={formData.ticketingSystem}
              onChange={(e) => setFormData({ ...formData, ticketingSystem: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Vista">Vista Cinema Intelligence</option>
              <option value="Veezi">Veezi Cloud POS</option>
              <option value="RTS">Ready Theater Systems (RTS)</option>
              <option value="Comscore">Comscore Swift / POS</option>
              <option value="Custom">Custom / Proprietary In-House POS</option>
              <option value="Other">Other Electronic Ticketing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Screening / TMS Architecture
            </label>
            <select
              value={formData.screeningServer}
              onChange={(e) => setFormData({ ...formData, screeningServer: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Dolby TMS">Dolby Cinema / TMS System</option>
              <option value="Doremi">Doremi DCP Projection Server</option>
              <option value="GDC">GDC Technology TMS</option>
              <option value="Barco">Barco Alchemy / TMS</option>
              <option value="Christie">Christie IMB Projection</option>
              <option value="Other">Other Theater Management System</option>
            </select>
          </div>
        </div>

        {/* Technical contact & notes */}
        <div>
          <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
            Technical Contact Email (Optional)
          </label>
          <input
            type="email"
            placeholder="tech-lead@cinemagroup.com"
            value={formData.technicalContactEmail}
            onChange={(e) => setFormData({ ...formData, technicalContactEmail: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
            Pilot Goals & Operational Notes
          </label>
          <textarea
            rows={3}
            placeholder="Tell us about your target screens, preferred pilot timeline, or specific integration requirements."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-all shadow-subtle flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Partner Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="mt-3 text-[11px] text-center text-brand-text-secondary">
            Submissions are audited by our platform administration team prior to workspace access.
          </p>
        </div>
      </form>
    </div>
  );
}
