# PottyPlay Mobile Architecture & Native Container Guide

## 1. Cross-Platform Strategy

PottyPlay adopts a hybrid native architecture powered by **Capacitor**:
- **Shared Codebase:** The entire customer application (`/app`) and browser companion (`/watch`) are built with Next.js, React, Tailwind CSS, and strict TypeScript.
- **Dual Delivery Modes:**
  - **Progressive Web App (PWA):** Zero-install browser experience accessed via seat QR code scanning on iOS Safari or Android Chrome.
  - **Native Mobile Containers:** High-performance Android APK and iOS IPA wrappers built with `@capacitor/android` and `@capacitor/ios`.
  - **Ticket scanning:** Native QR scanning is provided by `@capacitor/barcode-scanner`; manual ticket entry remains available if camera access is declined or unavailable.

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

The application defines its native wrapper settings in `capacitor.config.ts`. The native web UI is bundled locally; the backend remains an HTTPS service. Set `CAPACITOR_SERVER_URL` to the deployed PottyPlay origin before a native production build. It is embedded as the API origin and is not used as the WebView's page URL.

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
    PrivacyScreen: {
      enable: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#121517",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#121517",
    },
  },
};

export default config;
```

Build and synchronize the actual customer UI and local legal/support pages with:

```bash
CAPACITOR_SERVER_URL="https://<deployed-pottyplay-origin>" npm run cap:build
```

The build requires a valid HTTPS origin and a successful `npm run build`. The generated `out/` directory contains the prerendered customer application, Next.js static assets, public assets, and legal/support routes. Customer API calls use the configured origin; ordinary web requests remain same-origin. A clean native install can display the bundled app shell without the API, but authenticated and cinema-synchronized functionality requires a reachable backend.

The scanner requires Android API 26 or higher. iOS declares `NSCameraUsageDescription`; the app only invokes scanning after the patron taps the scan action.

---

## 4. Deep-Linking Standards

To ensure that scanning an auditorium QR code opens the native app directly (if installed) or smoothly falls back to the web companion:

### 4.1 Android App Links
Configured via `public/.well-known/assetlinks.json`:
- Domain: `pottyplay.com`
- Package Name: `com.pottyplay.companion`
- Android intent filters handle `/app*`, `/watch*`, and `/claim*`.
- The checked-in SHA-256 certificate fingerprint must be verified against the Play App Signing certificate before release.

### 4.2 Apple Universal Links
Configured via `public/.well-known/apple-app-site-association`:
- The checked-in app association ID is `K5P84Z9R92.com.pottyplay.companion`; the publisher must verify this Team ID against the Apple Developer account before release.
- Associated paths: `/app`, `/app/*`, `/watch`, `/watch/*`, `/claim`, and `/claim/*`.
- The iOS app target includes the `applinks:pottyplay.com` Associated Domains entitlement.

---

## 5. Mobile Ergonomics & Native Design Guidelines

Adhering to Apple Human Interface Guidelines and Google Material standards:
- **Design Tokens:** High-contrast dark cinematic backgrounds, illuminated amber indicators, and clear typography.
- **Safe Area Insets:** Layout automatically respects device notches, Dynamic Island, and home indicator bars using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **Touch Targets:** All interactive controls (Mute, End Break, Verify, Resync) exceed the minimum 44x44pt touch boundary.
- **Prevent Screen Sleep:** The companion viewer keeps mobile displays active while a break session is in progress using the Screen Wake Lock API.
- **Audio Autoplay Mitigation:** Companion audio is initialized in muted mode with clear touch-to-unmute controls to comply with mobile WebKit audio policies.

---

## 6. Privacy Screen & Anti-Capture Protections

To prevent unlawful distribution and off-screen recording:
- **OS-Level Screen Security:** Enforces `@capacitor-community/privacy-screen` in the native mobile layer.
- **Android `FLAG_SECURE`**: Screenshots are blocked by the OS, and system screen recordings produce completely blanked black video.
- **iOS App Switcher Blanking**: Obscures sensitive playback frames when switching tasks or minimizing the app.

---

## 7. iOS 26 Optical Refractive Glass UI Engine

The mobile client and web companion utilize a custom optical glass rendering engine designed around iOS 26 glass refraction:
- **Convex Lens Displacement**: An SVG optical displacement filter (`<filter id="ios26-lens">`) simulates physical light refraction and edge compression behind interactive panels.
- **Multi-Layer Radial Glint**: Tracks device and pointer motion to sweep specular glints across surfaces (`glass-ios26-glint`).
- **Caustic Rim Lighting**: High-luminance 1px rim border (`glass-ios26-rim`) creates natural caustic edge illumination.
- **Component Implementation**: Applied to bottom docks, modal dialogs, and HUD counters via `GlassSurface.tsx`.

## 8. Android Emulator Validation

The Android customer app was exercised on 2026-11-03 with the `Medium_Phone_API_37.0` emulator. The build used Capacitor 8, Gradle 8.14.3, and JDK 21. A local development API and disposable PostgreSQL database were used; the emulator reaches the host API at `10.0.2.2:3000`.

Verified in the emulator:
- Customer registration, development-mode SMS/email verification, and session restoration after force-stop and relaunch.
- Warm claim-link handling, including pre-filling the ticket field in an already-open app.
- Camera permission denial fallback and scanner launch after permission was granted.
- Android notification permission prompt and the app's enabled-state response.
- Ticket activation and session playback using a public CC0 sample clip substituted only in the disposable test database.

Not verified: decoding a QR code from the virtual camera, licensed cinema content or DRM delivery, real SMS/email provider delivery, timed notification delivery, physical-device behavior, iOS builds, or store acceptance. The sample clip is not a production stream test. At this validation, `npm test` passed 119 tests in 5 files; `npm run typecheck` and `npm run lint` passed.

### Emulator-Only Build

Use a disposable database and the emulator-only origin. Do not set these values for a release build. Stop the Next.js development server before `npm run cap:build`, because both commands use the same `.next` directory.

Build the bundled app shell:

```bash
CAPACITOR_EMULATOR_DEV=true \
CAPACITOR_SERVER_URL="http://10.0.2.2:3000" \
npm run cap:build
```

Run the API server in a separate terminal, with `.env` pointing to the disposable database and development-only verification mode enabled:

```bash
CAPACITOR_EMULATOR_DEV=true AT_SIMULATOR_MODE=true \
npm run dev -- --hostname 0.0.0.0
```

Build the Android debug APK with JDK 21 and the Android SDK installed:

```bash
cd android
export JAVA_HOME="/path/to/jdk-21"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
./gradlew --no-daemon --console=plain assembleDebug
```

`CAPACITOR_EMULATOR_DEV=true` permits the emulator's local HTTP API, enables debug-only cleartext traffic, and disables screenshot protection so the test UI can be inspected. Those settings are not for distribution. Normal/release configuration uses HTTPS and retains screen protection.

### Release Prerequisites

- Obtain and verify the production HTTPS API origin, then build without `CAPACITOR_EMULATOR_DEV`.
- Verify the Android App Links fingerprint against the Play App Signing certificate and the Apple Team ID against the publisher's account.
- Build and exercise iOS on macOS with Xcode; this Linux environment cannot produce or validate an iOS release.
- Validate authorized streams, QR decoding, real messaging providers, notification delivery, and privacy protections on supported physical devices.
- Complete publisher identity, store metadata, signing, reviewer access, and operational/privacy details before submission.
