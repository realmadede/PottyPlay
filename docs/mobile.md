# PottyPlay Mobile Architecture & Native Container Guide

## 1. Cross-Platform Strategy

PottyPlay adopts a hybrid native architecture powered by **Capacitor**:
- **Shared Codebase:** The entire customer viewer (`/watch`) is written in Next.js and React, compiled with strict TypeScript and Tailwind CSS.
- **Dual Delivery Modes:**
  - **Progressive Web App (PWA):** Zero-install browser experience accessed via seat QR code scanning on iOS Safari or Android Chrome.
  - **Native Mobile Containers:** High-performance Android APK and iOS IPA wrappers built with `@capacitor/android` and `@capacitor/ios`.

## 2. Capacitor Configuration

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

## 3. Deep-Linking Standards

To ensure that scanning an auditorium QR code opens the native app directly (if installed) or smoothly falls back to the web browser:

### 3.1 Android App Links
Configured via `public/.well-known/assetlinks.json`:
- Domain: `pottyplay.com`
- Package Name: `com.pottyplay.companion`
- Action: Handles URL patterns `/watch*` and `/claim*`.

### 3.2 Apple Universal Links
Configured via `public/.well-known/apple-app-site-association`:
- App ID: `TEAMID1234.com.pottyplay.companion`
- Associated Paths: `/watch`, `/watch/*`, `/claim/*`.

## 4. Mobile Ergonomics & Native Design Guidelines

Adhering to Apple Human Interface Guidelines and Google Material standards:
- **Design Tokens:** Strict neutral warm background (`#FFFDF7`), surface `#FFFFFF`, and high-contrast `#111111` typography.
- **Safe Area Insets:** Layout automatically respects device notches, Dynamic Island, and home indicator bars using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **Touch Targets:** All interactive controls (Mute, End Break, Verify, Resync) exceed the minimum 44x44pt touch boundary.
- **Prevent Screen Sleep:** The companion viewer keeps mobile displays active while a break session is in progress using the Screen Wake Lock API.
- **Audio Autoplay Mitigation:** Companion audio is initialized in muted mode with clear touch-to-unmute controls to comply with mobile WebKit audio policies.
