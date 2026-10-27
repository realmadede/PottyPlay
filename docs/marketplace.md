# PottyPlay Commercial Specification & Integration Model

## 1. Product Metadata

- **Product Name:** PottyPlay Cinema Companion
- **Category:** Cinema Companion Viewing / Theatrical Hospitality
- **Core Technology:** Next.js 15, TypeScript, PostgreSQL, Africa's Talking SMS API, Capacitor
- **Target Deployment:** Multi-tenant Cloud Monolith & On-Premises Cinema Appliance

## 2. Executive Proposition

PottyPlay bridges the gap between cinema hospitality and patron comfort. Cinema patrons who step out for a restroom break, beverage refill, or urgent matter can follow the live theatrical screening on their personal mobile device within a strict 15-minute window.

Using server-authoritative playback synchronization, PottyPlay ensures that audio-visual progress matches the auditorium projector down to the frame, while enforcing hard session expiration to preserve big-screen theatrical exclusivity.

## 3. Commercial Model & Cinema Economics

### 3.1 Revenue Model for Cinema Exhibitors
Exhibitors can offer PottyPlay under two commercial models:
1. **Complimentary Premium Amenity:** Included with premium auditorium admission (Dolby Cinema, IMAX, VIP suites) to increase Net Promoter Scores (NPS) and repeat attendance.
2. **Micro-Transaction Break Pass:** Patrons pay a nominal fee (e.g., 500 TZS / $0.20 USD) for break activation, creating a high-margin ancillary revenue stream for theater operators.

### 3.2 Proposed Partnership Tiers

#### Independent Cinema Pay-As-You-Go
- **Base Retainer:** 0 TZS monthly fee
- **Per-Activation Fee:** 150 TZS per qualifying 15-minute break activation (includes Africa's Talking SMS verification delivery)
- **Target:** Independent movie theaters and boutique screening rooms

## 4. Privacy and Terms of Service

### 4.1 Data Minimization Policy
1. **Scope:** Customer mobile phone numbers are collected solely for dispatching two-factor verification codes, session expiration notices, and security recovery links.
2. **Retention:** Phone numbers and verification records are purged following the conclusion of the screening and required operational audit cycles.
3. **No Marketing Exploitation:** Phone numbers are never sold, shared with third parties, or used for unsolicited promotional messaging.
4. **Encryption:** OTP codes and session credentials are cryptographically protected using SHA-256 and CSPRNG tokens.

### 4.2 Terms of Companion Viewing
1. **Exclusivity:** Companion streams are authorized exclusively for admitted ticket holders of the active screening.
2. **Time Boundary:** Sessions terminate automatically after 15 minutes (900 seconds) without exception.
3. **Studio Exhibition Restrictions:** Content may not be recorded, rebroadcast, or redistributed.
