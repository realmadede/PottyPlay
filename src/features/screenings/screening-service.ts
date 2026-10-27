import { prisma } from "@/lib/db";
import { ScreeningStatus } from "@prisma/client";

export interface AuthoritativePlaybackState {
  screeningId: string;
  screeningTitle: string;
  cinemaId: string;
  cinemaName: string;
  screenName: string;
  status: ScreeningStatus;
  currentPositionSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  canFollow: boolean;
  unreliableSync: boolean;
  assetTitle: string;
  videoUrl: string;
  licenseType: string;
  serverTimestamp: number;
}

export class ScreeningService {
  /**
   * Computes the authoritative playback position and state from the backend clock.
   */
  static computePlaybackPosition(screening: {
    status: ScreeningStatus;
    playbackPositionSeconds: number;
    lastPositionUpdatedAt: Date | null;
    isPaused: boolean;
    contentAsset: { durationSeconds: number };
  }): number {
    if (screening.status === ScreeningStatus.SCHEDULED) {
      return 0.0;
    }

    if (
      screening.status === ScreeningStatus.COMPLETED ||
      screening.status === ScreeningStatus.CANCELLED
    ) {
      return screening.contentAsset.durationSeconds;
    }

    if (screening.isPaused || screening.status === ScreeningStatus.PAUSED) {
      return Math.min(
        screening.playbackPositionSeconds,
        screening.contentAsset.durationSeconds
      );
    }

    if (!screening.lastPositionUpdatedAt) {
      return Math.min(
        screening.playbackPositionSeconds,
        screening.contentAsset.durationSeconds
      );
    }

    const elapsedSeconds =
      (Date.now() - new Date(screening.lastPositionUpdatedAt).getTime()) / 1000;
    const computed = screening.playbackPositionSeconds + Math.max(0, elapsedSeconds);
    return Math.min(computed, screening.contentAsset.durationSeconds);
  }

  /**
   * Fetches the authoritative playback state for a screening.
   */
  static async getAuthoritativePlaybackState(
    screeningId: string
  ): Promise<AuthoritativePlaybackState | null> {
    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: {
        cinema: true,
        screen: true,
        contentAsset: true,
      },
    });

    if (!screening) return null;

    const currentPosition = this.computePlaybackPosition(screening);
    const canFollow =
      screening.status === ScreeningStatus.PLAYING ||
      screening.status === ScreeningStatus.PAUSED;

    return {
      screeningId: screening.id,
      screeningTitle: screening.title,
      cinemaId: screening.cinema.id,
      cinemaName: screening.cinema.name,
      screenName: screening.screen.name,
      status: screening.status,
      currentPositionSeconds: Math.round(currentPosition * 10) / 10,
      durationSeconds: screening.contentAsset.durationSeconds,
      isPaused: screening.isPaused || screening.status === ScreeningStatus.PAUSED,
      canFollow,
      unreliableSync: false,
      assetTitle: screening.contentAsset.title,
      videoUrl: screening.contentAsset.videoUrl,
      licenseType: screening.contentAsset.licenseType,
      serverTimestamp: Date.now(),
    };
  }

  /**
   * Simulator action: Start or resume screening playback.
   */
  static async resumePlayback(screeningId: string) {
    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: { contentAsset: true },
    });
    if (!screening) throw new Error("Screening not found.");

    const now = new Date();
    let currentPosition = screening.playbackPositionSeconds;

    // If was paused, keep current position and resume
    await prisma.screening.update({
      where: { id: screeningId },
      data: {
        status: ScreeningStatus.PLAYING,
        isPaused: false,
        pausedAt: null,
        playbackPositionSeconds: currentPosition,
        lastPositionUpdatedAt: now,
        actualStart: screening.actualStart || now,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "PLAYBACK_RESUMED",
        entityType: "SCREENING",
        entityId: screeningId,
        actor: "OPERATOR",
        details: JSON.stringify({ position: currentPosition }),
      },
    });

    return this.getAuthoritativePlaybackState(screeningId);
  }

  /**
   * Simulator action: Pause screening playback (freezes clock).
   */
  static async pausePlayback(screeningId: string) {
    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: { contentAsset: true },
    });
    if (!screening) throw new Error("Screening not found.");

    const now = new Date();
    const currentPosition = this.computePlaybackPosition(screening);

    await prisma.screening.update({
      where: { id: screeningId },
      data: {
        status: ScreeningStatus.PAUSED,
        isPaused: true,
        pausedAt: now,
        playbackPositionSeconds: currentPosition,
        lastPositionUpdatedAt: now,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "PLAYBACK_PAUSED",
        entityType: "SCREENING",
        entityId: screeningId,
        actor: "OPERATOR",
        details: JSON.stringify({ position: currentPosition }),
      },
    });

    return this.getAuthoritativePlaybackState(screeningId);
  }

  /**
   * Simulator action: Seek or update playback position.
   */
  static async seekPlayback(screeningId: string, targetPositionSeconds: number) {
    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: { contentAsset: true },
    });
    if (!screening) throw new Error("Screening not found.");

    const bounded = Math.max(
      0,
      Math.min(targetPositionSeconds, screening.contentAsset.durationSeconds)
    );
    const now = new Date();

    await prisma.screening.update({
      where: { id: screeningId },
      data: {
        playbackPositionSeconds: bounded,
        lastPositionUpdatedAt: now,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "PLAYBACK_SEEK",
        entityType: "SCREENING",
        entityId: screeningId,
        actor: "OPERATOR",
        details: JSON.stringify({ targetPosition: bounded }),
      },
    });

    return this.getAuthoritativePlaybackState(screeningId);
  }
}
