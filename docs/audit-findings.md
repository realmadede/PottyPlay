# PottyPlay: Architecture and Design Audit Findings

## 1. Executive Summary

PottyPlay has strong foundational business logic:
- A PostgreSQL database with explicit relations for venues, screens, screenings, tickets, sessions, and billing.
- Server-authoritative playback position calculation with freeze on pause.
- Idempotent billing event handling.
- Africa's Talking SMS integration with provider abstraction.
- A 15-test automated Vitest suite verifying the critical security invariants.

However, the platform currently exhibits several architectural and design shortcomings that must be corrected:
1. **Legacy Temporary Positioning**: Multiple legacy strings, comments, and defaults required cleansing into long-term enterprise technology company standards.
2. **Coupled Routing**: The public root URL (`/`) currently doubles as both a basic marketing splash and the mobile customer flow. It also publicly exposes direct links to internal operator and cinema simulator consoles.
3. **Visual Inconsistency**: The current theme uses a dark cinema palette with high contrast yellow/black rather than the mandatory brand system (`#FFFDF7` neutral warm background, `#FFB800` primary yellow accents, `#171717` charcoal, and `#111111` typography).
4. **Authentication Redundancy**: Customers must execute an SMS OTP flow on every single session initiation, creating unacceptable friction for patrons already inside a theater with verified entitlements.
5. **Fictional Demonstration Data**: The database seed populates invented sessions, customers, and billing metrics rather than providing legitimate administration workflows with truthful empty states.
6. **Mobile Package Absence**: While responsive in mobile browsers, the project lacks Capacitor configuration, App Links / Universal Links definitions, and deep-link routing for Android and iOS targets.

---

## 2. Component-by-Component Findings

### Route & Presentation Layer
- `src/app/page.tsx`: Currently an 8-state customer wizard that lives at `/`. Must be separated into:
  - `/`: Dedicated, editorial Business Landing Page (Apple-inspired clarity, explaining companion viewing to theater chains and patrons, with no internal consoles exposed).
  - `/watch`: Dedicated, mobile-native Customer Application (shared between web and Capacitor wrappers).
  - `/cinema`: Restricted cinema control console (replaces `/simulator`).
  - `/operator`: Enterprise cinema operations dashboard.
- `src/components/NavigationHeader.tsx`: Publicly links to `/simulator` and `/operator`. These internal links must be removed from public landing navigation and placed behind authenticated operator routes.

### Design Tokens & Brand System
- `tailwind.config.ts`: Defined `cinema-950` to `cinema-50` dark shades. Needs migration to the exact mandatory tokens:
  - Primary: `#FFB800`
  - Secondary: `#F59E0B`
  - Accent: `#171717`
  - Neutral Background: `#FFFDF7`
  - Surface: `#FFFFFF`
  - Border: `#E5E7EB`
  - Primary Text: `#111111`
  - Secondary Text: `#6B7280`
  - Success: `#16A34A`
  - Error: `#DC2626`
  - Warning: `#D97706`
  - Font: `Plus Jakarta Sans`

### Ticket Entitlement & Authentication
- `src/features/tickets/ticket-service.ts`: Ticket verification currently only supports manual entry of ticket numbers (e.g. `TK-XXXX-YYYY`). Needs support for:
  - Cryptographic Claim Tokens (unpredictable token from QR/barcode)
  - Device/Session authentication caching for returning patrons (bypassing redundant SMS OTP challenges)
  - SMS OTP reserved for account registration, recovery, and security fallback.

### Database & Seed Records
- `prisma/schema.prisma`: Needs additions for `claimToken` on `DemonstrationTicket` (renamed conceptually to `TicketEntitlement`), tenant scoping, and neutral disclaimer fields.
- `prisma/seed.ts`: Seeds fake pre-activated sessions and hardcoded customer names. Production and clean environments must start with truthful zero states and include administrative creation utilities.

### Mobile & Native Strategy
- Lacks Capacitor configuration (`capacitor.config.ts`), mobile build scripts, and deep link assets (`assetlinks.json`, `apple-app-site-association`).

---

## 3. Migration Roadmap

1. **Phase 2**: Brand tokens, Plus Jakarta Sans typography, and Business Landing Page (`/`).
2. **Phase 3**: Customer Experience (`/watch`) with returning patron recognition and ticket claim token support.
3. **Phase 4**: Capacitor mobile packaging and deep-link configuration.
4. **Phase 5**: Redesigned Operator Console (`/operator`) and Cinema Control Interface (`/cinema`).
5. **Phase 6**: Truthful database state, administrative creation workflows, and security hardening.
6. **Phase 7**: Comprehensive test suite expansion and documentation rewrite.
