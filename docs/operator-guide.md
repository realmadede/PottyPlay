# PottyPlay: Cinema Operations & Auditorium Guide

## 1. Overview

PottyPlay provides theater projectionists, ushers, and venue operations staff with direct operational oversight over live companion break streams.

The platform provides two internal management consoles:
- **Theater Projection Console (`/cinema`):** Synchronizes with the auditorium master projector, tracks frame drift, and monitors active patrons on temporary break.
- **Cinema Operations Dashboard (`/operator`):** Manages active session revocation, inspects Africa's Talking SMS delivery logs, monitors usage billing ledgers, and reviews security audit trails.

Both interfaces are restricted to authorized venue staff and are not exposed in consumer-facing navigation.

## 2. Operational Workflows

### 2.1 Screening Projection Clock Management

1. Navigate to `/cinema`.
2. Verify the selected auditorium screen (e.g., Screen 1 Dolby Atmos).
3. The Authoritative Projection Clock reflects the master screening timeline:
   - **Pause:** If the theater auditorium screening is paused (e.g. equipment adjustment, emergency announcement), press **Pause**. All patron companion devices immediately halt playback and display an auditorium pause advisory.
   - **Resume:** When projection resumes on the main screen, press **Resume**. All active companion streams resume simultaneously without temporal drift.
   - **Seek & Scrub:** If projection timing requires calibration, use the timeline scrubber or the `+30s` / `-30s` adjustment controls.

### 2.2 Active Viewer Monitoring & Session Revocation

When patrons leave the auditorium for a restroom or refreshment break, their break status appears in both `/cinema` and `/operator`:
- **Seat Number:** Direct identification of patron seat in the auditorium.
- **Patron Identifier:** Ticket entitlement code or registered phone number.
- **Session Duration:** 15-minute countdown clock.

If an usher observes that a patron has returned to their seat before their 15-minute window expires:
1. Navigate to `/operator`.
2. Locate the active session in the **Break Sessions** table.
3. Click **Revoke**.
4. Confirm or enter the revocation reason (default: "Auditorium re-entry confirmed by cinema usher").
5. The companion stream on the patron device is terminated immediately, and an immutable audit event is logged.

### 2.3 Africa's Talking SMS Verification Auditing

Under `/operator` > **SMS Logs**:
- Each verification request dispatched via Africa's Talking SMS API is recorded with timestamp, recipient number, provider status (`SENT`, `DELIVERED`, `FAILED`), and delivery cost.
- If delivery fails (e.g. invalid phone number format or telecom provider timeout), operations staff can guide the patron to use direct ticket claim tokens without phone verification.

### 2.4 Idempotent Billing Ledger

Under `/operator` > **Billing Ledger**:
- Every qualifying break activation records an idempotent billing event with ticket number, cinema venue ID, and billing state.
- Duplicate charges are prevented at the database transaction layer.

## 3. Patron Support Procedures

| Issue | Resolution |
| --- | --- |
| Patron cannot scan QR code | Staff can enter the patron ticket number (e.g. `CC-MLM-7821-A12`) directly at `/watch`. |
| Patron device battery dies | Once device recharges, patron navigates to `/watch` and enters their ticket code or phone number to resume active session. |
| 15-minute limit reached | Stream automatically terminates with guidance to return to auditorium. No extension is permitted under studio exhibition rules. |
