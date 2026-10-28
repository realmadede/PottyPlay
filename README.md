# PottyPlay: Cinema Companion Viewing Platform

PottyPlay is an enterprise cinema companion-viewing technology platform designed for theatrical exhibitors, cinema circuits, and film festival organizers.

The platform enables authenticated cinema patrons to temporarily follow an ongoing theatrical screening on their personal mobile devices during a brief intermission (restroom break, concession run) without losing their place in the film. It strictly enforces a maximum session duration of 15 minutes (900 seconds), a limit of two breaks per ticket, server-authoritative projection synchronization, carrier-grade Africa's Talking SMS verification, and idempotent usage billing.

---

## 1. Product Interfaces & Capabilities

### 1.1 Public Exhibitor Marketing Website (`/`)
- Marketed specifically to cinema owners, exhibitors, and technical decision-makers.
- Distinctive, animated, automatically transitioning hero carousel highlighting 4 core messages:
  1. *Never lose your place.*
  2. *A better cinema experience.*
  3. *The story continues.*
  4. *Built for cinema operators.*
- 12 comprehensive landing page sections including product proposition, theater benefits, screening synchronization, ticketing interoperability, security perimeters, and direct partner registration.

### 1.2 Customer Application (`/app`)
- Single shared React/TypeScript codebase supporting Web, Android, and iOS through Capacitor.
- First-launch welcoming animated introduction with sliding onboarding panels and persistent completion flag.
- Mandatory Customer Registration & Authentication:
  - Streamlined registration form requiring Full Name, Phone Number (+255 E.164), Email, and Password (hashed with Argon2id).
  - Explicit single checkbox requiring affirmative consent to Terms of Service and Privacy Policy (recording exact version and timestamp).
  - Two-stage verification: Africa's Talking SMS OTP plus 6-digit email confirmation code prior to account activation.
  - Strict unauthenticated gating: unauthenticated users cannot access customer tabs or session controls.
- 5 Core Tabs:
  1. **Cinema Discovery**: Truthful zero-partner state until venues are formally reviewed and approved by platform administrators.
  2. **Ticket-Linked Reminders**: Configurable reminders (24 hours, 1 hour, 30 minutes before showtime) linked to verified tickets.
  3. **Bathroom Mode**: One-tap activation without repeated QR code scanning or SMS OTP challenges. Displays 2-break allowance and live 900-second countdown.
  4. **Viewing History**: Cursor-based paginated history of past sessions with cinema details and outcomes.
  5. **Customer Settings**: Profile overview, Light/Dark/System theme switching without startup flash, notification preferences, legal policies, support contact, truthful app rating state, secure session sign-out, and account deletion request.

### 1.3 QR Browser Companion for Non-App Patrons (`/watch`)
- Direct web-based journey for customers scanning an auditorium QR code without the app.
- Validates ticket barcodes and claim tokens, provisions a 900-second browser session, and displays a truthful store availability status ("Store Release Pending / Partner Pilot") without dead store links.

### 1.4 Cinema Operator Workspace (`/operator` / `operations.pottyplay.domain`)
- Secure, tenant-isolated workspace for cinema staff.
- Screen and screening management, live break counters, manual usher revocations with required rationale, and audit history.
- Cinema-specific commercial pricing configuration (per-session rates, currency, status) preserving historical billing records.

### 1.5 Private Platform Administration (`/x` / `setapart.<domain>`)
- Restricted administration portal with rate-limited authentication, session management, and audit logging.
- Global operational oversight: partner review and approval workflow, global usage ledger, approved cinemas, active sessions, and security events.
- Strictly isolated by domain routing: the public marketing domain blocks `/x` and unmapped `/admin` routes.

### 1.6 Developer Portal (`/developers`)
- Complete integration documentation for cinema IT teams, POS vendors (Vista, Veezi, RTS), and TMS projection servers.
- OpenAPI 3.1 schema specification (`/api/openapi.json`), webhook specifications, idempotency headers, and rate limits.

### 1.7 Controlled Presentation Experience (`/presentation`)
- Separate, controlled demonstration route for prospective partners.
- Features a simulated auditorium projection feed and a live QR verification code linking to real test fixtures.

