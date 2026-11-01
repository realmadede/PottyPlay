"use client";

import React, { useState } from "react";
import { LandingHeader } from "@/components/LandingHeader";
import { Terminal, Copy, Check, ExternalLink, Key, ShieldCheck, Webhook } from "lucide-react";
import { GlassSurface } from "@/components/GlassSurface";

type LanguageKey = "curl" | "javascript" | "python";
type EndpointKey = "verify" | "activate" | "sync" | "current" | "revoke" | "webhook";

interface EndpointDoc {
  method: "POST" | "GET";
  path: string;
  title: string;
  desc: string;
  auth: string;
  requestSnippets: Record<LanguageKey, string>;
  responsePayload: string;
  errorPayload: string;
}

const BASE = "https://YOUR-POTTYPLAY-HOST";

const endpoints: Record<EndpointKey, EndpointDoc> = {
  verify: {
    method: "POST",
    path: "/api/tickets/verify",
    title: "Verify ticket entitlement",
    desc: "Checks whether a ticket number or claim token is eligible for a companion viewing break: the ticket exists, belongs to the screening (if supplied), is admitted, has breaks remaining, and the cinema holds valid content rights. Send one of ticketNumber, claimToken or identifier. Returns 200 when eligible and 422 otherwise.",
    auth: "None (the ticket code is the credential)",
    requestSnippets: {
      curl: `curl -X POST ${BASE}/api/tickets/verify \\
  -H "Content-Type: application/json" \\
  -d '{"claimToken": "CLM-EXAMPLE", "screeningId": "SCREENING_ID"}'`,
      javascript: `const res = await fetch("${BASE}/api/tickets/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ claimToken: "CLM-EXAMPLE", screeningId: "SCREENING_ID" }),
});
const result = await res.json(); // result.isEligible, result.status`,
      python: `import requests

res = requests.post(
    "${BASE}/api/tickets/verify",
    json={"claimToken": "CLM-EXAMPLE", "screeningId": "SCREENING_ID"},
    timeout=10,
)
print(res.status_code, res.json())`,
    },
    responsePayload: `{
  "status": "ELIGIBLE",
  "isEligible": true,
  "message": "Ticket verified. Eligible for companion viewing break.",
  "ticket": { "ticketNumber": "...", "seatNumber": "...", "customerName": "..." },
  "screening": { "id": "...", "title": "...", "cinemaName": "...", "screenName": "..." },
  "rights": { "maxSessionDurationSeconds": 900, "licenseType": "..." }
}`,
    errorPayload: `{
  "status": "ALREADY_ACTIVATED",
  "isEligible": false,
  "message": "This ticket has already been used to activate a companion viewing session."
}
// Other status values: INVALID_TICKET, WRONG_SCREENING, SCREENING_NOT_ACTIVE,
// CANCELLED_REFUNDED, INELIGIBLE, RIGHTS_UNAUTHORIZED`,
  },

  activate: {
    method: "POST",
    path: "/api/sessions/activate",
    title: "Activate a break session",
    desc: "Starts a time-limited companion session for a ticket. The ticket row, break count, session, billing event and audit event are written in one database transaction. The session length is the smaller of MAX_SESSION_DURATION_SECONDS (default 900) and the content-rights limit. A ticket allows at most its maxBreaks sessions (default 2). On success the session token is returned and also set as the pottyplay_token cookie. Failures return 422.",
    auth: "None (the ticket code is the credential)",
    requestSnippets: {
      curl: `curl -X POST ${BASE}/api/sessions/activate \\
  -H "Content-Type: application/json" \\
  -d '{"claimToken": "CLM-EXAMPLE"}'`,
      javascript: `const res = await fetch("${BASE}/api/sessions/activate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ claimToken: "CLM-EXAMPLE" }),
});
const session = await res.json(); // session.sessionToken, session.expiresAt`,
      python: `import requests

res = requests.post(
    "${BASE}/api/sessions/activate",
    json={"claimToken": "CLM-EXAMPLE"},
    timeout=10,
)
session = res.json()`,
    },
    responsePayload: `{
  "success": true,
  "sessionToken": "pstk_...",
  "sessionId": "...",
  "startedAt": "2026-01-01T10:00:00.000Z",
  "expiresAt": "2026-01-01T10:15:00.000Z",
  "durationSeconds": 900,
  "screeningId": "...",
  "initialPlaybackPositionSeconds": 1420.5,
  "totalDurationSeconds": 7200,
  "videoUrl": "https://..."
}`,
    errorPayload: `{
  "success": false,
  "error": "This ticket has already been activated for a companion viewing break."
}`,
  },

  sync: {
    method: "GET",
    path: "/api/sessions/sync",
    title: "Synchronize a session",
    desc: "Returns the session status, remaining seconds and the server-authoritative playback position. Each valid call records a heartbeat. The token may be sent as Authorization: Bearer, the x-session-token header, or the pottyplay_token cookie. Returns 200 while the session is valid, 403 when it is expired, revoked or completed, and 401 when no token is supplied. Expiry is evaluated server-side.",
    auth: "Session token (pstk_...)",
    requestSnippets: {
      curl: `curl ${BASE}/api/sessions/sync \\
  -H "Authorization: Bearer pstk_YOUR_SESSION_TOKEN"`,
      javascript: `const res = await fetch("${BASE}/api/sessions/sync", {
  headers: { Authorization: "Bearer " + sessionToken },
});
const state = await res.json(); // state.isValid, state.remainingSeconds`,
      python: `import requests

res = requests.get(
    "${BASE}/api/sessions/sync",
    headers={"Authorization": "Bearer " + session_token},
    timeout=10,
)
state = res.json()`,
    },
    responsePayload: `{
  "isValid": true,
  "status": "ACTIVE",
  "remainingSeconds": 612,
  "screening": {
    "id": "...",
    "title": "...",
    "playbackPositionSeconds": 1810.2,
    "durationSeconds": 7200,
    "isPaused": false,
    "videoUrl": "https://..."
  }
}`,
    errorPayload: `{
  "isValid": false,
  "status": "EXPIRED",
  "remainingSeconds": 0,
  "reason": "Your companion viewing break has expired. Please return to your cinema auditorium."
}`,
  },

  current: {
    method: "GET",
    path: "/api/screenings/current",
    title: "Authoritative playback state",
    desc: "Returns the server-authoritative playback state of a screening. A patron session token returns only the screening of that session. An operator token returns screenings of the operator's own cinema (optionally filtered by screeningId). There is no anonymous access.",
    auth: "Session token (pstk_...) or operator token (opr_...)",
    requestSnippets: {
      curl: `curl ${BASE}/api/screenings/current \\
  -H "Authorization: Bearer pstk_YOUR_SESSION_TOKEN"`,
      javascript: `const res = await fetch("${BASE}/api/screenings/current", {
  headers: { Authorization: "Bearer " + token },
});
const state = await res.json();`,
      python: `import requests

state = requests.get(
    "${BASE}/api/screenings/current",
    headers={"Authorization": "Bearer " + token},
    timeout=10,
).json()`,
    },
    responsePayload: `{
  "screeningId": "...",
  "screeningTitle": "...",
  "status": "PLAYING",
  "currentPositionSeconds": 1420.5,
  "durationSeconds": 7200,
  "isPaused": false,
  "canFollow": true,
  "unreliableSync": false,
  "serverTimestamp": 1761644700000
}`,
    errorPayload: `{ "error": "Invalid or expired session." }`,
  },

  revoke: {
    method: "POST",
    path: "/api/operator/revoke",
    title: "Revoke a session",
    desc: "Ends a patron's companion session immediately. Requires an authenticated operator. An operator can only revoke sessions of screenings that belong to their own cinema; any other session id returns 404.",
    auth: "Operator token (opr_...) from /api/operator/auth/login",
    requestSnippets: {
      curl: `curl -X POST ${BASE}/api/operator/revoke \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opr_YOUR_OPERATOR_TOKEN" \\
  -d '{"sessionId": "SESSION_ID", "reason": "Patron returned to the auditorium"}'`,
      javascript: `await fetch("${BASE}/api/operator/revoke", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + operatorToken,
  },
  body: JSON.stringify({ sessionId, reason: "Patron returned to the auditorium" }),
});`,
      python: `import requests

requests.post(
    "${BASE}/api/operator/revoke",
    json={"sessionId": session_id, "reason": "Patron returned to the auditorium"},
    headers={"Authorization": "Bearer " + operator_token},
    timeout=10,
)`,
    },
    responsePayload: `{ "success": true, "message": "Session revoked successfully." }`,
    errorPayload: `{ "success": false, "error": "Invalid or expired operator session." }`,
  },

  webhook: {
    method: "POST",
    path: "/api/webhooks/pos",
    title: "POS and projection webhook",
    desc: "Receives signed events from a cinema ticketing (POS) system or a projection automation bridge. The body must be JSON containing an event (or type) field. The signature is the hex HMAC-SHA256 of the raw request body, sent as x-pos-signature, x-signature or x-hub-signature-256, with an optional sha256= prefix. Supported events are listed below.",
    auth: "HMAC-SHA256 signature of the raw body (shared secret)",
    requestSnippets: {
      curl: `BODY='{"event":"ticket.admitted","data":{"ticketNumber":"TK-1001","screeningId":"SCREENING_ID","seatNumber":"F08","customerName":"Patron"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$POS_WEBHOOK_SECRET" | sed 's/^.* //')
curl -X POST ${BASE}/api/webhooks/pos \\
  -H "Content-Type: application/json" \\
  -H "x-pos-signature: sha256=$SIG" \\
  -d "$BODY"`,
      javascript: `import { createHmac } from "crypto";

const body = JSON.stringify({
  event: "screening.timeline_pause",
  data: { screeningId: "SCREENING_ID" },
});
const signature = createHmac("sha256", process.env.POS_WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

await fetch("${BASE}/api/webhooks/pos", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-pos-signature": "sha256=" + signature },
  body,
});`,
      python: `import hashlib, hmac, json, os, requests

body = json.dumps({"event": "ticket.cancelled", "data": {"ticketNumber": "TK-1001"}})
signature = hmac.new(
    os.environ["POS_WEBHOOK_SECRET"].encode(), body.encode(), hashlib.sha256
).hexdigest()
requests.post(
    "${BASE}/api/webhooks/pos",
    data=body,
    headers={"Content-Type": "application/json", "x-pos-signature": "sha256=" + signature},
    timeout=10,
)`,
    },
    responsePayload: `{ "success": true, "event": "ticket.admitted", "ticketId": "...", "status": "VALID_ADMITTED" }`,
    errorPayload: `{ "success": false, "error": "Invalid or missing webhook signature." }`,
  },
};

