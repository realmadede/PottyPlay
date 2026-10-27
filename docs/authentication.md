# PottyPlay Authentication Architecture & Journey

## 1. Overview

PottyPlay employs a dual-tier authentication architecture designed specifically for frictionless cinema patron experience and strict access enforcement:

1. **Direct Ticket / Claim Entitlement (Primary One-Time Flow):** Patrons seated in an auditorium scan a seat QR code or enter their ticket code to activate a companion viewing break without redundant phone verification hurdles.
2. **Returning Customer Session Synchronization:** Patrons with active breaks do not repeat authentication when opening or refreshing the app; their cryptographically generated session token resumes playback immediately.
3. **Africa's Talking SMS Two-Factor Fallback & Registration:** When a patron registers their mobile phone number (+255 Tanzanian or international E.164 format), Africa's Talking SMS API delivers a short-lived 6-digit numeric OTP for identity verification, session recovery, and auditorium alerts.

## 2. Authentication Flow Diagram

```
[ Cinema Patron ]
        |
        |---> Scan Seat QR Code / Navigate to /watch?claim=...
        |
        v
[ Client Application ]
        |
        |--- (Check localStorage for active sessionToken)
        |
        +-----> [ Has Active Token? ]
        |               |
        |         (Yes) v
        |        Verify via GET /api/sessions/sync
        |               |
        |               +---> Valid? ---> [ Immediately Resume Playback ] (Zero OTP)
        |               |
        |               +---> Expired/Invalid? ---> Clear Token
        |
        +-----> [ New Session Activation ]
                        |
                 POST /api/tickets/verify
                        |
                        v
                 [ Entitlement Verified ]
                        |
                        +---> Direct Activation (One-Click) ---> POST /api/sessions/activate
                        |
                        +---> Optional SMS Registration:
                                  1. POST /api/auth/otp/request (Africa's Talking SMS API)
                                  2. Patron inputs 6-digit code
                                  3. POST /api/auth/otp/verify
                                  4. POST /api/sessions/activate (with challengeId)
```

## 3. Security Specifications

### 3.1 Cryptographic Storage of One-Time Codes
- OTP codes are never stored in plaintext.
- Upon code generation, the raw 6-digit numeric string is hashed using SHA-256 with server-side secret salts.
- The hashed value is written to the `OtpChallenge` table with an expiration timestamp (`expiresAt = now + 300s`).
- When the patron submits their code, the comparison uses a constant-time equality check to prevent timing analysis attacks.

### 3.2 Attempt Throttling & Lockout
- Each OTP challenge allows a maximum of 3 failed verification attempts (`maxAttempts = 3`).
- On the 3rd failed attempt, the challenge is permanently locked.
- Rate limits restrict any single phone number or IP address to a maximum of 5 OTP requests per 10-minute window.

### 3.3 Session Token Generation
- Session tokens use a cryptographically strong pseudo-random number generator (CSPRNG): `crypto.randomBytes(32).toString("hex")`.
- Prefixed with `pstk_` for structured log filtering.
- Transmitted via secure HTTP headers (`x-session-token` or `Authorization: Bearer`) and secure HTTP-only cookies.
