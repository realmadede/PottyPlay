/**
 * Native Mobile Polish & Capacitor Hardware Utilities
 *
 * Provides native bridge capabilities with graceful web fallbacks:
 * - Persistent secure storage via @capacitor/preferences (Android KeyStore / iOS Keychain)
 * - Hardware Taptic Engine and vibration via @capacitor/haptics
 * - Native OS break alarm scheduling (12m/14m warnings) via @capacitor/local-notifications
 * - Real-time connection detection (Wi-Fi vs Cellular) via @capacitor/network
 * - Hardware Back Button & App Lifecycle via @capacitor/app
 * - Screen Wake Lock (prevents display dimming during restroom companion stream)
 */

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Network, ConnectionStatus } from "@capacitor/network";
import { App } from "@capacitor/app";

export interface NetworkState {
  connected: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
}

export class NativeMobile {
  private static wakeLockSentinel: any = null;
  private static backButtonListenerAttached = false;

  /**
   * Check if running inside a native iOS or Android shell.
   */
  public static isNative(): boolean {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  }

  /**
   * Check if running on iOS (either web Safari or native iOS).
   */
  public static isIOS(): boolean {
    if (typeof window === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Native Secure Persistent Storage (Preferences / KeyStore / Keychain)
   * Falls back to localStorage on standard browsers.
   */
  public static async getStorageItem(key: string): Promise<string | null> {
    try {
      if (this.isNative()) {
        const { value } = await Preferences.get({ key });
        return value;
      }
    } catch {
      // fallback
    }

    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  }

  public static async setStorageItem(key: string, value: string): Promise<void> {
    try {
      if (this.isNative()) {
        await Preferences.set({ key, value });
      }
    } catch {
      // fallback
    }

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
  }

  public static async removeStorageItem(key: string): Promise<void> {
    try {
      if (this.isNative()) {
        await Preferences.remove({ key });
      }
    } catch {
      // fallback
    }

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Native Hardware Haptics (Taptic Engine / Android Vibrator)
   */
  public static async triggerHaptic(
    type: "light" | "medium" | "heavy" | "warning" | "success" = "light"
  ): Promise<void> {
    try {
      if (typeof window === "undefined") return;

      if (this.isNative()) {
        if (type === "warning") {
          await Haptics.notification({ type: NotificationType.Warning });
          return;
        }
        if (type === "success") {
          await Haptics.notification({ type: NotificationType.Success });
          return;
        }
        const style =
          type === "heavy"
            ? ImpactStyle.Heavy
            : type === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
        await Haptics.impact({ style });
        return;
      }

      // Web vibration API fallback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        const duration =
          type === "warning"
            ? [50, 100, 50]
            : type === "heavy"
            ? 40
            : type === "medium"
            ? 25
            : 15;
        navigator.vibrate(duration);
      }
    } catch {
      // Haptics unavailable on this device
    }
  }

  /**
   * Schedule Native OS Alarms for Break Countdown (12-minute and 14-minute alerts)
   * These alerts ring even when the screen is locked or the app is backgrounded.
   */
  public static async scheduleBreakAlarms(remainingSeconds: number): Promise<void> {
    try {
      if (!this.isNative()) return;

      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }

      // Cancel any existing break alarms
      await this.cancelBreakAlarms();

      const notifications = [];
      const nowMs = Date.now();

      // 12-minute warning (fires when 180 seconds / 3 minutes remain)
      const warningDelaySeconds = remainingSeconds - 180;
      if (warningDelaySeconds > 5) {
        notifications.push({
          id: 12001,
          title: "PottyPlay: 3 Minutes Remaining",
          body: "Your 15-minute companion viewing break ends soon. Please begin making your way back to your theater seat.",
          schedule: { at: new Date(nowMs + warningDelaySeconds * 1000) },
          sound: "beep.wav",
          smallIcon: "ic_launcher_round",
          actionTypeId: "BREAK_WARNING",
        });
      }

      // 14-minute final advisory (fires when 60 seconds / 1 minute remains)
      const finalDelaySeconds = remainingSeconds - 60;
      if (finalDelaySeconds > 5) {
        notifications.push({
          id: 12002,
          title: "PottyPlay: 1 Minute Remaining",
          body: "Final Advisory: Returning to your seat ensures you won't miss the upcoming scene.",
          schedule: { at: new Date(nowMs + finalDelaySeconds * 1000) },
          sound: "beep.wav",
          smallIcon: "ic_launcher_round",
          actionTypeId: "BREAK_FINAL",
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch {
      // Local notifications unavailable
    }
  }

  /**
   * Cancel any pending break countdown alarms upon return to auditorium or manual exit.
   */
  public static async cancelBreakAlarms(): Promise<void> {
    try {
      if (!this.isNative()) return;
      await LocalNotifications.cancel({ notifications: [{ id: 12001 }, { id: 12002 }] });
    } catch {
      // ignore
    }
  }

  /**
   * Acquire a Screen Wake Lock to keep display active during companion playback.
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
   * Monitor Network Connectivity (Wi-Fi vs Cellular detection)
   */
  public static async getNetworkStatus(): Promise<NetworkState> {
    try {
      if (this.isNative()) {
        const status = await Network.getStatus();
        return {
          connected: status.connected,
          connectionType: status.connectionType as any,
        };
      }
    } catch {
      // fallback
    }

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    return {
      connected: isOnline,
      connectionType: isOnline ? "unknown" : "none",
    };
  }

  public static onNetworkStatusChange(
    callback: (status: NetworkState) => void
  ): { remove: () => void } {
    if (this.isNative()) {
      const handle = Network.addListener("networkStatusChange", (status: ConnectionStatus) => {
        callback({
          connected: status.connected,
          connectionType: status.connectionType as any,
        });
      });
      return {
        remove: () => {
          handle.then((h) => h.remove());
        },
      };
    }

    if (typeof window !== "undefined") {
      const onlineHandler = () =>
        callback({ connected: true, connectionType: "unknown" });
      const offlineHandler = () =>
        callback({ connected: false, connectionType: "none" });

      window.addEventListener("online", onlineHandler);
      window.addEventListener("offline", offlineHandler);

      return {
        remove: () => {
          window.removeEventListener("online", onlineHandler);
          window.removeEventListener("offline", offlineHandler);
        },
      };
    }

    return { remove: () => {} };
  }

  /**
   * Listen to Hardware Back Button on Android
   */
  public static onHardwareBack(callback: () => boolean | void): { remove: () => void } {
    if (this.isNative()) {
      const handle = App.addListener("backButton", (event) => {
        const handled = callback();
        if (!handled && event.canGoBack) {
          window.history.back();
        }
      });
      return {
        remove: () => {
          handle.then((h) => h.remove());
        },
      };
    }
    return { remove: () => {} };
  }
}