const webhookEvents: Array<{ event: string; effect: string; fields: string }> = [
  {
    event: "ticket.admitted / ticket.issued",
    effect: "Creates or updates an admitted ticket for a screening.",
    fields: "ticketNumber, screeningId (required); seatNumber, customerName, claimToken (optional)",
  },
  {
    event: "ticket.refunded / ticket.voided / ticket.cancelled",
    effect: "Marks the ticket cancelled and immediately revokes its active sessions.",
    fields: "ticketNumber (required)",
  },
  {
    event: "screening.timeline_pause",
    effect: "Pauses the authoritative screening timeline.",
    fields: "screeningId (required)",
  },
  {
    event: "screening.timeline_resume / screening.timeline_play",
    effect: "Resumes the authoritative screening timeline.",
    fields: "screeningId (required)",
  },
  {
    event: "screening.timeline_seek",
    effect: "Moves the authoritative timeline to a position.",
    fields: "screeningId, positionSeconds (required)",
  },
];

const behaviours: Array<{ label: string; text: string }> = [
  {
    label: "Session length",
    text: "The smaller of MAX_SESSION_DURATION_SECONDS (default 900 seconds) and the content-rights limit for the screening. Expiry is evaluated on the server when the session is read.",
  },
  {
    label: "Break allowance",
    text: "Each ticket allows at most its maxBreaks sessions (default 2), and only one session can be active at a time.",
  },
  {
    label: "Content rights",
    text: "A session can only start when the cinema holds an authorized, in-date content license for the screening's asset. Rights are granted by platform administration.",
  },
  {
    label: "Billing",
    text: "A billing event is recorded in the same transaction as the session activation, once per session.",
  },
  {
    label: "Tenant isolation",
    text: "Operator tokens are bound to one cinema. Requests for another cinema's data are rejected.",
  },
];

