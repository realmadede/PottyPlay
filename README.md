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
- Authenticated patron accounts supporting Phone Number OTP, Email/Password, and OAuth (Google / Apple).
- 4 Core Tabs:
  1. **Cinema Discovery**: Real participating, approved cinema circuits, venue locations, and active screening schedules.
  2. **Ticket-Linked Reminders**: Configurable reminders (24 hours, 1 hour, 30 minutes before showtime) linked to verified tickets.
  3. **Bathroom Mode**: One-tap activation without repeated QR code scanning or SMS OTP challenges. Displays 2-break allowance and live 900-second countdown.
  4. **Viewing History**: Cursor-based paginated history of past sessions with cinema details and outcomes.

### 1.3 QR Browser Companion for Non-App Patrons (`/watch`)
- Direct web-based journey for customers scanning an auditorium QR code without the app.
- Validates ticket barcodes and claim tokens, provisions a 900-second browser session, and offers an app-store link for future convenience.

### 1.4 Cinema Operator Workspace (`/operator`)
- Secure, tenant-isolated workspace for cinema staff.
- Screen and screening management, live break counters, manual usher revocations with required rationale, and audit history.
- Cinema-specific commercial pricing configuration (per-session rates, currency, status) preserving historical billing records.

### 1.5 Private Platform Administration (`/admin` / `setapart.pottyplay.co.tz`)
- Restricted administration portal with rate-limited authentication, session management, and audit logging.
- Global operational oversight: partner review and approval workflow, global usage ledger, approved cinemas, active sessions, and security events.

### 1.6 Developer Portal (`/developers`)
- Complete integration documentation for cinema IT teams, POS vendors (Vista, Veezi, RTS), and TMS projection servers.
- OpenAPI 3.1 schema specification (`/api/openapi.json`), webhook specifications, idempotency headers, and rate limits.

### 1.7 Controlled Presentation Experience (`/presentation`)
- Separate, controlled demonstration route for prospective partners.
- Features a simulated auditorium projection feed and a live QR verification code linking to real test fixtures.

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
- **Typography:** Plus Jakarta Sans
- **Design Tokens:** Strict semantic palette (Primary `#FFB800`, Amber `#F59E0B`, Charcoal `#171717`, Bone `#FFFDF7`)
- **Mobile Container:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)
- **Database & Transactions:** PostgreSQL 16 with Prisma ORM
- **Testing:** Vitest automated test suite (18 integration and invariant tests)
- **Containerization:** Multi-stage Dockerfile and Docker Compose

---

## 4. Brand Design Tokens

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| Primary Brand | `#FFB800` | Primary buttons, active highlights, key accents |
| Secondary Brand | `#F59E0B` | Interactive hover states, warm amber accents |
| Accent / Charcoal | `#171717` | Contrast frames, player viewports, dark surfaces |
| Soft Bone White | `#FFFDF7` | Page background |
| Pure White | `#FFFFFF` | Cards, modals, dialog surfaces |
| Border | `#E5E7EB` | Structural dividers, card borders |
| Primary Text | `#111111` | Headings, primary content |
| Secondary Text | `#6B7280` | Metadata, subtitles, captions |
| Success | `#16A34A` | Active streams, verified tickets |
| Error | `#DC2626` | Revoked sessions, expired breaks |
| Warning | `#D97706` | Approaching session expirations |

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

5. Deploy migrations and seed demonstration data:
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

- Cinema venue references, movie titles, and screening schedules are demonstration fixtures.
- Video playback utilizes authorized visual demonstration assets with dynamic HTML5 canvas watermarking and SMPTE timecode display.
- PottyPlay does not access, decode, or redistribute Digital Cinema Packages (DCPs) without studio licensing.
