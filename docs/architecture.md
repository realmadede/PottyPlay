# PottyPlay Architecture Decision Document

## Overview

PottyPlay is structured as a TypeScript modular monolith designed for reproducible deployment, predictable transaction isolation, and simple operational maintenance.

## System Components

```
+-----------------------------------------------------------------------------------+
|                                 Next.js 15 Web Client                             |
|  +------------------------+  +------------------------+  +---------------------+  |
|  |  Customer View (Mobile)|  |    Cinema Simulator    |  |  Operator Console   |  |
|  +-----------+------------+  +-----------+------------+  +----------+----------+  |
+--------------|---------------------------|--------------------------|-------------+
               |                           |                          |
               v                           v                          v
+-----------------------------------------------------------------------------------+
|                             Next.js App Router API                                |
|  /api/tickets/verify  |  /api/auth/otp/*  |  /api/sessions/*  |  /api/simulator/* |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                 Feature Services                                  |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  |   TicketService   |  |   SessionService   |  |       ScreeningService        | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  |   RightsService   |  |   BillingService   |  |   SmsService & AT Adapter     | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
     +------------------------------+             +-------------------------------+
     |   PostgreSQL 16 Database     |             |   Africa's Talking SMS API    |
     |   - Screening Clock State    |             |   - Two-Factor OTP SMS        |
     |   - One-Ticket Unique Lock   |             |   - Activation Confirmation   |
     |   - Idempotent Billing       |             |   - Expiration Warning SMS    |
     +------------------------------+             +-------------------------------+
```

## Core Architectural Decisions

### 1. Authoritative Backend Playback Clock

Client-side video clocks drift, desynchronize during backgrounding, and are vulnerable to client manipulation. In PottyPlay:
- The projection state is maintained on the server (`Screening` model).
- Current position is calculated using reference position + elapsed time since last update (`computePlaybackPosition`).
- Pauses freeze the clock cleanly without drift.
- Customer players query the server heartbeat every 4 seconds to maintain frame-level synchronization.

### 2. Atomic Activation & Concurrency Control

To guarantee that one ticket cannot be used on multiple devices or activated multiple times:
- Session activation occurs inside a PostgreSQL transaction (`prisma.$transaction`).
- The ticket status is checked and updated from `VALID_ADMITTED` to `ALREADY_ACTIVATED` atomically.
- Unique constraints on `ticketId` in `BreakSession` enforce single-session limits at the database level.

### 3. Server-Side Hard Session Expiration

The commercial companion concept requires strict enforcement of the 15-minute limit:
- The client countdown timer is purely informational.
- Access to the stream and playback metadata requires an active session token.
- When `now >= expiresAt`, the server flags the session as `EXPIRED`, rejects further sync requests, and logs an audit event.

### 4. Idempotent Billing Ledger

Every qualifying session activation records a billing event. To prevent duplicate billing from page refreshes, retries, or duplicate callbacks:
- The `UsageBillingEvent` table maintains a `@unique` constraint on `sessionId`.
- `BillingService.recordActivationBilling` checks for existing records before insertion and runs within the activation transaction boundary.
