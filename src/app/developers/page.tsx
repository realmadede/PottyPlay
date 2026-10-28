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
} from "lucide-react";

export default function DevelopersPortalPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<"verify" | "activate" | "sync" | "revoke">("verify");

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

  return (
    <div className="flex-1 flex flex-col bg-bg text-ink">
      <LandingHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-12 text-left">
        {/* Title Header */}
        <div className="pb-8 border-b border-line">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-field border border-line text-xs font-semibold text-muted mb-4 shadow-subtle">
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Exhibitor Technology Gateway</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tight">
            Developer Integration Portal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted max-w-3xl leading-relaxed">
            Technical guides, OpenAPI specifications, and webhook contracts for cinema IT architects, ticketing developers, and projection engineers.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-sm flex items-center space-x-2"
            >
              <span>Download OpenAPI 3.1 Spec</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="#webhooks"
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-field border border-line text-ink hover:bg-field-raised transition-colors"
            >
              POS Webhook Contracts
            </a>
          </div>
        </div>

        {/* Core Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-ink">
              Authentication & Tokens
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Cinema partner API keys authenticate server-to-server POS requests. Companion client requests utilize short-lived session tokens (`pstk_`).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-ink">
              Idempotency & Safe Retries
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Pass `Idempotency-Key` headers on session activation calls. Network retries will never trigger duplicate billing events or exhaust ticket break allowances.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-field border border-line shadow-card hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-ink">
              Strict 900s Hard Ceiling
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Sessions are terminated server-side precisely at 900 seconds. Streams cannot be extended or replayed without fresh authorization.
            </p>
          </div>
        </div>

        {/* Interactive Endpoint Explorer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink tracking-tight">
              API Endpoint Reference
            </h2>
            <span className="text-xs text-muted font-mono">v1.0.0 STABLE</span>
          </div>

          {/* Endpoint selector pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "verify", label: "POST /api/tickets/verify" },
              { id: "activate", label: "POST /api/sessions/activate" },
              { id: "sync", label: "GET /api/sessions/sync" },
              { id: "revoke", label: "POST /api/operator/revoke" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedEndpoint(p.id as any)}
                className={`py-2 px-3.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedEndpoint === p.id
                    ? "bg-amber-500 text-neutral-950 shadow-sm"
                    : "bg-field text-muted border border-line hover:text-ink hover:bg-field-raised"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="bg-field text-ink rounded-3xl p-6 sm:p-8 border border-line shadow-elevated space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500 text-neutral-950">
                  {endpoint.method}
                </span>
                <span className="font-mono text-muted">{endpoint.path}</span>
              </div>
              <h3 className="text-lg font-bold text-ink mt-2">{endpoint.title}</h3>
              <p className="text-xs text-muted mt-1">{endpoint.desc}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                  Example cURL Request
                </span>
                <pre className="p-4 rounded-2xl bg-bg border border-line text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                  {endpoint.curl}
                </pre>
              </div>

              {/* Response */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                  Response (200 OK)
                </span>
                <pre className="p-4 rounded-2xl bg-bg border border-line text-[11px] font-mono text-muted overflow-x-auto leading-relaxed">
                  {endpoint.response}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <section id="webhooks" className="p-8 rounded-3xl bg-field border border-line shadow-card space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-ink">
                Ticketing POS Webhook Integration
              </h3>
              <p className="text-xs text-muted">
                Configure your Vista or Veezi POS to notify PottyPlay upon ticket sales or cancellations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-bg border border-line">
              <strong className="text-ink block mb-1">
                Event: ticket.admitted
              </strong>
              <p className="text-muted leading-relaxed">
                Triggered when a patron scans their ticket at the cinema turnstile. Provisions admission entitlement and assigns claim token.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-bg border border-line">
              <strong className="text-ink block mb-1">
                Event: ticket.refunded
              </strong>
              <p className="text-muted leading-relaxed">
                Immediately revokes any active companion viewing credentials if a ticket is refunded or cancelled at the box office.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
