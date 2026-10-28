# PottyPlay Ticket Entitlements & Claim Lifecycle

## 1. Entitlement Principles

PottyPlay companion viewing is not an on-demand video subscription. Access to an ongoing theatrical film is strictly contingent upon holding an admitted ticket for that specific screening.

The entitlement engine enforces four core invariants:
1. **Admitted Status:** The ticket must be in `VALID_ADMITTED` status. Cancelled, refunded, or un-admitted tickets cannot activate companion streams.
2. **Screening Association:** The ticket must match the active screening ID currently projecting in the designated auditorium.
3. **One Session per Ticket (Single-Device Locking):** A ticket allows exactly one companion stream. Concurrent streaming on multiple devices is prohibited.
4. **Content Rights Authorization:** The cinema venue must possess an active, unexpired studio exhibition rights license for the screening.

## 2. Ticket Status State Machine

```
[ ISSUED ]
    |
    v (Admitted at Cinema Turnstile)
[ VALID_ADMITTED ] ------------------------------+
    |                                            |
    | (Companion Break Activated)                | (Ticket Cancelled or Refunded)
    v                                            v
[ ALREADY_ACTIVATED ]                 [ CANCELLED_REFUNDED ]
    |                                    (Ineligible)
    v (15 Minutes Elapsed / Operator Revocation)
[ BREAK_CONCLUDED ]
    (Patron Returns to Auditorium Seat)
```

## 3. Claim Tokens, Deep-Linking & Identity Verification

To enable instant mobile scanning from auditorium seat armrests without requiring patrons to manually type alphanumeric codes:
- Every demonstration ticket is assigned a unique `claimToken` (e.g., `CLM-DEMO-8821`).
- Physical QR codes encode the deep link:
  `https://pottyplay.com/watch?claim=CLM-DEMO-8821`
- When scanned, the customer application parses the query parameter, validates ticket entitlement, and requests mandatory telephone verification before activating the companion stream. Direct anonymous access without patron identity registration is prohibited under studio licensing requirements.

## 4. Concurrency Protection & Transaction Boundaries

Session activation is executed inside an atomic PostgreSQL database transaction (`prisma.$transaction`):
1. The ticket row is locked and checked for existing associations.
2. If `ticket.status === ALREADY_ACTIVATED` or `ticket.breakSession` exists, the transaction rolls back immediately with an error.
3. The ticket status is updated to `ALREADY_ACTIVATED`.
4. The `BreakSession` row is created with authoritative timestamps (`startedAt`, `expiresAt = startedAt + 900s`).
5. An idempotent `UsageBillingEvent` is recorded within the same transaction.
6. The transaction commits atomically.
