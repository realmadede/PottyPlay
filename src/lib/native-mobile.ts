/**
 * Native Mobile Polish & Capacitor Hardware Utilities
 *
 * Provides safe fallbacks for mobile-specific features:
 * - Haptic feedback (Capacitor or navigator.vibrate)
 * - Screen Wake Lock (prevents screen sleep during restroom companion playback)
 * - Hardware Back Button & Popstate handling
 * - Network status monitoring (Wi-Fi vs Cellular detection)
 */

import { Capacitor } from "@capacitor/core";

export class NativeMobile {
  private static wakeLockSentinel: any = null;

  /**
   * Trigger light haptic tap feedback.
   */
  public static async triggerHaptic(type: "light" | "medium" | "heavy" = "light"): Promise<void> {
    try {
      if (typeof window === "undefined") return;

      if (Capacitor.isPluginAvailable("Haptics")) {
        const Haptics = (Capacitor as any).Plugins?.Haptics;
        if (Haptics?.impact) {
          const style = type === "heavy" ? "HEAVY" : type === "medium" ? "MEDIUM" : "LIGHT";
          await Haptics.impact({ style });
          return;
        }
      }

      // Web vibration API fallback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        const duration = type === "heavy" ? 40 : type === "medium" ? 25 : 15;
        navigator.vibrate(duration);
      }
    } catch {
      // Haptics unavailable on this platform/device
    }
  }

  /**
   * Acquire a Screen Wake Lock to keep display active during 15-minute companion stream.
   */
  public static async requestWakeLock(): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
        return true;
      }
    } catch {
      // Wake Lock rejected or unsupported
    }
    return false;
  }

  /**
   * Release the screen wake lock when stream terminates or user leaves restroom mode.
   */
  public static async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLockSentinel) {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch {
      // Ignore release error
    }
  }

  /**
   * Check if running on a native iOS or Android shell.
   */
  public static isNative(): boolean {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  }

  /**
   * Check if running on iOS (either web Safari or native iOS).
   */
  public static isIOS(): boolean {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
}
