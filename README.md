# PottyPlay: Cinema Companion Viewing Platform

PottyPlay is an enterprise cinema companion-viewing technology platform designed for theatrical exhibitors, cinema circuits, and film festival organizers.

The platform enables authenticated cinema patrons to temporarily follow an ongoing theatrical screening on their personal mobile devices during a brief intermission (restroom break, concession run) without losing their place in the film. It strictly enforces a maximum session duration of 15 minutes (900 seconds), a limit of two breaks per ticket, server-authoritative projection synchronization, carrier-grade Africa's Talking SMS verification, studio anti-piracy screen capture restrictions, in-auditorium local edge streaming, native mobile hardware perimeter protection, and idempotent usage billing.

## Project Status

Android customer flows have been exercised in an API 37 emulator using a debug-only build, a local development API, simulator verification codes, and a disposable PostgreSQL database. The test covered registration and verification, session restore, ticket claim deep links, camera permission handling and scanner launch, notification permission, and playback of a public CC0 sample clip. This does not verify licensed cinema streams, QR decoding, production SMS/email delivery, physical-device behavior, or store acceptance. See [the mobile guide](docs/mobile.md) for the test scope and release prerequisites.

The current checkout does not have a confirmed production HTTPS API origin, and iOS has not been built or tested on macOS/Xcode. Do not distribute the emulator debug build. Production release remains blocked until the publisher supplies and verifies the production service and store configuration.

---

## 1. Product Interfaces & Capabilities

### 1.1 Public Exhibitor Marketing Website (`/`)
- Marketed specifically to cinema owners, exhibitors, and technical decision-makers.
- **Glisse Liquid Glass UI Architecture:**
  - Integrated optical glass material across all cards, navigation docks, and buttons.
  - Three-pillar landing header architecture: Brand Logo in a left glass capsule, central floating glass navigation dock housing all navigation links and the Companion App launcher, and an outlined primary `Register Cinema` CTA button placed prominently outside the dock.
  - Interactive hero carousel featuring optical `<GlisseGlass>` device containers with frosted telemetry screens, live audio wave animation, and zero layout shift.
- Animated, automatically transitioning hero carousel highlighting 4 core messages:
  1. *Never lose your place.*
  2. *A better cinema experience.*
  3. *The story continues.*
  4. *Built for cinema operators.*
- 12 comprehensive landing page sections including product proposition, theater benefits, screening synchronization, ticketing interoperability, security perimeters, and direct partner inquiry dispatching.
- **Dynamic Optical Glass Shader Engine:** Real-time WebGL GLSL fragment shader rendering signed-distance-field (SDF) rounded convex lenses, tri-channel chromatic dispersion (nR, nG, nB), Schlick's Fresnel reflectivity, thin-film spectral iridescence coating, and device gyroscope tilt parallax across all header docks and surface cards.
- **SSR-Hardened Optics & Build Stability:** Defensive server-side rendering guards across all glass internals preventing `ReferenceError` on `window`, `document`, `navigator`, or `devicePixelRatio`, backed by direct CSS module bundling in `src/app/layout.tsx` and Capacitor `transpilePackages` in `next.config.ts`.
- **Bot Defense & Origin Logging:** Automated scrapers are trapped by hidden form honeypot fields (`website_url_hp`); inquiring circuits have IP addresses and HTTP User-Agent signatures recorded for fraud auditing.

### 1.2 Customer Application (Native Mobile Shell)
- Shared React/TypeScript codebase compiled directly into native iOS and Android packages via Capacitor 8.
- **Strict Native Perimeter Gating:**
  - Standard web browsers requesting `/app` receive an immediate `404 Not Found` response via middleware.
  - The patron application, authentication screens, and all 5 companion tabs are accessible exclusively through the native mobile emulator or physical device container.
