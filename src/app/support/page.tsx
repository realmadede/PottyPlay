"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { GlassSurface } from "@/components/GlassSurface";
import {
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Film,
  Ticket,
  Shield,
  Clock,
  MessageSquare,
  Building2,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "break-duration",
    category: "Companion Streaming",
    question: "How does the 15-minute companion break work?",
    answer:
      "When you step out of the auditorium to use the restroom, scanning your ticket claim code starts a 15-minute synchronized companion stream on your personal device. When your break ends or when you re-enter the auditorium, the stream automatically terminates to protect theatrical exhibition rights.",
  },
  {
    id: "ticket-claim",
    category: "Ticketing & Verification",
    question: "Why does my ticket show as ineligible or already redeemed?",
    answer:
      "Each cinema ticket includes up to 2 restroom break allowances during active film screening hours. If your screening has not yet begun, has ended, or all break allowances have been consumed, the ticket cannot activate a session. Please confirm your screening schedule or speak with a cinema usher.",
  },
  {
    id: "faraday-wifi",
    category: "Network & Connectivity",
    question: "Why does the stream buffer in basement restrooms?",
    answer:
      "Basement auditoriums and restrooms feature reinforced concrete walls that create a Faraday cage effect, attenuating cellular 4G/5G signals. Connect your mobile device to the venue guest Wi-Fi network shown in your theater (for example, pottyplay-cinema-guest). Companion streams are cached on the local cinema LAN for instant playback without cellular reception.",
  },
  {
    id: "timeline-sync",
    category: "Companion Streaming",
    question: "How is the video synchronized with the cinema projector?",
    answer:
      "PottyPlay connects directly with the theater TMS (Theatre Management System). The companion stream calculates the exact playback offset from the auditorium projector clock so what you view on your phone matches the theater screen down to the second.",
  },
  {
    id: "account-deletion",
    category: "Privacy & Data Protection",
    question: "How do I request deletion of my account and personal data?",
    answer:
      "Under Tanzania Personal Data Protection Act 2022 (PDPA), you have the right to account erasure. Go to Account Settings in the web or mobile app and tap 'Request Account Deletion'. All active sessions and bearer tokens are immediately invalidated. Your personal data is placed into a 30-day grace period, after which all phone numbers, names, and emails are permanently scrubbed and anonymized.",
  },
  {
    id: "forensic-watermark",
    category: "Content Protection",
    question: "Why is my seat number displayed over the video stream?",
    answer:
      "To satisfy major Hollywood studio licensing agreements and prevent unauthorized recording or distribution, dynamic forensic watermarks displaying your seat number, screening ID, and session timestamp are rendered over playback. Watermarking protects theatrical content while you enjoy companion viewing.",
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<string | null>("break-duration");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Form State
  const [category, setCategory] = useState<string>("GENERAL_FEEDBACK");
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const categories = [
    "ALL",
    "Companion Streaming",
    "Ticketing & Verification",
    "Network & Connectivity",
    "Privacy & Data Protection",
    "Content Protection",
  ];

  const filteredFaqs =
    selectedCategory === "ALL"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((f) => f.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmittedId(null);

    if (!message.trim()) {
      setErrorMsg("Please enter a description of your issue or feedback.");
      return;
    }

    setSubmitting(true);
    try {
      const savedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("pp_cust_token")
          : null;

      const res = await fetch("/api/customer/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        },
        body: JSON.stringify({
          category,
          ticketNumber: ticketNumber.trim() || null,
          message: `${contactInfo.trim() ? `[Contact: ${contactInfo.trim()}]\n\n` : ""}${message.trim()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit support request.");
      }

      setSubmittedId(json.feedbackId || "ACK-SUBMITTED");
      setMessage("");
      setTicketNumber("");
      setContactInfo("");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg text-ink selection:bg-amber-500/30 selection:text-ink min-h-[100dvh]">
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-left">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Open Patron Web App</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="border-b border-line pb-8 mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Patron Support & Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
            How Can We Assist You?
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            Find answers to questions regarding cinema companion streaming, venue Wi-Fi connectivity, ticket validation, and personal data privacy rights.
          </p>
        </div>

        {/* Quick Help Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <GlassSurface variant="card" className="p-5 border border-white/10 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-ink">15-Minute Synchronized Break</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Companion playback streams exclusively during active restroom breaks, synchronized to your cinema screening timeline.
            </p>
          </GlassSurface>

          <GlassSurface variant="card" className="p-5 border border-white/10 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-ink">Restroom Guest Wi-Fi</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Basement walls block 4G/5G radio signals. Connect to theater guest Wi-Fi for buffer-free local edge stream caching.
            </p>
          </GlassSurface>

          <GlassSurface variant="card" className="p-5 border border-white/10 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-ink">PDPA 2022 Privacy Protection</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Your phone numbers and tickets are securely encrypted. Self-service account deletion and complete PII scrubbing available anytime.
            </p>
          </GlassSurface>
        </div>

        {/* Grid: FAQs + Report Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: FAQs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-black text-ink uppercase tracking-wider flex items-center space-x-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Frequently Asked Questions</span>
              </h2>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {categories.slice(0, 3).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-amber-500 text-neutral-950 font-bold"
                        : "bg-field text-muted hover:text-ink border border-line"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-line rounded-2xl bg-field/80 overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-field-raised/40 transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                          {faq.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-ink">
                          {faq.question}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-bg text-muted shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-muted leading-relaxed border-t border-line/40 bg-bg/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cinema Usher Emergency Notice */}
            <div className="p-4 rounded-2xl bg-field border border-line text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <Building2 className="w-4 h-4" />
                <span>On-Site Cinema Usher Assistance</span>
              </div>
              <p className="text-muted leading-relaxed text-[11px]">
                If your physical ticket bar code does not scan, or you require assistance re-entering the auditorium before your break expires, please present your ticket stub directly to an on-duty cinema floor usher.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Report & Feedback Form */}
          <div className="lg:col-span-5">
            <GlassSurface
              variant="panel"
              className="p-6 rounded-3xl border border-white/10 shadow-card space-y-5"
            >
              <div>
                <h3 className="text-base font-bold text-ink uppercase tracking-wider flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Submit Patron Report</span>
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Experiencing playback buffering, ticket errors, or restroom facility issues? Submit a report directly to theater operations.
                </p>
              </div>

              {submittedId && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center space-x-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Report Logged Successfully</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Your report has been queued for cinema operator triage. Reference ticket ID:
                  </p>
                  <p className="font-mono text-xs bg-bg/60 p-2 rounded-lg border border-line text-ink">
                    {submittedId}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedId(null)}
                    className="text-[11px] font-bold underline text-emerald-400 cursor-pointer pt-1"
                  >
                    Submit another report
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[11px]">
                    Report Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-ink outline-none focus:border-amber-400 text-xs cursor-pointer"
                  >
                    <option value="GENERAL_FEEDBACK">General Feedback or Inquiry</option>
                    <option value="PLAYBACK_OUT_OF_SYNC">Stream Out of Sync with Screen</option>
                    <option value="AUDIO_BUFFERING">Audio Buffering or Distortion</option>
                    <option value="VIDEO_FROZEN">Video Frozen or Buffering</option>
                    <option value="TICKET_ISSUE">Ticket Claim or Verification Problem</option>
                    <option value="CINEMA_FACILITY">Restroom Wi-Fi or Venue Facility Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[11px]">
                    Ticket Number or Claim Code (Optional)
                  </label>
                  <div className="relative">
                    <Ticket className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. TC-4091 or TKT-2026-..."
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      className="w-full bg-bg border border-line rounded-xl pl-9 pr-3 py-2 text-ink outline-none focus:border-amber-400 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[11px]">
                    Phone or Email for Follow-Up (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +255 712 345 678 or patron@cinema.com"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3 py-2 text-ink outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-muted font-bold uppercase tracking-wider text-[11px]">
                      Describe Your Issue or Feedback *
                    </label>
                    <span className="text-[10px] text-muted">{message.length}/2000</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    maxLength={2000}
                    placeholder="Describe what occurred, auditorium screen number, or restroom location..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl p-3 text-ink outline-none focus:border-amber-400 text-xs leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Report to Cinema Desk</span>
                    </>
                  )}
                </button>
              </form>
            </GlassSurface>
          </div>
        </div>

        {/* Footer Links Bar */}
        <div className="border-t border-line mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-4">
          <div className="flex items-center space-x-1">
            <span>&copy; {new Date().getFullYear()} PottyPlay Cinema Systems. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms of Service
            </Link>
            <Link href="/developers" className="hover:text-ink transition-colors">
              Developer API
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