### 1.8 Tanzanian Legal & Privacy Pages (`/terms`, `/privacy`)
- Grounded in Tanzania's Personal Data Protection Act 2022 (PDPA 2022), the Electronic Transactions Act 2015, and TCRA communications frameworks.
- Transparent data collection declarations: zero geolocation tracking, zero biometric harvesting, 90-day retention policies, and clear user rights (access, rectification, erasure).

---

## 2. Africa's Talking SMS Integration

Africa's Talking SMS infrastructure powers patron authentication and security fallback:

1. **Two-Factor Authentication:** Generates 6-digit numeric OTPs dispatched via Africa's Talking Messaging API (`/version1/messaging`).
2. **Cryptographic Protection:** OTP codes are hashed with SHA-256 and server-side salts; plaintext codes are never stored.
3. **Resilient Dual-Mode Adapter:** Configured via `AT_SIMULATOR_MODE`. Connects directly to telecom gateways in production, or utilizes a mock simulator adapter in development.

---

## 3. Technology Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript 5 (Strict Mode enabled)
- **Typography:** Familjen Grotesk
- **Cryptography:** Argon2id (`@node-rs/argon2`) for credentials, SHA-256 for OTP hashes and signatures
- **Design Tokens:** Atmospheric cinematic palette (Heather `#7A5A8E` / `#BFA2D0`, Amber `#F5C451`, Ink `#15191B` / `#E6EAE8`, Mist `#E7EAE8` / `#121517`)
- **Mobile Container:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)
- **Database & Transactions:** PostgreSQL 16 with Prisma ORM
- **Testing:** Vitest automated test suite (23 integration and invariant tests)
- **Containerization:** Multi-stage Dockerfile and Docker Compose

---

## 4. Brand Design Tokens

| Token | Light Value | Dark Value | Semantic Usage |
| :--- | :--- | :--- | :--- |
| `bg` | `#E7EAE8` (231 234 232) | `#121517` (18 21 23) | Atmospheric page background |
| `ink` | `#15191B` (21 25 27) | `#E6EAE8` (230 234 232) | High-contrast typography, primary content |
| `muted` | `#59636A` (89 99 106) | `#9AA4A8` (154 164 168) | Secondary labels, captions, metadata |
| `field` | `#F5F7F6` (245 247 246) | `#1B1F22` (27 31 34) | Card surfaces, form fields, modal containers |
| `heather` | `#7A5A8E` (122 90 142) | `#BFA2D0` (191 162 208) | Signature theatrical purple accent, primary CTA |
| `error` | `#B8382F` (184 56 47) | `#F08A80` (240 138 128) | Revoked sessions, expiration alerts |
| `line` | `rgba(21, 25, 27, 0.14)` | `rgba(230, 234, 232, 0.14)` | Structural borders, hairline dividers |
| `led.amber` | `#F5C451` | `#F5C451` | Active telemetry status, projection sync highlights |

---

## 5. Local Setup and Installation

### Prerequisites
- Node.js v20+ or v24+
- Docker
- npm or yarn

### Step-by-Step Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/realmadede/PottyPlay.git
   cd PottyPlay
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start PostgreSQL container:
   ```bash
   docker run -d --name pottyplay-db -p 5433:5432 -e POSTGRES_USER=pottyplay -e POSTGRES_PASSWORD=pottyplay_secret -e POSTGRES_DB=pottyplay postgres:16-alpine
   ```

5. Deploy migrations and seed platform administrator:
   ```bash
   npm run db:deploy
   npm run db:seed
   ```

6. Start local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 6. Testing and Verification

Run the automated test suite:
```bash
npm test
```

Run TypeScript strict type checking:
```bash
npm run typecheck
```

Run ESLint verification:
```bash
npm run lint
```

Run production application build:
```bash
npm run build
```

---

## 7. Content Rights and Disclaimers

- PottyPlay starts with 0 partner circuits in production and development databases; venues apply through the partner onboarding workflow and are reviewed by platform administrators.
- Video playback utilizes authorized visual demonstration assets with dynamic HTML5 canvas watermarking and SMPTE timecode display.
- PottyPlay does not access, decode, or redistribute Digital Cinema Packages (DCPs) without studio licensing.