- **True Native Mobile Hardware Architecture:**
   - **Native Secure Storage (`@aparajita/capacitor-secure-storage`):** Session tokens, customer profiles, and pending ticket data use the platform secure-storage plugin on Android and iOS. Non-sensitive preferences use `@capacitor/preferences`.
   - **Native OS Break Reminders (`@capacitor/local-notifications`):** Schedules alerts for 3 minutes and 1 minute before the break ends when notification permission is granted. Delivery, sound, and vibration remain subject to device settings and operating-system policies.
  - **Hardware Haptics Engine (`@capacitor/haptics`):** Taptic Engine and linear resonant vibrator motor patterns for tab switches, modal swipe triggers, and urgent countdown alerts.
  - **Real-Time Network Monitoring (`@capacitor/network`):** Monitors network interface transitions (Wi-Fi vs Cellular) to instantly switch between in-auditorium LAN edge servers and cloud WAN fallbacks.
  - **Hardware Back Button Interception (`@capacitor/app`):** Dismisses open modal dialogs (`CustomerAuthModal`, `ReportIssueModal`) or returns the user to the primary "Bathroom" tab before allowing operating system app minimization.
  - **Screen Wake-Lock Management:** Native screen wake-lock prevents display dimming and screen sleep during active bathroom playback.
  - **Pan-to-Dismiss Gestures:** Modal sheets support touch-drag gestures with rubber-banding physics and haptic trigger cues.
  - **Studio-Grade Screen Security:** Integrates `@capacitor-community/privacy-screen` enforcing OS-level `FLAG_SECURE` on Android (rendering screenshots and screen recordings completely black) and privacy snapshot blanking on iOS when the App Switcher is engaged.
  - **Responsive Scaling:** Dynamic safe-area padding (`pt-safe`, `pb-safe`, `bottom-safe-dock`) engineered for narrow mobile screens (<360px), flagship phones, and iPad tablets.
- **Universal Optical Glass Styling:** Full platform integration of the Dynamic Optical Glass Shader Engine with spectral rainbow iridescence, caustic edge rims, and pointer-tracked glint sweeps.
- **Mandatory Customer Registration & Authentication:**
  - Streamlined registration form requiring Full Name, Phone Number (+255 E.164), Email, and Password (hashed with Argon2id).
  - Explicit single checkbox requiring affirmative consent to Terms of Service and Privacy Policy (recording exact version and timestamp).
  - Two-stage verification: Africa's Talking SMS OTP plus 6-digit email confirmation code prior to account activation.
  - Strict unauthenticated gating: unauthenticated users cannot access customer tabs or session controls.
- **5 Core Tabs:**
  1. **Cinema Discovery:** Truthful zero-partner state until venues are formally reviewed and approved by platform administrators.
  2. **Ticket-Linked Reminders:** Configurable reminders (24 hours, 1 hour, 30 minutes before showtime) linked to verified tickets.
  3. **Bathroom Mode:** One-tap activation without repeated QR code scanning or SMS OTP challenges. Displays 2-break allowance and live 900-second countdown.
  4. **Viewing History:** Cursor-based paginated history of past sessions with cinema details and outcomes.
  5. **Customer Settings:** Profile overview, Light/Dark/System theme switching without startup flash, notification preferences, legal policies, support contact, truthful app rating state, secure session sign-out, and PDPA 2022 account deletion workflow.

### 1.3 QR Browser Companion for Non-App Patrons (`/watch`)
- Direct web-based journey for customers scanning an auditorium QR code without the native app.
- **Mandatory Patron Phone Registration Barrier:** To comply with studio anti-piracy licensing, anonymous stream activation is blocked; patrons must verify their mobile telephone identity via Africa's Talking SMS OTP before authorization.
- **Web Anti-Piracy Protections (`CinemaCanvasPlayer.tsx`):**
  - Continuous dynamic floating forensic watermark rendering: `LICENSED PATRON: [phone/ID] • SESSION ID: [ID] • TC: [timecode]`.
  - Active capture interception: blocks `PrintScreen`, Mac `Cmd+Shift+3/4/5`, Windows Snipping Tool `Win+Shift+S`, and `Ctrl+P`.
  - Focus loss blanking: listens to `window.blur` and `document.visibilitychange` to immediately black out the video stream with a studio DRM advisory overlay whenever tab switching or screen capture tools engage.
  - Clipboard clearing: wipes the system clipboard upon `PrintScreen` release.
  - Context menu and drag selection suppressed.