export default function DevelopersPortalPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointKey>("verify");
  const [selectedLang, setSelectedLang] = useState<LanguageKey>("curl");
  const [copied, setCopied] = useState(false);

  const endpoint = endpoints[selectedEndpoint];
  const snippet = endpoint.requestSnippets[selectedLang];

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090D] text-neutral-100 min-h-screen relative overflow-x-clip selection:bg-amber-500 selection:text-neutral-950 font-sans">
      <LandingHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-10 text-left">
        <div className="pb-6 border-b border-neutral-800/80">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Integration Reference</h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-3xl leading-relaxed">
            This page documents the HTTP endpoints that exist in the current PottyPlay platform. Replace{" "}
            <code className="text-neutral-200">{BASE}</code> with your deployment address. Partner API keys, SDKs and
            hardware drivers are not part of the platform; ticketing and projection systems integrate through the
            signed webhook below.
          </p>
          <div className="mt-5">
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-black bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all"
            >
              <span>OpenAPI description</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassSurface variant="panel" className="p-6 border border-neutral-800/90 shadow-card">
            <Key className="w-5 h-5 text-amber-400 mb-3" />
            <h2 className="font-bold text-base text-white">Credentials</h2>
            <ul className="mt-2 text-xs text-neutral-400 leading-relaxed space-y-1.5">
              <li>
                <code className="text-neutral-200">pstk_...</code> patron session token, returned by session activation.
                Send as <code className="text-neutral-200">Authorization: Bearer</code>, the{" "}
                <code className="text-neutral-200">x-session-token</code> header, or the{" "}
                <code className="text-neutral-200">pottyplay_token</code> cookie.
              </li>
              <li>
                <code className="text-neutral-200">opr_...</code> cinema operator token, returned by{" "}
                <code className="text-neutral-200">POST /api/operator/auth/login</code>.
              </li>
            </ul>
          </GlassSurface>
          <GlassSurface variant="panel" className="p-6 border border-neutral-800/90 shadow-card">
            <Webhook className="w-5 h-5 text-amber-400 mb-3" />
            <h2 className="font-bold text-base text-white">Webhook signing</h2>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Ticketing and projection systems sign the raw request body with HMAC-SHA256 using the shared webhook
              secret configured on the platform (<code className="text-neutral-200">POS_WEBHOOK_SECRET</code>).
              Unsigned or incorrectly signed requests are rejected with 401.
            </p>
          </GlassSurface>
          <GlassSurface variant="panel" className="p-6 border border-neutral-800/90 shadow-card">
            <ShieldCheck className="w-5 h-5 text-amber-400 mb-3" />
            <h2 className="font-bold text-base text-white">Errors</h2>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Responses are JSON. 400 invalid input, 401 missing or invalid credentials, 403 not permitted, 404 not
              found, 422 business rule rejected (for example an ineligible ticket), 500 unexpected failure.
            </p>
          </GlassSurface>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-white tracking-tight">Endpoints</h2>
            </div>
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800">
              {(["curl", "javascript", "python"] as LanguageKey[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    selectedLang === lang ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {lang === "curl" ? "cURL" : lang === "javascript" ? "JavaScript" : "Python"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <nav className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto">
              {(Object.keys(endpoints) as EndpointKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedEndpoint(key)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-mono transition-all whitespace-nowrap ${
                    selectedEndpoint === key
                      ? "bg-amber-500/10 border-amber-500/40 text-white"
                      : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span className="font-bold text-amber-400 mr-2">{endpoints[key].method}</span>
                  {endpoints[key].path}
                </button>
              ))}
            </nav>

            <div className="lg:col-span-3 p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 space-y-5 min-w-0">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{endpoint.title}</h3>
                <p className="mt-1 text-xs font-mono text-amber-400">
                  {endpoint.method} {endpoint.path}
                </p>
                <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{endpoint.desc}</p>
                <p className="mt-3 text-xs text-neutral-500">
                  <span className="font-bold text-neutral-300">Authentication:</span> {endpoint.auth}
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => handleCopy(snippet)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
                  aria-label="Copy request example"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] leading-relaxed text-neutral-200 overflow-x-auto">
                  <code>{snippet}</code>
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-emerald-400 mb-1.5">Success response</p>
                  <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] leading-relaxed text-neutral-300 overflow-x-auto">
                    <code>{endpoint.responsePayload}</code>
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-rose-400 mb-1.5">Error response</p>
                  <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] leading-relaxed text-neutral-300 overflow-x-auto">
                    <code>{endpoint.errorPayload}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 space-y-4">
          <h2 className="text-lg font-black text-white tracking-tight">Webhook events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-neutral-500 border-b border-neutral-800">
                  <th className="py-2 pr-4 font-bold">Event</th>
                  <th className="py-2 pr-4 font-bold">Effect</th>
                  <th className="py-2 font-bold">Payload fields</th>
                </tr>
              </thead>
              <tbody>
                {webhookEvents.map((item) => (
                  <tr key={item.event} className="border-b border-neutral-800/60 align-top">
                    <td className="py-2.5 pr-4 font-mono text-amber-400">{item.event}</td>
                    <td className="py-2.5 pr-4 text-neutral-300">{item.effect}</td>
                    <td className="py-2.5 text-neutral-400">{item.fields}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">
            Fields may be sent at the top level of the JSON body or inside a <code>data</code> object. Any other event
            value is rejected with 400.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 space-y-4">
          <h2 className="text-lg font-black text-white tracking-tight">Platform behaviour</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {behaviours.map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                <dt className="font-bold text-white mb-1">{item.label}</dt>
                <dd className="text-neutral-400 leading-relaxed">{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
