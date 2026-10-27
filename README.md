# PottyPlay: Cinema Companion Viewing Platform

Built for the Africa's Talking Open Hackathon: Build Anything (Dar es Salaam, Tanzania, 31 October 2026).

PottyPlay enables an authenticated cinema patron to follow an ongoing cinema screening on their personal mobile device during a temporary break (restroom, concessions, urgent call). It features a strict maximum session limit of 15 minutes (900 seconds), server-authoritative playback synchronization, Africa's Talking SMS verification, and idempotent usage billing.

## 1. Problem and Impact

Cinema patrons often postpone or dread taking a restroom break during a movie because missing even three minutes can ruin a film's narrative arc. Simultaneously, theater chains struggle with patron distraction and safety when guests rush through dark auditoriums.

PottyPlay solves this by providing a companion viewing window bounded to 15 minutes. It keeps cinema patrons connected to the ongoing screening while preventing unauthorized long-term streaming or piracy through strict server-side access controls, time-bounded tokens, and rights validation.

## 2. Meaningful Use of Africa's Talking APIs

Africa's Talking SMS infrastructure forms the verification backbone of the customer lifecycle:

1. **Two-Factor Authentication Challenge:** When a patron enters their phone number (+255 Tanzanian or international format), PottyPlay creates an expiring challenge and sends a 6-digit numeric OTP via Africa's Talking SMS API (`/version1/messaging`).
2. **Cryptographic Protection:** OTP codes are hashed with SHA-256 and salt; raw OTPs are never stored in the database or exposed in production logs.
3. **Session Activation Confirmation:** Upon successful ticket and OTP validation, an SMS confirmation is dispatched to the customer detailing their seat and exact session expiration time.
4. **Graceful Degradation with Development Simulator:** If Africa's Talking production credentials are not configured (`AT_SIMULATOR_MODE="true"`), PottyPlay uses a clearly labelled development SMS simulator that records and displays delivery attempts without network dependencies.

## 3. Technology Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript 5 (Strict Mode enabled)
- **UI & Styling:** React 19, Tailwind CSS, Lucide SVG Icons (Zero emojis used)
- **Database & Transactions:** PostgreSQL 16 with Prisma ORM
- **Validation:** Zod
- **SMS Integration:** Africa's Talking SMS API + Development Simulator Adapter
- **Testing:** Vitest automated test suite (15 automated unit & integration tests)
- **Containerization:** Docker multi-stage build and Docker Compose

## 4. Key Architecture Principles

- **Authoritative Backend Clock:** The cinema simulator provides the single source of truth for playback position. The client player synchronizes with the server every 4 seconds.
- **Server-Side Expiration Enforcement:** The 15-minute countdown is enforced on the server. If `expires_at` is reached, backend APIs reject access, immediately ending the stream.
- **Idempotent Billing:** Successful session activations generate exactly one qualifying billing event (500 TZS demo rate). Page reloads or duplicate requests never trigger duplicate charges.
- **Single-Device Ticket Lock:** One ticket allows only one active session. Duplicate activation attempts are rejected atomically inside database transactions.
- **Content Rights Boundary:** Demonstration assets require explicit database rights authorization matching the venue and time window before playback can be initiated.

## 5. Local Setup and Installation

### Prerequisites

- Node.js v20+ or v24+
- Docker & Docker Compose (or local PostgreSQL)
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

4. Start PostgreSQL database (using Docker):
   ```bash
   docker run -d --name pottyplay-db -p 5433:5432 -e POSTGRES_USER=pottyplay -e POSTGRES_PASSWORD=pottyplay_secret -e POSTGRES_DB=pottyplay postgres:16-alpine
   ```

5. Apply database migrations and seed demonstration data:
   ```bash
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
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
| `AT_SIMULATOR_MODE` | Set `false` to use live Africa's Talking API | `true` |
| `AT_API_KEY` | Africa's Talking API key | (empty in simulator) |
| `AT_USERNAME` | Africa's Talking username | `sandbox` |
| `AT_SENDER_ID` | Approved SMS shortcode / sender ID | (optional) |
| `DEMO_PRICE_PER_SESSION_TZS` | Simulated price per qualifying session | `500` |
| `MAX_SESSION_DURATION_SECONDS` | Maximum session duration | `900` |
| `OTP_EXPIRY_SECONDS` | OTP valid lifetime in seconds | `300` |
| `OTP_MAX_ATTEMPTS` | Max verification attempts per OTP | `3` |

## 7. Testing and Verification

Run the comprehensive automated test suite covering all 15 required verification criteria:

```bash
npm test
```

Run TypeScript strict type checking:
```bash
npm run typecheck
```

Run production build:
```bash
npm run build
```

## 8. Docker Deployment

To build and run the complete multi-container setup via Docker Compose:

```bash
docker compose up --build -d
```

Check application health endpoint:
```bash
curl http://localhost:3000/api/health
```

## 9. Content Rights and Demonstration Assets

For this hackathon demonstration:
- All movie titles, screening schedules, and ticketing references are simulated.
- Playback uses an authorized synthetic demonstration asset with an interactive SMPTE timecode canvas renderer, ensuring zero copyright infringement and zero dependency on unauthorized commercial movie DCPs.
- Clear disclaimers appear throughout the interface indicating that Century Cinemax integrations and financial records are simulated for the demonstration.

## 10. Current Limitations and Roadmap

- **Ticketing Integration:** Uses a simulated ticketing database. Production roadmap plans direct integration with Vista Cinema API or POS ticketing adapters.
- **DRM Protection:** The MVP enforces server-side time-bounded tokens and video access gating. Production deployments will integrate Widevine / FairPlay DRM via AWS Elemental MediaPackage or Azure Media Services.
- **Payment Processing:** Uses simulated billing events. Production roadmap will introduce Africa's Talking Mobile Money / USSD checkout for cinema patrons.