### 1.4 Cinema Operator Workspace (`/operator` / `operations.pottyplay.domain`)
- Secure, tenant-isolated workspace for authorized cinema staff.
- Dedicated operator authentication with password recovery workflow (no public self-registration).
- **Real-Time Auditorium Telemetry:** Active break session tracking, manual usher revocations with required rationale, and audit ledgers.
- **Patron Feedback & Issue Triage Queue:** Real-time triage inbox to inspect, categorize, and resolve patron reports (audio sync drift, buffering, video freezing, ticket issues, facility feedback) with auditorium and seat context.
- **In-Auditorium Local Edge Streaming Controls:** Monitor LAN edge server health, NGINX micro-cache hit rates, active client connections, and cloud WAN fallback failover status.
- **Commercial Pricing Configuration:** Cinema-specific commercial pricing tiers (per-session rates, currency, status) preserving historical billing records.

### 1.5 Dedicated Support & Help Center (`/support`)
- Public patron support hub addressing technical and ticketing inquiries.
- **Categorized Knowledge Base:** Searchable FAQs covering ticket verification, bathroom mode limits, audio/video synchronization, and privacy protections.
- **Live Ticket Dispatch Form:** Direct submission channel with automated routing to support engineering and cinema guest services.

### 1.6 Private Platform Administration (`/x` / `setapart.pottyplay.domain`)
- Restricted administration portal with rate-limited authentication, session management, and audit logging.
- Global operational oversight: partner review and approval workflow, global usage ledger, approved cinemas, active sessions, and security events.
- **Expiring Circuit Invitation System:** Dispatches one-time onboarding links to verified cinema applicants that expire after 48 hours or immediately upon receipt of credentials in the database.
- Strictly isolated by domain routing: the public marketing domain blocks `/x` and unmapped `/admin` routes.

### 1.7 Developer Portal (`/developers`)
- Complete integration documentation for cinema IT teams, POS vendors (Vista, Veezi, RTS), and TMS projection servers.
- **OpenAPI 3.1 Specification (`/api/openapi.json`):** Canonical, machine-readable REST API schema ready for direct import into Postman, Insomnia, or client SDK generators.
- Detailed technical guides covering edge streaming routing, POS ticket webhooks, and session lifecycle events.

### 1.8 Theater Projection Console (`/cinema`)
- Authoritative master projection timeline and synchronization engine for development, testing, and partner demonstrations.
- Simulates in-theater projection servers (e.g., Dolby IMS3000, Christie TMS), displaying live movie playback, play/pause controls, timeline scrubbing, SMPTE timecode drift controls, and active restroom viewers.

### 1.9 Controlled Presentation Experience (`/presentation`)
- Controlled demonstration route for prospective exhibition partners.
- Features simulated auditorium projection playback and live QR codes linking to verified test fixtures.

### 1.10 Tanzanian Legal & Privacy Pages (`/terms`, `/privacy`)
- Grounded in Tanzania's Personal Data Protection Act 2022 (PDPA 2022), the Electronic Transactions Act 2015, and TCRA communications frameworks.
- Transparent data collection declarations: zero geolocation tracking, zero biometric harvesting, 90-day retention policies, and clear user rights (access, rectification, erasure).
- **Automated PII Deletion Worker:** Two-stage deletion process with a 30-day grace period, followed by automated database anonymization via scheduled cron tasks (`/api/cron/purge-deleted`).

---

## 2. Dynamic Optical Glass Shader Engine

PottyPlay features a custom Dynamic Optical Glass Shader Engine that brings physical optical realism across all platforms:

- **WebGL GLSL Fragment Shader:** Employs signed distance fields (SDF) to model rounded-box physical boundaries with mathematically precise corner rounding.
- **Parabolic Surface Convexity:** Computes true surface normals using a 3D dome height function to calculate ray incidence angles.
- **Tri-Channel Chromatic Dispersion:** Simulates realistic light bending across individual color wavelengths (red = 1.515, green = 1.520, blue = 1.525), splitting light into subtle RGB fringing at steep viewing angles.
- **Schlick Fresnel Reflectivity:** Computes angle-dependent specular reflectance based on incident view angle and base surface index of refraction.
- **Thin-Film Spectral Iridescence:** Multi-layer optical interference producing iridescent color shifts that dynamically react to light vectors.
- **Gyroscopic Parallax & Pointer Tracking:** Hardware device tilt tracking (`deviceorientation`) and cursor positioning synchronize CSS variables (`--tilt-x`, `--tilt-y`, `--glint-x`, `--glint-y`) to provide responsive depth and sheen glints.
- **Universal Fallback Hierarchy:** Seamlessly degrades from high-precision WebGL fragment rendering to hardware-accelerated CSS backdrop filters (`backdrop-filter: blur()`, `saturate()`, `brightness()`) on lower-power devices.

