# PottyPlay Architecture Decision Document

## 1. Overview

PottyPlay is structured as a TypeScript modular monolith designed for reproducible deployment, predictable transaction isolation, and simple operational maintenance.

## 2. System Topology

```
+--------------------------------------------------------------------------------------------------+
|                                  Next.js 15 & React 19 Client                                    |
|  +------------------------+  +------------------------+  +------------------------------------+  |
|  |  Public Business Site  |  | Customer Viewer (/watch)|  | Theater Consoles (/cinema & /oper) |  |
|  +------------------------+  +------------------------+  +------------------------------------+  |
|                               (Web + Capacitor Mobile)                                           |
+--------------------------------------------------------------------------------------------------+
                                               |
                                               v
+--------------------------------------------------------------------------------------------------+
|                                    Next.js App Router API                                        |
|   /api/tickets/verify  |  /api/auth/otp/*  |  /api/sessions/*  |  /api/operator/*  |  /api/health    |
+--------------------------------------------------------------------------------------------------+
                                               |
                                               v
+--------------------------------------------------------------------------------------------------+
|                                       Feature Domain Services                                    |
|   +--------------------+  +--------------------+  +-----------------------+  +----------------+  |
|   |   TicketService    |  |   SessionService   |  |   ScreeningService    |  | RightsService  |  |
|   +--------------------+  +--------------------+  +-----------------------+  +----------------+  |
|   |   BillingService   |  |     OtpService     |  |   SmsService & AT     |                      |
|   +--------------------+  +--------------------+  +-----------------------+                      |
+--------------------------------------------------------------------------------------------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
      +------------------------------+                   +-------------------------------+
      |    PostgreSQL 16 Database    |                   |   Africa's Talking SMS API    |
      |    - Master Timeline Clock   |                   |   - Two-Factor OTP SMS        |
      |    - Unique Ticket Lock      |                   |   - Session Confirmations     |
      |    - Idempotent Billing      |                   |   - Expiration Alerts         |
      |    - Tamper-Evident Audit    |                   |   - Recovery Gating           |
      +------------------------------+                   +-------------------------------+
```

## 3. Core Architectural Invariants

### 3.1 Authoritative Master Projection Clock
Client-side video clocks drift, desynchronize when mobile apps are backgrounded, and are vulnerable to client clock manipulation. In PottyPlay:
- The projection state is maintained on the server (`Screening` model).
- Current position is calculated using reference position + elapsed time since last update (`computePlaybackPosition`).
- Auditorium pauses freeze the clock cleanly without drift.
- Customer players query the server heartbeat every 6 seconds to maintain frame-level synchronization.

### 3.2 Atomic Activation & Concurrency Control
To guarantee that one ticket cannot be used on multiple devices or activated multiple times:
- Session activation occurs inside an atomic PostgreSQL transaction (`prisma.$transaction`).
- The ticket status is checked and updated from `VALID_ADMITTED` to `ALREADY_ACTIVATED` atomically.
- Unique constraints on `ticketId` in `BreakSession` enforce single-session limits at the database engine level.

### 3.3 Server-Side Hard Session Expiration
The commercial companion concept requires strict enforcement of the 15-minute limit:
- The client countdown timer is purely informational.
- Access to the stream and playback metadata requires an active session token.
- When `now >= expiresAt`, the server flags the session as `EXPIRED`, rejects further sync requests, and logs an audit event.

### 3.4 Direct Entitlement Claim & Session Reuse
- Returning patrons with active sessions do not repeat OTP challenges upon scanning seat QR codes.
- One-time patrons activate viewing breaks directly using unique seat claim tokens (`claimToken`).
- Africa's Talking SMS OTP is retained as a robust identity verification, recovery, and security fallback channel.

### 3.5 Idempotent Billing Ledger
Every qualifying session activation records an idempotent billing event:
- The `UsageBillingEvent` table maintains a `@unique` constraint on `sessionId`.
- `BillingService.recordActivationBilling` checks for existing records before insertion and runs within the activation transaction boundary.
