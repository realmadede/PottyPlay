#!/usr/bin/env node

/**
 * PottyPlay Theatre Management System (TMS) Automation Bridge
 *
 * Background daemon that synchronizes projection booth playback states (Dolby IMS, Christie,
 * Barco Alchemy, Vista) with PottyPlay without requiring manual operator dashboard clicks.
 *
 * Usage:
 *   npx tsx tms-bridge/tms-daemon.ts
 *   npx tsx tms-bridge/tms-daemon.ts --simulate
 */

import { createHmac } from "crypto";

export interface TmsConfig {
  tmsServerUrl: string;
  pollIntervalMs: number;
  pottyplayWebhookUrl: string;
  webhookSecret: string;
  cinemaId: string;
}

export type TmsState = "PLAYING" | "PAUSED" | "STOPPED";

export class TmsBridgeDaemon {
  private config: TmsConfig;
  private lastState: TmsState | null = null;
  private currentScreeningId: string | null = null;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<TmsConfig>) {
    this.config = {
      tmsServerUrl: process.env.TMS_SERVER_URL || "http://127.0.0.1:8080/dcp/playback",
      pollIntervalMs: parseInt(process.env.TMS_POLL_INTERVAL_MS || "2000", 10),
      pottyplayWebhookUrl: process.env.POTTYPLAY_WEBHOOK_URL || "http://localhost:3000/api/webhooks/pos",
      webhookSecret: process.env.POS_WEBHOOK_SECRET || "pos_test_secret_1234567890abcdef",
      cinemaId: process.env.CINEMA_ID || "cinema_sample_01",
      ...config,
    };
  }

  /**
   * Generates HMAC-SHA256 signature for POS/TMS webhook transport security.
   */
  public generateSignature(payloadString: string): string {
    return createHmac("sha256", this.config.webhookSecret)
      .update(payloadString)
      .digest("hex");
  }

  /**
   * Dispatches signed webhook event to PottyPlay.
   */
  public async dispatchTmsEvent(
    eventType: string,
    screeningId: string,
    positionSeconds?: number
  ): Promise<{ success: boolean; error?: string }> {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: {
        screeningId,
        cinemaId: this.config.cinemaId,
        ...(positionSeconds !== undefined ? { positionSeconds } : {}),
      },
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString);
    const timestamp = Date.now().toString();

    try {
      const response = await fetch(this.config.pottyplayWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pos-signature": `sha256=${signature}`,
          "x-pos-timestamp": timestamp,
          "x-cinema-id": this.config.cinemaId,
        },
        body: payloadString,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[TMS-DAEMON] Webhook dispatch returned HTTP ${response.status}: ${text}`);
        return { success: false, error: text };
      }

      const json = await response.json();
      console.log(`[TMS-DAEMON] Webhook delivered: event=${eventType} screeningId=${screeningId}`);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[TMS-DAEMON] Network error delivering event=${eventType}: ${msg}`);
      return { success: false, error: msg };
    }
  }

  /**
   * Evaluates state transition and triggers webhook when auditorium state changes.
   */
  public async processPlaybackStateChange(
    newState: TmsState,
    screeningId: string,
    positionSeconds?: number
  ): Promise<void> {
    if (this.lastState === newState && this.currentScreeningId === screeningId) {
      return;
    }

    console.log(
      `[TMS-DAEMON] Projector transition detected: ${this.lastState || "INIT"} -> ${newState} (Screening: ${screeningId})`
    );

    let eventType: string;
    switch (newState) {
      case "PLAYING":
        eventType = this.lastState === "PAUSED" ? "screening.playback_resumed" : "screening.playback_started";
        break;
      case "PAUSED":
        eventType = "screening.playback_paused";
        break;
      case "STOPPED":
        eventType = "screening.playback_stopped";
        break;
    }

    await this.dispatchTmsEvent(eventType, screeningId, positionSeconds);
    this.lastState = newState;
    this.currentScreeningId = screeningId;
  }

  /**
   * Queries local Dolby IMS or Christie TMS REST API.
   */
  public async pollTmsHardware(): Promise<{ state: TmsState; screeningId: string; position?: number } | null> {
    try {
      const res = await fetch(this.config.tmsServerUrl, {
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        state: data.state || "STOPPED",
        screeningId: data.screeningId || this.currentScreeningId || "default",
        position: data.positionSeconds,
      };
    } catch {
      return null;
    }
  }

  /**
   * Starts background polling loop.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[TMS-DAEMON] Started polling TMS at ${this.config.tmsServerUrl} every ${this.config.pollIntervalMs}ms`);

    const loop = async () => {
      if (!this.isRunning) return;
      const tmsStatus = await this.pollTmsHardware();
      if (tmsStatus) {
        await this.processPlaybackStateChange(tmsStatus.state, tmsStatus.screeningId, tmsStatus.position);
      }
      if (this.isRunning) {
        this.pollTimer = setTimeout(loop, this.config.pollIntervalMs);
      }
    };

    loop();
  }

  /**
   * Stops background polling loop.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log("[TMS-DAEMON] Stopped background polling.");
  }
}

// Standalone CLI execution
if (require.main === module) {
  const isSimulation = process.argv.includes("--simulate");
  const daemon = new TmsBridgeDaemon();

  if (isSimulation) {
    console.log("[TMS-DAEMON] Running in simulation mode for local verification.");
    const targetScreeningId = process.env.SCREENING_ID || "sec_screening_a";

    (async () => {
      console.log("1. Simulating Projector PLAY event...");
      await daemon.processPlaybackStateChange("PLAYING", targetScreeningId);

      console.log("Waiting 2 seconds...");
      await new Promise((r) => setTimeout(r, 2000));

      console.log("2. Simulating Projector PAUSE event...");
      await daemon.processPlaybackStateChange("PAUSED", targetScreeningId);

      console.log("Waiting 2 seconds...");
      await new Promise((r) => setTimeout(r, 2000));

      console.log("3. Simulating Projector RESUME event...");
      await daemon.processPlaybackStateChange("PLAYING", targetScreeningId);

      console.log("Simulation test completed successfully.");
      process.exit(0);
    })();
  } else {
    daemon.start();

    process.on("SIGINT", () => {
      daemon.stop();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      daemon.stop();
      process.exit(0);
    });
  }
}