---

## 3. In-Auditorium Local Edge Streaming & TMS Bridge

PottyPlay is designed to prefer a cinema's local edge stream when configured and reachable, with a cloud route available as a fallback. Latency, mobile-data use, and playback continuity depend on the cinema deployment and network conditions:

1. **Dual-Path Edge Router (`src/lib/edge-streaming.ts`):** Client devices automatically probe local auditorium Wi-Fi for an on-premise edge server (`http://edge.pottyplay.local` or cinema LAN IP). If detected, media segments are fetched directly over the high-speed local network.
2. **Cloud Fallback:** If a configured local edge node is unavailable, the player can use the configured cloud source. Failover timing and playback continuity depend on the venue network and stream configuration and have not been verified at a partner cinema.
3. **Local Edge Server (`edge-server/`):**
   - High-performance NGINX micro-cache configuration (`edge-server/nginx-edge.conf`).
   - Caches encrypted HLS segments in memory with byte-range support.
   - Deployable via Docker Compose (`edge-server/docker-compose.edge.yml`) on lightweight local appliance hardware (Intel NUC, Mac mini, or rackmount server).
4. **TMS Bridge Daemon (`tms-bridge/`):**
   - Standalone daemon (`tms-daemon.ts`) communicating with digital cinema servers (Christie, Barco, Dolby IMS3000) via SNMP and TCP socket interfaces.
   - Extracts authoritative SMPTE timecodes and transmits sub-second synchronization telemetry to the PottyPlay sync engine.

---

## 4. Africa's Talking SMS Integration

Africa's Talking SMS infrastructure powers patron authentication and security fallback:

1. **Two-Factor Authentication:** Generates 6-digit numeric OTPs dispatched via Africa's Talking Messaging API (`/version1/messaging`).
2. **Cryptographic Protection:** OTP codes are hashed with SHA-256 and server-side salts; plaintext codes are never stored.
3. **Resilient Dual-Mode Adapter:** Configured via `AT_SIMULATOR_MODE`. Connects directly to telecom gateways in production, or utilizes a mock simulator adapter in development.

---

## 5. Technology Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript 5 (Strict Mode enabled)
- **Typography:** Familjen Grotesk
- **Cryptography:** Argon2id (`@node-rs/argon2`) for credentials, SHA-256 for OTP hashes and signatures
- **Optical Glass Engine:** Custom WebGL GLSL Shader Engine, SVG displacement filters, Schlick Fresnel reflectivity, and thin-film spectral iridescence
- **Native Mobile Container:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)
  - `@capacitor/preferences` (Hardware Keystore & Keychain storage)
  - `@capacitor/haptics` (Taptic Engine tactile feedback)
  - `@capacitor/local-notifications` (OS background alarm scheduling)
  - `@capacitor/network` (Real-time network interface monitoring)
  - `@capacitor/app` (Hardware back-button and lifecycle management)
  - `@capacitor-community/privacy-screen` (OS screenshot & screen-recording DRM blocker)
- **Database & Transactions:** PostgreSQL 16 with Prisma ORM
- **In-Auditorium Edge Streaming:** NGINX micro-caching, HLS segment proxies, and TMS integration bridge
- **Testing:** Vitest automated unit, integration, and security tests
- **Containerization:** Multi-stage Dockerfile and Docker Compose

---

## 6. Brand Design Tokens

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

## 7. Local Setup and Installation

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

7. Run Patron App in Native Android Emulator or iOS Simulator:
   ```bash
   # Build and bundle the customer app, then sync native assets and plugins
   CAPACITOR_SERVER_URL="https://<deployed-pottyplay-origin>" npm run cap:build
   
   # Launch project in Android Studio or Xcode emulator
   npx cap open android
   npx cap open ios
   ```

---

## 8. Testing and Verification

Run the automated test suite (119 tests across 5 test files at the last documented validation):
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

## 9. Content Rights and Disclaimers

- PottyPlay starts with 0 partner circuits in production and development databases; venues apply through the partner onboarding workflow and are reviewed by platform administrators.
- Video playback utilizes authorized visual demonstration assets with dynamic HTML5 canvas watermarking and SMPTE timecode display.
- PottyPlay does not access, decode, or redistribute Digital Cinema Packages (DCPs) without studio licensing.
