# PottyPlay: 3-Minute Live Hackathon Demonstration Script

Africa's Talking Open Hackathon: Build Anything (Dar es Salaam, Tanzania)

## Presenter Preparation

Ensure the development server and PostgreSQL container are running:
- Main Customer Experience: `http://localhost:3000`
- Authoritative Cinema Simulator: `http://localhost:3000/simulator`
- Cinema Operator Console: `http://localhost:3000/operator`

Open two browser tabs/windows side-by-side:
- Window 1 (Left / Mobile viewport): Customer View (`/`)
- Window 2 (Right / Desktop viewport): Cinema Simulator (`/simulator`)

---

## 1. Problem & Customer Journey (0:00 - 1:00)

1. **Context:**
   > "Judges, have you ever held in a restroom break during an intense movie scene because you did not want to miss a crucial plot twist? PottyPlay is a companion viewing platform that lets authenticated moviegoers follow ongoing screenings during a temporary break."

2. **Step 1: Enter Ticket Reference:**
   - On the customer page, click **Begin Companion Break**.
   - Click the preset demo pill: **Seat A12 (Valid)** (fills `CC-MLM-7821-A12`).
   - Click **Verify Ticket**.
   - Point out: The backend independently validates admission, auditorium screen, seat, and content rights.

3. **Step 2: Africa's Talking Two-Factor Verification:**
   - Notice phone number pre-filled: `+255712345678`.
   - Click **Send SMS Code**.
   - Point out: Africa's Talking SMS API is called. In simulator mode, the yellow banner displays the simulated SMS OTP (e.g. `101164`).
   - Click **Confirm Code**.

---

## 2. Server-Authoritative Playback & Rights (1:00 - 2:00)

4. **Step 3: Activate Break Stream:**
   - Point out the 15-minute maximum limit notice.
   - Click **Start Companion Stream**.
   - The synchronized canvas player loads at the exact authoritative screening time.
   - Point out the prominent countdown timer (`14:59` counting down).

5. **Step 4: Demonstrate Synchronization Control (Window 2):**
   - In Window 2 (`/simulator`), click **Pause**.
   - Switch back to Window 1 (`/`): Notice the customer player displays **CINEMA PROJECTION PAUSED** in lockstep!
   - In Window 2, click **Resume**.
   - Playback instantly resumes on both screens.
   - Point out: The client never guesses the time; the backend clock is authoritative.

---

## 3. Operator Console & Business Model (2:00 - 3:00)

6. **Step 5: Operator Visibility (`/operator`):**
   - Switch to the Operator Console.
   - Point out:
     - **Active Breaks:** 1 active stream currently running.
     - **SMS Deliveries:** Africa's Talking delivery logs.
     - **Billing Ledger:** 1 qualifying billable event recorded idempotently (500 TZS demo rate).
     - **Security Audit Trail:** Complete tamper-evident audit history.

7. **Step 6: Revocation / Expiration Enforcement:**
   - Under the **Break Sessions** table, click **Revoke** on the active session.
   - Enter reason: "Patron returned to auditorium."
   - Click **Confirm Revoke**.
   - Notice the customer screen immediately halts playback with an operator revocation notice.

8. **Closing Statement:**
   > "PottyPlay combines Africa's Talking communications infrastructure with server-authoritative streaming controls to protect cinema rights while improving patron comfort. Thank you!"
