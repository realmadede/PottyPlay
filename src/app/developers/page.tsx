"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Code,
  FileCode2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  Key,
  Webhook,
  Database,
  Lock,
  Copy,
  Check,
  Cpu,
  Radio,
  Server,
  Clock,
  Activity,
  FileText,
  Sliders,
  Globe,
  RefreshCw,
  AlertCircle,
  Fingerprint,
} from "lucide-react";

type LanguageKey = "curl" | "typescript" | "python";
type EndpointKey = "verify" | "activate" | "sync" | "tms" | "revoke" | "register";

export default function DevelopersPortalPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointKey>("verify");
  const [selectedLang, setSelectedLang] = useState<LanguageKey>("curl");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSignatureCode, setCopiedSignatureCode] = useState(false);

  const endpoints: Record<
    EndpointKey,
    {
      method: "POST" | "GET";
      path: string;
      title: string;
      desc: string;
      authHeader: string;
      requestSnippets: Record<LanguageKey, string>;
      responsePayload: string;
      errorPayload: string;
    }
  > = {
    verify: {
      method: "POST",
      path: "/api/tickets/verify",
      title: "Verify Ticket Entitlement",
      desc: "Validates cinema ticket barcodes and entry claim tokens against active screening schedules and studio licensing rights.",
      authHeader: "X-Cinema-Key: cin_live_...",
      requestSnippets: {
        curl: `curl -X POST https://api.pottyplay.co.tz/api/tickets/verify \\
  -H "Content-Type: application/json" \\
  -H "X-Cinema-Key: cin_live_99a8b17c" \\
  -d '{
    "ticketNumber": "CC-MLM-7821-A12",
    "screeningId": "screening_prime_01"
  }'`,
        typescript: `import { PottyPlayClient } from "@pottyplay/cinema-sdk";

const client = new PottyPlayClient({
  apiKey: process.env.POTTYPLAY_CINEMA_KEY,
  environment: "production",
});

const entitlement = await client.tickets.verify({
  ticketNumber: "CC-MLM-7821-A12",
  screeningId: "screening_prime_01",
});

console.log("Eligible:", entitlement.isEligible);
console.log("Patron:", entitlement.ticket.customerName);`,
        python: `import requests
import os

url = "https://api.pottyplay.co.tz/api/tickets/verify"
headers = {
    "Content-Type": "application/json",
    "X-Cinema-Key": os.environ.get("POTTYPLAY_CINEMA_KEY"),
}
payload = {
    "ticketNumber": "CC-MLM-7821-A12",
    "screeningId": "screening_prime_01",
}

response = requests.post(url, json=payload, headers=headers, timeout=5)
data = response.json()
print("Eligible:", data.get("isEligible"))`,
      },
      responsePayload: `{
  "isEligible": true,
  "status": "ELIGIBLE",
  "ticket": {
    "ticketNumber": "CC-MLM-7821-A12",
    "seatNumber": "A12",
    "customerName": "Juma Mwanamvua"
  },
  "screening": {
    "id": "screening_prime_01",
    "title": "Serengeti Shadows (Main Hall)",
    "cinemaName": "Exhibitor Theater 01"
  },
  "rights": {
    "maxSessionDurationSeconds": 900,
    "licenseType": "Authorized Exhibitor Trial"
  }
}`,
      errorPayload: `{
  "isEligible": false,
  "status": "INVALID_TICKET",
  "error": "Ticket barcode not found for active screening.",
  "code": "ERR_TICKET_NOT_FOUND"
}`,
    },

    activate: {
      method: "POST",
      path: "/api/sessions/activate",
      title: "Activate Synchronized Break Session",
      desc: "Atomically provisions a strictly time-bounded (900s) companion playback session locked to live projection.",
      authHeader: "Idempotency-Key: idemp_...",
      requestSnippets: {
        curl: `curl -X POST https://api.pottyplay.co.tz/api/sessions/activate \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idemp_87fa21c49b0" \\
  -d '{
    "claimToken": "CLM-MLM-A12-8821",
    "deviceInfo": "Safari on iOS 18"
  }'`,
        typescript: `const session = await client.sessions.activate({
  claimToken: "CLM-MLM-A12-8821",
  deviceInfo: "Mobile Safari 18.2",
  idempotencyKey: "idemp_87fa21c49b0",
});

console.log("Session ID:", session.sessionId);
console.log("Initial Position (s):", session.initialPlaybackPositionSeconds);`,
        python: `payload = {
    "claimToken": "CLM-MLM-A12-8821",
    "deviceInfo": "Mobile Safari 18.2",
}
headers = {
    "Content-Type": "application/json",
    "Idempotency-Key": "idemp_87fa21c49b0",
}
res = requests.post("https://api.pottyplay.co.tz/api/sessions/activate", json=payload, headers=headers)
session = res.json()`,
      },
      responsePayload: `{
  "success": true,
  "sessionId": "session_88192a_cuid",
  "sessionToken": "pstk_e92bf18a032d88c49a1",
  "durationSeconds": 900,
  "seatNumber": "A12",
  "initialPlaybackPositionSeconds": 720.0
}`,
      errorPayload: `{
  "success": false,
  "error": "This ticket has already activated its 15-minute break session.",
  "code": "ERR_TICKET_ALREADY_ACTIVE"
}`,
    },

    sync: {
      method: "GET",
      path: "/api/sessions/sync",
      title: "Screening Timeline Synchronization",
      desc: "Client heartbeat and authoritative playback position alignment. Accurately propagates auditorium projector pauses.",
      authHeader: "x-session-token: pstk_...",
      requestSnippets: {
        curl: `curl -X GET https://api.pottyplay.co.tz/api/sessions/sync \\
  -H "x-session-token: pstk_e92bf18a032d88c49a1"`,
        typescript: `const syncState = await client.sessions.sync({
  sessionToken: "pstk_e92bf18a032d88c49a1",
});

if (syncState.screening.isPaused) {
  videoElement.pause();
} else {
  videoElement.currentTime = syncState.screening.playbackPositionSeconds;
}`,
        python: `headers = {"x-session-token": "pstk_e92bf18a032d88c49a1"}
sync_res = requests.get("https://api.pottyplay.co.tz/api/sessions/sync", headers=headers)
telemetry = sync_res.json()
print("Position:", telemetry["screening"]["playbackPositionSeconds"])`,
      },
      responsePayload: `{
  "isValid": true,
  "status": "ACTIVE",
  "remainingSeconds": 842,
  "screening": {
    "id": "screening_prime_01",
    "title": "Serengeti Shadows",
    "playbackPositionSeconds": 778.0,
    "isPaused": false
  }
}`,
      errorPayload: `{
  "isValid": false,
  "status": "EXPIRED",
  "error": "Session limit of 900 seconds has been reached.",
  "code": "ERR_SESSION_HARD_EXPIRY"
}`,
    },

    tms: {
      method: "POST",
      path: "/api/screenings/current",
      title: "TMS Telemetry & Projector Timecode",
      desc: "Ingests live projector play/pause events and timecode frames from Christie, Dolby, Barco, or Arts Alliance servers.",
      authHeader: "X-Cinema-Key: cin_live_...",
      requestSnippets: {
        curl: `curl -X POST https://api.pottyplay.co.tz/api/screenings/current \\
  -H "Content-Type: application/json" \\
  -H "X-Cinema-Key: cin_live_99a8b17c" \\
  -d '{
    "screeningId": "screening_prime_01",
    "timecodeSeconds": 1420.5,
    "isPaused": false,
    "projectorId": "BARCO-DP4K-AUD01"
  }'`,
        typescript: `await client.tms.broadcastTelemetry({
  screeningId: "screening_prime_01",
  timecodeSeconds: 1420.5,
  isPaused: false,
  projectorId: "BARCO-DP4K-AUD01",
});`,
        python: `payload = {
    "screeningId": "screening_prime_01",
    "timecodeSeconds": 1420.5,
    "isPaused": False,
    "projectorId": "BARCO-DP4K-AUD01",
}
requests.post("https://api.pottyplay.co.tz/api/screenings/current", json=payload, headers=headers)`,
      },
      responsePayload: `{
  "success": true,
  "screeningId": "screening_prime_01",
  "syncedPatrons": 4,
  "offsetDriftSeconds": 0.02
}`,
      errorPayload: `{
  "success": false,
  "error": "Screening not found or projector authorization invalid.",
  "code": "ERR_TMS_UNAUTHORIZED"
}`,
    },

    revoke: {
      method: "POST",
      path: "/api/operator/revoke",
      title: "Manual Usher Revocation",
      desc: "Allows authorized cinema usher consoles to immediately terminate a companion stream upon patron auditorium return.",
      authHeader: "Authorization: Bearer op_usr_...",
      requestSnippets: {
        curl: `curl -X POST https://api.pottyplay.co.tz/api/operator/revoke \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer op_usr_token_99182a" \\
  -d '{
    "sessionId": "session_88192a_cuid",
    "reason": "Auditorium re-entry confirmed by cinema usher."
  }'`,
        typescript: `await client.operator.revokeSession({
  sessionId: "session_88192a_cuid",
  reason: "Auditorium re-entry confirmed by cinema usher.",
});`,
        python: `payload = {
    "sessionId": "session_88192a_cuid",
    "reason": "Auditorium re-entry confirmed by cinema usher.",
}
headers = {"Authorization": "Bearer op_usr_token_99182a"}
requests.post("https://api.pottyplay.co.tz/api/operator/revoke", json=payload, headers=headers)`,
      },
      responsePayload: `{
  "success": true,
  "message": "Session revoked. Playback terminated.",
  "revokedAt": "2026-10-28T10:45:00.000Z"
}`,
      errorPayload: `{
  "success": false,
  "error": "Operator token lacks usher revocation scope.",
  "code": "ERR_FORBIDDEN"
}`,
    },

    register: {
      method: "POST",
      path: "/api/auth/customer/register",
      title: "Patron Registration & Entitlement Binding",
      desc: "Creates a patron account with phone/email verification challenges and legal consent enforcement.",
      authHeader: "Content-Type: application/json",
      requestSnippets: {
        curl: `curl -X POST https://api.pottyplay.co.tz/api/auth/customer/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "Juma Mwanamvua",
    "phoneNumber": "+255714000111",
    "email": "juma@example.com",
    "password": "AuthoritativePassword123!",
    "termsAccepted": true
  }'`,
        typescript: `const account = await client.auth.registerCustomer({
  fullName: "Juma Mwanamvua",
  phoneNumber: "+255714000111",
  email: "juma@example.com",
  password: "AuthoritativePassword123!",
  termsAccepted: true,
});

console.log("Customer ID:", account.customer.id);
console.log("Phone OTP Challenge:", account.phoneChallengeId);`,
        python: `payload = {
    "fullName": "Juma Mwanamvua",
    "phoneNumber": "+255714000111",
    "email": "juma@example.com",
    "password": "AuthoritativePassword123!",
    "termsAccepted": True,
}
res = requests.post("https://api.pottyplay.co.tz/api/auth/customer/register", json=payload)`,
      },
      responsePayload: `{
  "success": true,
  "customer": {
    "id": "cm_88192a_cuid",
    "name": "Juma Mwanamvua",
    "phoneNumber": "+255714000111",
    "email": "juma@example.com",
    "isPhoneVerified": false,
    "isEmailVerified": false
  },
  "phoneChallengeId": "otp_ch_9921a"
}`,
      errorPayload: `{
  "success": false,
  "error": "Explicit acceptance of Terms of Service and Privacy Policy is mandatory.",
  "code": "ERR_TERMS_NOT_ACCEPTED"
}`,
    },
  };

  const endpoint = endpoints[selectedEndpoint];

  const handleCopyCode = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const webhookSignatureSnippet = `import crypto from "crypto";

export function verifyPottyPlayWebhook(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): boolean {
  const [algo, signature] = signatureHeader.split("=");
  if (algo !== "sha256" || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}`;

  return (
    <div className="flex-1 flex flex-col bg-[#07090D] text-neutral-100 min-h-screen relative overflow-x-clip selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Background Matrix Cyber Grid & Projector Ambient Aura */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(245,158,11,0.12),transparent)] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <LandingHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-12 text-left relative z-10">
        {/* Title Header with Enterprise Meta Badges */}
        <div className="pb-8 border-b border-neutral-800/80">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-sm">
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>EXHIBITOR TECHNOLOGY GATEWAY</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-300">
              API v1.0.0
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-xs font-mono text-emerald-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PRODUCTION SYSTEMS ONLINE</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Developer Integration Portal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-3xl leading-relaxed">
            Technical architecture guides, OpenAPI specifications, TMS hardware ingestion contracts, and webhook implementations for cinema IT architects, ticketing developers, and projection engineers.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center space-x-2 active:scale-95"
            >
              <span>Download OpenAPI 3.1 Spec</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="#tms-protocols"
              className="py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-neutral-900/90 border border-neutral-700/80 text-neutral-200 hover:text-white hover:border-amber-500/50 hover:bg-neutral-800 transition-all"
            >
              TMS Hardware Protocols
            </a>
            <a
              href="#webhooks"
              className="py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-neutral-900/90 border border-neutral-700/80 text-neutral-200 hover:text-white hover:border-amber-500/50 hover:bg-neutral-800 transition-all"
            >
              POS Webhook Contracts
            </a>
            <a
              href="#security-matrix"
              className="py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-neutral-900/90 border border-neutral-700/80 text-neutral-200 hover:text-white hover:border-amber-500/50 hover:bg-neutral-800 transition-all"
            >
              Security & Rate Limits
            </a>
          </div>
        </div>

        {/* Global Environments & Base URLs Bar */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
            <Globe className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">Authoritative API Environments</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-bold">Production Gateway</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                  TLS 1.3 / HSTS
                </span>
              </div>
              <code className="text-amber-400 font-bold text-sm select-all">
                https://api.pottyplay.co.tz/v1
              </code>
              <p className="text-[11px] text-neutral-500 font-sans">
                Real-time cinema auditoriums, production ticketing POS, and live patron sync.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-bold">Sandbox / Staging Gateway</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                  Mock Hardware Simulators
                </span>
              </div>
              <code className="text-cyan-400 font-bold text-sm select-all">
                https://sandbox.pottyplay.co.tz/v1
              </code>
              <p className="text-[11px] text-neutral-500 font-sans">
                Full POS validation, simulated projector clocks, and test patron telephone numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Core Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 shadow-2xl hover:border-amber-500/40 hover:bg-neutral-900 transition-all group backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all">
              <Key className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Authentication & Tokens
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                PSTK / HMAC
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Cinema partner API keys (<code className="text-neutral-200">X-Cinema-Key</code>) authenticate server-to-server POS requests. Companion client streams utilize short-lived session tokens (<code className="text-neutral-200">pstk_</code>).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 shadow-2xl hover:border-amber-500/40 hover:bg-neutral-900 transition-all group backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Idempotency & Safe Retries
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ATOMIC CACHE
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Pass <code className="text-neutral-200">Idempotency-Key</code> headers on session activation calls. Network retries will never trigger duplicate billing events or exhaust patron break allowances.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 shadow-2xl hover:border-amber-500/40 hover:bg-neutral-900 transition-all group backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Strict 900s Hard Ceiling
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                15 MIN STRICT
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Sessions are terminated server-side precisely at 900 seconds. Monotonic server clocks guarantee immunity against client local time manipulation.
            </p>
          </div>
        </div>

        {/* Interactive Endpoint Explorer: Hardened Terminal Console */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-white tracking-tight">
                Authoritative API Reference & Code Explorer
              </h2>
            </div>

            {/* Language Selector */}
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800">
              {(["curl", "typescript", "python"] as LanguageKey[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    selectedLang === lang
                      ? "bg-amber-500 text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {lang === "curl" ? "cURL" : lang === "typescript" ? "TypeScript" : "Python"}
                </button>
              ))}
            </div>
          </div>

          {/* Hardened Terminal Window Container */}
          <div className="rounded-3xl bg-neutral-950 border border-neutral-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Terminal Window Chrome */}
            <div className="bg-neutral-900/90 border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/90 border border-red-600/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-600/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600/40 inline-block" />
                <span className="ml-3 font-mono text-xs text-neutral-400 hidden sm:inline-block font-semibold">
                  pottyplay-api-console &mdash; bash &mdash; 80x24
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">ONLINE</span>
                <span>&bull;</span>
                <span>api.pottyplay.co.tz</span>
              </div>
            </div>

            {/* Endpoint Selector Tabs */}
            <div className="p-3 bg-neutral-900/40 border-b border-neutral-800 flex flex-wrap gap-2">
              {[
                { id: "verify", method: "POST", label: "/api/tickets/verify" },
                { id: "activate", method: "POST", label: "/api/sessions/activate" },
                { id: "sync", method: "GET", label: "/api/sessions/sync" },
                { id: "tms", method: "POST", label: "/api/screenings/current" },
                { id: "revoke", method: "POST", label: "/api/operator/revoke" },
                { id: "register", method: "POST", label: "/api/auth/customer/register" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedEndpoint(p.id as EndpointKey)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
                    selectedEndpoint === p.id
                      ? "bg-neutral-900 text-white border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-neutral-950/70 text-neutral-400 border border-neutral-800/80 hover:text-neutral-200 hover:bg-neutral-900/60"
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      p.method === "POST"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {p.method}
                  </span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Terminal Body */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Endpoint Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
                <div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold ${
                        endpoint.method === "POST"
                          ? "bg-amber-500 text-neutral-950"
                          : "bg-cyan-500 text-neutral-950"
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-neutral-300 font-bold">{endpoint.path}</span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-2 tracking-tight">
                    {endpoint.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {endpoint.desc}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                  <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{endpoint.authHeader}</span>
                </div>
              </div>

              {/* Code Viewing Panes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Pane */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-bold uppercase tracking-wider text-neutral-300">
                      Request Signature ({selectedLang.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(endpoint.requestSnippets[selectedLang])}
                      className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      title="Copy code snippet"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 rounded-2xl bg-[#030406] border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed shadow-inner max-h-[380px]">
                    {endpoint.requestSnippets[selectedLang]}
                  </pre>
                </div>

                {/* Response / Error Pane */}
                <div className="space-y-4">
                  {/* Success Payload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span className="font-bold uppercase tracking-wider text-neutral-300">
                        Success Response (200 OK)
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>18ms &bull; application/json</span>
                      </span>
                    </div>
                    <pre className="p-4 rounded-2xl bg-[#030406] border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed shadow-inner max-h-[190px]">
                      {endpoint.responsePayload}
                    </pre>
                  </div>

                  {/* Failure / Error Payload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span className="font-bold uppercase tracking-wider text-red-400">
                        Error Response (4xx)
                      </span>
                      <span className="text-red-400 font-bold text-[10px]">
                        RFC 7807 Problem Detail
                      </span>
                    </div>
                    <pre className="p-4 rounded-2xl bg-[#030406] border border-neutral-800 text-[11px] font-mono text-red-300 overflow-x-auto leading-relaxed shadow-inner max-h-[140px]">
                      {endpoint.errorPayload}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theater Management System (TMS) Integration Architecture */}
        <section
          id="tms-protocols"
          className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-2xl space-y-6 backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Theater Management System (TMS) Hardware Protocols
                </h3>
                <p className="text-xs text-neutral-400">
                  PottyPlay links directly with projection server hardware to maintain sub-second synchronization with auditorium screens.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
              SMPTE ST 430-1 COMPLIANT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Christie Cine-IP</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  TCP 4170
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Listens for Christie Solaria / CP series automation cues. Emits timecode broadcasts directly upon lamp ignition and auditorium cue triggers.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                Supported: CP2220, CP4325-RGB, Cine-IP v4.2+
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Dolby Cinema & IMS</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  UDP BROADCAST
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Connects to Dolby IMS3000 and ShowVault servers via Show Player API. Captures intermission pauses, shutter closures, and Dolby Atmos audio state.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                Supported: IMS3000, DSS200, CP850 Atmos
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Barco Alchemy ICMP</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  REST / TLS 1.3
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Polls Barco ICMP Integrated Cinema Media Processor over secure local theater LAN. Intercepts playhead positions with &plusmn;20ms frame accuracy.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                Supported: DP4K-32B, SP4K, Alchemy ICMP-X
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Arts Alliance Media</span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  SCREENWRITER
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Syncs with AAM Screenwriter centralized cinema management. Ingests master schedules across 30+ multiplex screens simultaneously.
              </p>
              <div className="pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                Supported: Screenwriter v5.x, Producer Hub
              </div>
            </div>
          </div>
        </section>

        {/* POS Webhooks Section with HMAC Verification Guide */}
        <section
          id="webhooks"
          className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-2xl space-y-6 backdrop-blur-md"
        >
          <div className="flex items-center space-x-3 pb-4 border-b border-neutral-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Ticketing POS Webhook Integration & Event Signatures
              </h3>
              <p className="text-xs text-neutral-400">
                Configure your Vista, Veezi, Retriever, or custom cinema POS to dispatch real-time admission and refund events to PottyPlay.
              </p>
            </div>
          </div>

          {/* Webhook Events Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-xs">
                  ticket.admitted
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                  HTTP POST
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Triggered when a patron scans their ticket barcode at the cinema turnstile. Provisions admission entitlement and assigns claim token.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400 text-xs">
                  screening.timeline_pause
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                  PROJECTOR SYNC
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Triggered by auditorium projector pauses (intermissions or technical pauses). Freezes active patron countdown clocks authoritatively without drift.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-red-400 text-xs">
                  ticket.refunded
                </span>
                <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/40">
                  IMMEDIATE REVOCATION
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Immediately revokes active companion viewing credentials if a ticket is cancelled or refunded at the box office.
              </p>
            </div>
          </div>

          {/* Cryptographic Signature Verification Code */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono text-white">
                <Fingerprint className="w-4 h-4 text-amber-400" />
                <span className="font-bold">Cryptographic Webhook Signature Verification (HMAC-SHA256)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(webhookSignatureSnippet);
                    setCopiedSignatureCode(true);
                    setTimeout(() => setCopiedSignatureCode(false), 2000);
                  }
                }}
                className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
              >
                {copiedSignatureCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Implementation</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every webhook request includes an <code className="text-amber-400">X-PottyPlay-Signature</code> header. Verify the signature using timing-safe comparisons to prevent timing attacks and replay tampering.
            </p>
            <pre className="p-4 rounded-xl bg-[#030406] border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed shadow-inner">
              {webhookSignatureSnippet}
            </pre>
          </div>
        </section>

        {/* Security Matrix & Standard HTTP Status Codes */}
        <section
          id="security-matrix"
          className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-2xl space-y-6 backdrop-blur-md"
        >
          <div className="flex items-center space-x-3 pb-4 border-b border-neutral-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Security Posture, Rate Limits & HTTP Status Standards
              </h3>
              <p className="text-xs text-neutral-400">
                Deterministic error codes and zero-trust controls for cinema IT security audits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Rate Limits */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Rate Limiting & Tier Ceilings</span>
              </div>
              <ul className="space-y-2 text-neutral-400">
                <li className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                  <span>Cinema Partner Key (POS):</span>
                  <span className="font-mono text-white font-bold">1,200 requests / minute</span>
                </li>
                <li className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                  <span>Patron Companion Sync (<code className="text-amber-400">pstk_</code>):</span>
                  <span className="font-mono text-white font-bold">60 requests / minute</span>
                </li>
                <li className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                  <span>SMS OTP Challenge Verification:</span>
                  <span className="font-mono text-white font-bold">3 attempts per 5 minutes</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Burst Capacity Ceiling:</span>
                  <span className="font-mono text-white font-bold">2,500 requests / minute</span>
                </li>
              </ul>
            </div>

            {/* Password & Crypto Standards */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Cryptographic Specifications</span>
              </div>
              <ul className="space-y-2 text-neutral-400">
                <li className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                  <span>Customer Password Hashing:</span>
                  <span className="font-mono text-white font-bold">Argon2id (m=64MB, t=3, p=4)</span>
                </li>
                <li className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                  <span>OTP Challenge Tokens:</span>
                  <span className="font-mono text-white font-bold">SHA-256 with Cryptographic Salt</span>
                </li>
                <li className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
                  <span>Transport Encryption:</span>
                  <span className="font-mono text-white font-bold">TLS 1.3 Strict / HSTS Preload</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Database Encryption at Rest:</span>
                  <span className="font-mono text-white font-bold">AES-256-GCM Hardware Accelerated</span>
                </li>
              </ul>
            </div>
          </div>

          {/* HTTP Status Reference Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-3">Status Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Application Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                <tr>
                  <td className="p-3 font-bold text-emerald-400">200 OK</td>
                  <td className="p-3">Operation completed successfully.</td>
                  <td className="p-3">Process response payload.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-emerald-400">201 Created</td>
                  <td className="p-3">Session or patron account provisioned.</td>
                  <td className="p-3">Store session credentials locally.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-400">400 Bad Request</td>
                  <td className="p-3">Malformed JSON payload or missing parameters.</td>
                  <td className="p-3">Inspect error detail message.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-400">401 Unauthorized</td>
                  <td className="p-3">Invalid API key or expired patron token.</td>
                  <td className="p-3">Re-authenticate or rotate credentials.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-400">403 Forbidden</td>
                  <td className="p-3">Studio licensing missing or geofence violation.</td>
                  <td className="p-3">Show rights warning to patron.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-amber-400">409 Conflict</td>
                  <td className="p-3">Ticket barcode already active in break session.</td>
                  <td className="p-3">Prevent duplicate stream activations.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-amber-400">422 Unprocessable</td>
                  <td className="p-3">Screening not started or already concluded.</td>
                  <td className="p-3">Display schedule error to patron.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-amber-400">429 Rate Limited</td>
                  <td className="p-3">Exceeded per-minute request ceiling.</td>
                  <td className="p-3">Follow Retry-After backoff header.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
