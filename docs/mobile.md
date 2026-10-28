# PottyPlay Mobile Architecture & Native Container Guide

## 1. Cross-Platform Strategy

PottyPlay adopts a hybrid native architecture powered by **Capacitor**:
- **Shared Codebase:** The entire customer application (`/app`) and browser companion (`/watch`) are built with Next.js, React, Tailwind CSS, and strict TypeScript.
- **Dual Delivery Modes:**
  - **Progressive Web App (PWA):** Zero-install browser experience accessed via seat QR code scanning on iOS Safari or Android Chrome.
  - **Native Mobile Containers:** High-performance Android APK and iOS IPA wrappers built with `@capacitor/android` and `@capacitor/ios`.

---

## 2. Customer Application Tabs & Flow

The customer application enforces mandatory authentication before patron tabs are unlocked:
1. **Welcome Introduction**: Three expressive slides explaining synchronized breaks, 900-second protection, and theater exclusivity.
2. **Mandatory Registration / Sign-In**: Unauthenticated users cannot enter customer tabs until completing full registration (+255 E.164 phone, email, Argon2id-hashed password) and two-stage verification (SMS OTP + email code) with affirmative terms acceptance.
3. **Core Tabs**:
   - **Cinemas**: Discovery of participating verified cinema circuits and showtimes (truthful zero-partner initial state).
   - **Reminders**: Ticket-linked notifications prior to showtimes.
   - **Bathroom Mode**: One-tap synchronized playback during breaks, featuring live 900-second countdown and 2-break allowance.
   - **History**: Server-paginated record of completed and expired breaks.
   - **Settings**: Profile overview, Light/Dark/System theme switching without startup flash, notification preferences, Tanzanian legal links (`/terms`, `/privacy`), truthful store review states, session sign-out, and account deletion requests.

---

## 3. Capacitor Configuration

The application defines its native wrapper settings in `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pottyplay.companion",
  appName: "PottyPlay",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#FFFDF7",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FFFDF7",
    },
  },
};

export default config;
```

---

## 4. Deep-Linking Standards

To ensure that scanning an auditorium QR code opens the native app directly (if installed) or smoothly falls back to the web companion:

### 4.1 Android App Links
Configured via `public/.well-known/assetlinks.json`:
- Domain: `pottyplay.com`
- Package Name: `com.pottyplay.companion`
- Action: Handles URL patterns `/watch*` and `/claim*`.

### 4.2 Apple Universal Links
Configured via `public/.well-known/apple-app-site-association`:
- App ID: `TEAMID1234.com.pottyplay.companion`
- Associated Paths: `/watch`, `/watch/*`, `/claim/*`.

---

## 5. Mobile Ergonomics & Native Design Guidelines

Adhering to Apple Human Interface Guidelines and Google Material standards:
- **Design Tokens:** Strict neutral warm background (`#FFFDF7`), surface `#FFFFFF`, and high-contrast `#111111` typography.
- **Safe Area Insets:** Layout automatically respects device notches, Dynamic Island, and home indicator bars using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **Touch Targets:** All interactive controls (Mute, End Break, Verify, Resync) exceed the minimum 44x44pt touch boundary.
- **Prevent Screen Sleep:** The companion viewer keeps mobile displays active while a break session is in progress using the Screen Wake Lock API.
- **Audio Autoplay Mitigation:** Companion audio is initialized in muted mode with clear touch-to-unmute controls to comply with mobile WebKit audio policies.
