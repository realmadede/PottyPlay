# PottyPlay Authoritative Screening Synchronization

## 1. Zero-Drift Synchronization Principle

Cinema companion viewing presents unique technical constraints compared to traditional Video-On-Demand (VOD):
- Patrons cannot be allowed to seek backward or forward independently through the feature film.
- The patron's device must match the auditorium projection screen down to the frame.
- If the projectionist pauses the movie in the theater, all companion devices must pause simultaneously.
- If a patron locks their device screen or steps into an elevator, reconnecting must resume playback at the true current auditorium position, not where the device was suspended.

To meet these requirements, PottyPlay implements a **server-authoritative master timeline**.

## 2. Playback Position Computation

The server computes playback position dynamically without polling the database on every frame:

```typescript
export function computePlaybackPosition(screening: Screening): number {
  if (screening.isPaused) {
    return screening.playbackPositionSeconds;
  }

  const now = new Date();
  const elapsedSinceUpdate = (now.getTime() - screening.lastPositionUpdatedAt.getTime()) / 1000;
  const computed = screening.playbackPositionSeconds + elapsedSinceUpdate;

  return Math.min(computed, screening.contentAsset.durationSeconds);
}
```

### Projection Events
- **Pause Event:** The server sets `isPaused = true`, records the frozen position in `playbackPositionSeconds`, and updates `lastPositionUpdatedAt = now`.
- **Resume Event:** The server sets `isPaused = false` and updates `lastPositionUpdatedAt = now`.
- **Seek / Calibration:** When theater projection adjustments occur, the operator console updates `playbackPositionSeconds` and resets the reference timestamp.

## 3. Client Synchronization & Smooth Interpolation

1. The client player polls `/api/sessions/sync` every 6 seconds to receive the authoritative server timestamp, current position, and pause status.
2. Between synchronization heartbeats, the client renders video frames via `requestAnimationFrame` using local high-resolution clock interpolation (`performance.now()`).
3. If client drift exceeds 250 milliseconds, the client smoothly ramps playback speed to eliminate the offset without audio pitch artifacts.
4. If the server signals `isPaused: true`, the client instantly enters the paused state and displays the synchronized auditorium pause overlay.

## 4. Fail-Closed Security Policy

If network connectivity is disrupted and the client cannot verify synchronization with the server for more than 15 consecutive seconds:
- The stream enters an unreliable synchronization state.
- Playback pauses with a connection advisory.
- Content is not buffered or stored on client devices.
