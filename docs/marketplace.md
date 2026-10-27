# Africa's Talking Marketplace Listing & Product Specification

## 1. Product Metadata

- **Product Name:** PottyPlay Cinema Companion
- **Version:** 1.0.0-mvp
- **Primary Africa's Talking Category:** SMS / Messaging API
- **Industry Vertical:** Media & Entertainment / Cinema Operations
- **Container Registry Target:** `registry.africastalking.com/pottyplay/cinema-companion`

## 2. Listing Copy

### Short Tagline (120 characters)
A secure companion streaming platform enabling cinema attendees to follow ongoing movie screenings during temporary breaks.

### Full Description
PottyPlay bridges the gap between cinema hospitality and patron comfort. Cinema patrons who step out for a restroom break, beverage refill, or urgent matter can follow the live screening on their mobile device within a strict 15-minute window.

Powered by Africa's Talking two-factor SMS verification, PottyPlay guarantees that only ticketed cinema patrons physically present at the screening can activate a break session. Using server-authoritative playback synchronization, PottyPlay ensures that audio-visual progress matches the auditorium projector down to the frame, while enforcing hard session expiration to preserve big-screen theatrical exclusivity.

## 3. Key Features

- **Two-Factor SMS Verification:** Seamless phone validation using Africa's Talking SMS API with instant OTP delivery.
- **Server-Authoritative Clock:** Zero-drift synchronization between auditorium projection and customer device.
- **Strict 15-Minute Expiration:** Hard stop enforced on the backend to prevent unauthorized full-length viewing.
- **Single-Device Ticket Locking:** Atomic database transactions prevent ticket sharing or duplicate activations.
- **Comprehensive Operator Console:** Real-time visibility into active sessions, SMS deliverability, and audit events.
- **Idempotent Billing Ledger:** Zero duplicate charge risk across retries or page refreshes.

## 4. Proposed Pricing Plans

### Plan 1: Cinema Chain Pay-As-You-Go (Recommended)
- **Base Fee:** 0 TZS monthly subscription
- **Per-Session Verification:** 150 TZS per qualifying 15-minute break activation (includes AT SMS cost)
- **SMS Pass-Through:** Standard Africa's Talking SMS tariffs for OTP and notifications
- **Target:** Independent movie theaters and boutique screening rooms

### Plan 2: Enterprise Multiplex Tier
- **Monthly Retainer:** 250,000 TZS per cinema venue (unlimited screens)
- **Included Activations:** 2,000 complimentary monthly break sessions
- **Overage Rate:** 100 TZS per additional session
- **SLA:** 99.9% uptime with dedicated SMS delivery routes
- **Target:** Large cinema chains (e.g. Century Cinemax, Ster-Kinekor)

## 5. Privacy and Terms of Service (Demonstration Scope)

### Privacy Policy
1. **Data Collection:** PottyPlay collects customer mobile phone numbers solely for dispatching two-factor verification codes and session expiration notices.
2. **Data Retention:** Phone numbers and verification records are retained only for the duration of the demonstration screening and subsequent operational audits.
3. **No Marketing Use:** Phone numbers are never shared with third parties or used for unsolicited promotional marketing.
4. **Security:** OTP codes are hashed using SHA-256 with salts; credentials and plain codes are never recorded in application logs.

### Terms of Companion Viewing
1. **Exclusivity:** Companion streams are authorized only for ticketed attendees of the designated screening.
2. **Time Boundary:** Sessions terminate automatically after 15 minutes (900 seconds) without exception.
3. **Restricted Use:** Content may not be recorded, rebroadcast, or redistributed.
