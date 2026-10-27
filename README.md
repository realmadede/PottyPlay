# PottyPlay: Cinema Companion Viewing Platform

PottyPlay is an independent cinema companion-viewing technology platform designed for theatrical partnerships.

The platform enables authenticated cinema patrons to temporarily follow an ongoing theatrical screening on their personal mobile devices during a short break (restroom, concessions, urgent call) without losing their place in the film. It enforces a strict maximum session limit of 15 minutes (900 seconds), server-authoritative playback synchronization, Africa's Talking SMS verification, and idempotent usage billing.

## 1. Product Capabilities

### 1.1 Patron Viewing Experience (`/watch`)
- **Direct Entitlement & Claim Codes:** Patrons scan their seat QR code or enter their ticket code to activate viewing breaks directly.
- **Session Continuity (Zero OTP Repetition):** Returning patrons with active sessions automatically resume playback upon scanning without repeating phone verification.
- **Auditorium Synchronization:** Video frames remain locked to the cinema auditorium projector in real time.
- **15-Minute Hard Boundary:** Real-time countdown timer backed by server-side session expiration.

### 1.2 Public Business Presentation (`/`)
- Editorial presentation showcasing product benefits, security architecture, and operational workflows for cinema exhibitors and studio partners.
- Clean separation from internal venue controls; no operator links or administrative tooling exposed to the general public.

### 1.3 Theater Projection Console (`/cinema`)
- Master timeline control (Play, Pause, Seek ±30s, Position Calibration) feeding the companion viewing stream.
- Live active break viewer telemetry by auditorium screen and seat number.
- Direct projection pause triggering synchronized auditorium hold states across patron devices.

### 1.4 Cinema Operations Dashboard (`/operator`)
- Real-time operational monitoring of active, expired, and revoked companion sessions.
- Instant operator revocation capability with required audit rationale.
- Africa's Talking SMS delivery logs, transmission statuses, and message costs.
- Idempotent qualifying usage billing ledger.
- Tamper-evident security audit trail.

## 2. Africa's Talking SMS Integration

Africa's Talking SMS infrastructure powers patron communication and security fallback:

1. **Two-Factor Authentication:** Generates 6-digit numeric OTPs dispatched via Africa's Talking Messaging API (`/version1/messaging`).
2. **Cryptographic Protection:** OTP codes are hashed with SHA-256 and server-side salts; plaintext codes are never stored in the database.
3. **Session Confirmations:** Dispatches seat confirmation and expiration reminders to customer devices upon activation.
4. **Resilient Dual-Mode Adapter:** Configured via `AT_SIMULATOR_MODE`. In production, connects directly to Africa's Talking telecom gateway; in development, utilizes a local SMS adapter for offline testing.

## 3. Technology Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript 5 (Strict Mode enabled)
- **Design System:** Plus Jakarta Sans typography, custom design token palette, Lucide SVG icons (Zero emojis)
- **Mobile Container:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)
- **Database & Transactions:** PostgreSQL 16 with Prisma ORM
- **Validation:** Zod
- **Messaging:** Africa's Talking SMS API + Local Development Simulator Adapter
- **Testing:** Vitest automated test suite (18 automated integration tests)
- **Containerization:** Multi-stage Docker build and Docker Compose

## 4. Brand Design Tokens

The application strictly implements the following design system:

| Token | Hex Value | Semantic Usage |
| --- | --- | --- |
| Primary Brand | `#FFB800` | Primary buttons, active highlights |
| Secondary Brand | `#F59E0B` | Interactive hover states, secondary accents |
| Accent | `#171717` | Contrast badges, prominent cards |
| Neutral Background | `#FFFDF7` | Page background |
| Surface | `#FFFFFF` | Cards, modals, dialog surfaces |
| Border | `#E5E7EB` | Structural dividers, card borders |
| Primary Text | `#111111` | Headings, primary content |
| Secondary Text | `#6B7280` | Metadata, subtitles, captions |
| Success | `#16A34A` | Active streams, verified tickets |
| Error | `#DC2626` | Revoked sessions, expired breaks |
| Warning | `#D97706` | Approaching session expirations |

## 5. Local Setup and Installation

### Prerequisites
- Node.js v20+ or v24+
- Docker & Docker Compose
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

4. Start PostgreSQL database container:
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

## 6. Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://pottyplay:pottyplay_secret@localhost:5433/pottyplay?schema=public` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `AT_SIMULATOR_MODE` | Set `false` for live Africa's Talking API | `true` |
| `AT_API_KEY` | Africa's Talking API key | (empty in simulator) |
| `AT_USERNAME` | Africa's Talking username | `sandbox` |
| `AT_SENDER_ID` | Approved SMS shortcode / sender ID | (optional) |
| `DEMO_PRICE_PER_SESSION_TZS` | Simulated price per qualifying session | `500` |
| `MAX_SESSION_DURATION_SECONDS` | Maximum session duration | `900` |
| `OTP_EXPIRY_SECONDS` | OTP valid lifetime in seconds | `300` |
| `OTP_MAX_ATTEMPTS` | Max verification attempts per OTP | `3` |

## 7. Testing and Verification

Run the automated test suite (18 unit, integration, and security invariant tests):
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

## 8. Mobile Architecture & Capacitor

PottyPlay is configured for native mobile deployment via Capacitor:
- **Configuration:** `capacitor.config.ts` (`appId: com.pottyplay.companion`)
- **Android App Links:** `public/.well-known/assetlinks.json`
- **Apple Universal Links:** `public/.well-known/apple-app-site-association`

To synchronize native platforms:
```bash
npx cap sync
```

## 9. Docker Deployment

To build and run the complete multi-container stack:
```bash
docker compose up --build -d
```

Verify service health:
```bash
curl http://localhost:3000/api/health
```

## 10. Content Rights and Disclaimers

- All cinema venue references, movie titles, and screening schedules are simulated for demonstration and architectural evaluation.
- Video playback utilizes an original authorized visual demonstration asset with dynamic HTML5 canvas watermarking and SMPTE timecode display.
- PottyPlay does not access, decode, or redistribute encrypted Digital Cinema Packages (DCPs) or commercial movie files without explicit studio licensing.
