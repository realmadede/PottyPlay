# PottyPlay: Architecture and Design Audit Findings

## 1. Executive Summary

PottyPlay contains substantial business logic and security controls. The items below describe implementation surfaces; they are not a production security certification or evidence that partner infrastructure is deployed:
- A PostgreSQL database with explicit relations for venues, screens, screenings, tickets, sessions, studio licensing rights, and billing.
- Server-authoritative playback position calculation with freeze on pause.
- Dynamic percentage fee calculation (P_%, default 15%) deducting companion streaming fees directly from ticket admission prices.
- Idempotent billing event handling with atomic database transactions.
- Africa's Talking SMS integration with provider abstraction.
- A 119-test automated Vitest suite across 5 test files covering security, edge routing, support, account deletion, and session workflows (latest local run: 2026-11-03).
- Session token hashing at rest: All patron `BreakSession` tokens and cinema `OperatorUser` session tokens are stored as SHA-256 hashes (`sessionTokenHash`), ensuring raw bearer credentials are never exposed in database dumps.
- In-Auditorium Local Edge Streaming: Routing supports configured cinema LAN edge URLs with a cloud fallback. Deployment, latency, cellular-data use, and playback continuity have not been verified at a partner venue.
- Dynamic Optical Glass Shader Engine (`DynamicGlassSurface`): High-performance WebGL/GLSL shader implementing rounded-rectangle signed-distance field (SDF) refraction displacement, normal-derived rim lighting, interactive specular glints, and parallax layer displacement.
- Adaptive Video Streaming Player (`CinemaCanvasPlayer`): HLS-capable player with session watermarks and layered screen-capture risk controls.
- Theatre Management System (TMS) Automation Bridge: Webhook adapter and background daemon (`tms-bridge/`) for automated play/pause/stop timeline synchronization with Dolby IMS, Christie, Barco, and Vista projection servers.
- Native Mobile Shells: Cross-platform Capacitor configurations (`android/`, `ios/`), Android App Links, and Apple Universal Links (`public/.well-known/apple-app-site-association`).

### Current Validation Boundary

The Android customer app was exercised in an API 37 emulator using a debug-only build, a local development API, simulator verification codes, and a disposable database. Registration, session restoration, claim-link handling, permission flows, scanner launch, and playback of a public CC0 sample clip were checked. This does not validate licensed streams, QR decoding, production messaging, physical devices, iOS, or store acceptance. See [the mobile validation guide](mobile.md) for details and release prerequisites.

---

## 2. Security Remediations and Hardening

1. **Authentication Token Hashing**: Added SHA-256 hashing for all patron session tokens and operator sessions at rest in PostgreSQL.
2. **Tenant Scoping & Isolation**: Enforced strict `cinemaId` scoping across all screening, ticket, and session queries to eliminate multi-tenant data leaks.
3. **Webhook Cryptographic Verification**: POS admission webhooks are verified via HMAC-SHA256 signatures (`x-pos-signature`) with timestamp replay protection (`x-pos-timestamp`, 300s window).
4. **Session Break Quota Enforcement**: Atomic enforcement of max 2 breaks and 900 seconds per ticket.
5. **Dynamic Percentage Billing**: Companion fees are calculated dynamically as a percentage (default 15%) of the verified ticket admission price.
6. **QR-Code Ticket Verification**: Made ticket verification unskippable on `/watch` for web patrons; eliminated the redundant SMS OTP requirement once ticket entitlement is verified.
7. **Mobile App Bathroom Tab**: Seamless 1-tap activation in `BathroomView.tsx` for registered mobile app patrons.
8. **Platform Admin Studio Rights**: Implemented content rights licensing matrix (`/x` tab `rights`) connected to `/api/admin/rights`.
9. **Forensic Dynamic Watermarking**: Canvas-rendered patron seat, screening ID, and UTC timestamp overlays over live video frames.
10. **On-Prem Edge Streaming**: Micro-caching proxy architecture intended to support local delivery; venue performance and zero-buffering behavior are not established by this repository audit.

---

## 3. Component-by-Component Architecture

### Route & Presentation Layer
- `src/app/page.tsx`: Business Landing Page presenting companion viewing to theater circuits and patrons.
- `src/app/watch/page.tsx`: Dedicated Customer Application for web patrons and Capacitor wrappers with unskippable ticket verification and instant 1-tap break activation.
- `src/app/operator/page.tsx`: Enterprise Cinema Operations Dashboard with live screening monitors, edge streaming controls, and break session termination.
- `src/app/cinema/page.tsx`: Cinema Control Console for auditorium status.
- `src/app/x/page.tsx`: Platform Super-Admin Workspace with Studio Rights licensing provisioning.

### Design Tokens & Brand System
- Primary: `#FFB800`
- Secondary: `#F59E0B`
- Accent: `#171717`
- Neutral Background: `#FFFDF7`
- Surface: `#FFFFFF`
- Border: `#E5E7EB`
- Primary Text: `#111111`
- Secondary Text: `#6B7280`
- Typography: `Plus Jakarta Sans`

### Mobile & Native Strategy
- Capacitor native shells configured in `android/` and `ios/`.
- Deep linking configured via `android/app/src/main/AndroidManifest.xml`, `public/.well-known/assetlinks.json`, and `public/.well-known/apple-app-site-association`.

---

## 4. Verification and Test Suite

The current automated Vitest suite passes 119 tests across 5 files (`npm test`, run 2026-11-03):
- `tests/security-auth.test.ts`
- `tests/edge-streaming.test.ts`
- `tests/feedback-support.test.ts`
- `tests/account-deletion-security.test.ts`
- `tests/pottyplay.test.ts`

These tests do not replace production integration testing, mobile-device testing, or store review.
