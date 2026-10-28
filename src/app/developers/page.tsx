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
} from "lucide-react";

export default function DevelopersPortalPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<"verify" | "activate" | "sync" | "revoke">("verify");
  const [copied, setCopied] = useState(false);

  const endpoints = {
    verify: {
      method: "POST",
      path: "/api/tickets/verify",
      title: "Verify Ticket Entitlement",
      desc: "Validates cinema ticket barcodes and entry claim tokens against active screening schedules and studio licensing rights.",
      curl: `curl -X POST https://api.pottyplay.co.tz/api/tickets/verify \\
  -H "Content-Type: application/json" \\
  -H "X-Cinema-Key: cin_sec_99a8b17c" \\
  -d '{
    "ticketNumber": "CC-MLM-7821-A12",
    "screeningId": "screening_prime_01"
  }'`,
      response: `{
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
    "cinemaName": "Century Cinemax - Mlimani City"
  },
  "rights": {
    "maxSessionDurationSeconds": 900,
    "licenseType": "Authorized Exhibitor Trial"
  }
}`,
    },
    activate: {
      method: "POST",
      path: "/api/sessions/activate",
      title: "Activate Synchronized Break Session",
      desc: "Atomically provisions a strictly time-bounded (900s) companion playback session locked to live projection.",
      curl: `curl -X POST https://api.pottyplay.co.tz/api/sessions/activate \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: idemp_87fa21c" \\
  -d '{
    "claimToken": "CLM-MLM-A12-8821",
    "deviceInfo": "Safari on iOS 18"
  }'`,
      response: `{
  "success": true,
  "sessionId": "session_88192a_cuid",
  "sessionToken": "pstk_e92bf18a032d88...",
  "durationSeconds": 900,
  "seatNumber": "A12",
  "initialPlaybackPositionSeconds": 720.0
}`,
    },
    sync: {
      method: "GET",
      path: "/api/sessions/sync",
      title: "Screening Timeline Synchronization",
      desc: "Client heartbeat and authoritative playback position alignment. Accurately propagates auditorium projector pauses.",
      curl: `curl -X GET https://api.pottyplay.co.tz/api/sessions/sync \\
  -H "x-session-token: pstk_e92bf18a032d88..."`,
      response: `{
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
    },
    revoke: {
      method: "POST",
      path: "/api/operator/revoke",
      title: "Manual Usher Revocation",
      desc: "Allows authorized cinema usher consoles to immediately terminate a companion stream upon patron auditorium return.",
      curl: `curl -X POST https://api.pottyplay.co.tz/api/operator/revoke \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer op_usr_token..." \\
  -d '{
    "sessionId": "session_88192a_cuid",
    "reason": "Auditorium re-entry confirmed by cinema usher."
  }'`,
      response: `{
  "success": true,
  "message": "Session revoked. Playback terminated."
}`,
    },
  };

  const endpoint = endpoints[selectedEndpoint];

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(endpoint.curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090D] text-neutral-100 min-h-screen relative overflow-x-clip selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Subtle Matrix Cyber Grid & Projector Ambient Aura */}
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
        {/* Title Header */}
        <div className="pb-8 border-b border-neutral-800/80">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-sm">
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>EXHIBITOR TECHNOLOGY GATEWAY &bull; API v1.0.0</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Developer Integration Portal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-3xl leading-relaxed">
            Technical guides, OpenAPI specifications, and webhook contracts for cinema IT architects, ticketing developers, and projection engineers.
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
              href="#webhooks"
              className="py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-neutral-900/90 border border-neutral-700/80 text-neutral-200 hover:text-white hover:border-amber-500/50 hover:bg-neutral-800 transition-all"
            >
              POS Webhook Contracts
            </a>
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
                PSTK
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Cinema partner API keys authenticate server-to-server POS requests. Companion client requests utilize short-lived session tokens (`pstk_`).
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
                ATOMIC
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Pass `Idempotency-Key` headers on session activation calls. Network retries will never trigger duplicate billing events or exhaust ticket break allowances.
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
                15 MIN
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Sessions are terminated server-side precisely at 900 seconds. Streams cannot be extended or replayed without fresh authorization.
            </p>
          </div>
        </div>

        {/* Interactive Endpoint Explorer: Hardened Terminal Console */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-white tracking-tight">
                Authoritative API Reference
              </h2>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
              REST / TLS 1.3
            </span>
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
                { id: "revoke", method: "POST", label: "/api/operator/revoke" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedEndpoint(p.id as any)}
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

              {/* Code Viewing Panes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Pane */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-bold uppercase tracking-wider text-neutral-300">
                      Request Signature (cURL)
                    </span>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                      title="Copy cURL command"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 rounded-2xl bg-[#030406] border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
                    {endpoint.curl}
                  </pre>
                </div>

                {/* Response Pane */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-bold uppercase tracking-wider text-neutral-300">
                      Response Payload (200 OK)
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>18ms &bull; json</span>
                    </span>
                  </div>
                  <pre className="p-4 sm:p-5 rounded-2xl bg-[#030406] border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed shadow-inner">
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <section
          id="webhooks"
          className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-2xl space-y-5 backdrop-blur-md"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Ticketing POS Webhook Integration
              </h3>
              <p className="text-xs text-neutral-400">
                Configure your Vista, Veezi, or custom cinema POS to dispatch events to PottyPlay.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
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
                Triggered when a patron scans their ticket at the cinema turnstile. Provisions admission entitlement and assigns claim token.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-red-400 text-xs">
                  ticket.refunded
                </span>
                <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/40">
                  HTTP POST
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Immediately revokes any active companion viewing credentials if a ticket is refunded or cancelled at the box office.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}