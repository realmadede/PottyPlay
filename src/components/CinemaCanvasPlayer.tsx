"use client";

import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, ShieldCheck, ShieldAlert } from "lucide-react";

interface CinemaCanvasPlayerProps {
  positionSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  title: string;
  cinemaName: string;
  seatNumber?: string;
  patronIdentity?: string;
  onPositionUpdate?: (pos: number) => void;
}

export function CinemaCanvasPlayer({
  positionSeconds,
  durationSeconds,
  isPaused,
  title,
  cinemaName,
  seatNumber,
  patronIdentity,
}: CinemaCanvasPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [internalTime, setInternalTime] = useState(positionSeconds);
  const [captureBlocked, setCaptureBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const lastSyncRef = useRef({ serverPos: positionSeconds, localTime: Date.now() });

  // Anti-screenshot & anti-screen-recording detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerCaptureBlock("PrintScreen capture prohibited by studio security policy.");
        try {
          navigator.clipboard?.writeText("");
        } catch {
          // ignore clipboard security errors
        }
      }

      // 2. Mac shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        triggerCaptureBlock("Screen capture prohibited by studio security policy.");
      }

      // 3. Windows Snipping Tool: Win+Shift+S or Meta+Shift+S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "s" || e.key === "S")) {
        triggerCaptureBlock("Screen clipping prohibited by studio security policy.");
      }

      // 4. Print shortcut: Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerCaptureBlock("Printing of screening frames is disabled.");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try {
          navigator.clipboard?.writeText("");
        } catch {
          // ignore
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        // App backgrounded or screen recorder overlay activated
        triggerCaptureBlock("Screen focus lost. Stream hidden for studio rights protection.");
      }
    };

    const handleWindowBlur = () => {
      // Window blur frequently indicates snipping tool or screen capture overlay
      triggerCaptureBlock("Studio Protection: Stream hidden while external recording tool is active.");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const triggerCaptureBlock = (msg: string) => {
    setCaptureBlocked(true);
    setBlockMessage(msg);
  };

  const handleResumePlayback = () => {
    setCaptureBlocked(false);
    setBlockMessage(null);
  };

  // Update internal time whenever positionSeconds or isPaused updates from backend
  useEffect(() => {
    lastSyncRef.current = {
      serverPos: positionSeconds,
      localTime: Date.now(),
    };
    setInternalTime(positionSeconds);
  }, [positionSeconds, isPaused]);

  // Frame animation loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // If screen capture was triggered, blank out the canvas
      if (captureBlocked) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px 'Familjen Grotesk', -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCREEN RECORDING & CAPTURE PROHIBITED", width / 2, height / 2 - 8);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Familjen Grotesk', -apple-system, sans-serif";
        ctx.fillText("Protected Studio Content • Anti-Piracy Watermark Active", width / 2, height / 2 + 14);
        ctx.textAlign = "start";
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Calculate smooth time
      let curTime = lastSyncRef.current.serverPos;
      if (!isPaused) {
        const delta = (Date.now() - lastSyncRef.current.localTime) / 1000;
        curTime = Math.min(durationSeconds, lastSyncRef.current.serverPos + delta);
      }
      setInternalTime(curTime);

      // Background - Cinema Projection Environment
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      // Day/sunset tone based on scene progress
      const cycle = (curTime % 120) / 120;
      if (cycle < 0.33) {
        gradient.addColorStop(0, "#08101a");
        gradient.addColorStop(0.5, "#152438");
        gradient.addColorStop(1, "#0a1320");
      } else if (cycle < 0.66) {
        gradient.addColorStop(0, "#1f0f18");
        gradient.addColorStop(0.5, "#421b2c");
        gradient.addColorStop(1, "#180c14");
      } else {
        gradient.addColorStop(0, "#0a1816");
        gradient.addColorStop(0.5, "#16342f");
        gradient.addColorStop(1, "#091412");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Cinema Projector Beam Vignette
      const beamGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.1,
        width / 2,
        height / 2,
        width * 0.7
      );
      beamGrad.addColorStop(0, "rgba(255, 235, 180, 0.08)");
      beamGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.2)");
      beamGrad.addColorStop(1, "rgba(0, 0, 0, 0.75)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, 0, width, height);

      // Animated Savannah Silhouettes / Visual demonstration motion
      ctx.save();
      // Distant rolling hills
      ctx.fillStyle = "rgba(10, 15, 24, 0.6)";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      for (let x = 0; x <= width; x += 40) {
        const y = height * 0.65 + Math.sin((x + curTime * 15) * 0.008) * 16;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Midground Acacia Tree silhouette
      const treeX = width * 0.22;
      const treeBaseY = height * 0.76;
      ctx.fillStyle = "rgba(6, 10, 16, 0.88)";
      ctx.beginPath();
      ctx.moveTo(treeX - 10, treeBaseY);
      ctx.lineTo(treeX + 10, treeBaseY);
      ctx.lineTo(treeX + 4, treeBaseY - 55);
      ctx.lineTo(treeX - 4, treeBaseY - 55);
      ctx.closePath();
      ctx.fill();

      // Canopy
      ctx.beginPath();
      ctx.ellipse(treeX + 2, treeBaseY - 58, 45, 14, -0.05, 0, Math.PI * 2);
      ctx.ellipse(treeX - 15, treeBaseY - 65, 30, 10, 0.08, 0, Math.PI * 2);
      ctx.ellipse(treeX + 25, treeBaseY - 62, 28, 9, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Flying birds in distance
      const birdOffset = (curTime * 28) % (width + 60);
      const birdX = width - birdOffset;
      const birdY = height * 0.28 + Math.sin(curTime * 2) * 8;
      ctx.strokeStyle = "rgba(230, 240, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(birdX - 8, birdY - 3);
      ctx.quadraticCurveTo(birdX - 4, birdY, birdX, birdY - 4);
      ctx.quadraticCurveTo(birdX + 4, birdY, birdX + 8, birdY - 3);
      ctx.stroke();

      ctx.restore();

      // Synthetic Audio Spectrum Waveform
      if (!isPaused) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.65)";
        const barCount = 32;
        const barWidth = 3;
        const startX = width * 0.05;
        const bottomY = height * 0.92;

        for (let i = 0; i < barCount; i++) {
          const freq = Math.sin(curTime * 8 + i * 0.4) * 0.5 + 0.5;
          const barHeight = 4 + freq * 26 * (isMuted ? 0.1 : 1);
          ctx.fillRect(
            startX + i * (barWidth + 3),
            bottomY - barHeight,
            barWidth,
            barHeight
          );
        }
      }

      // Film Grain Effect
      const grainCount = 300;
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < grainCount; i++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillRect(gx, gy, 1, 1);
      }

      // Watermark and Cinema Identifier
      ctx.font = "10px 'Familjen Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(240, 244, 249, 0.75)";
      ctx.fillText(`POTTYPLAY PROTECTED STREAM | ${cinemaName}`, 20, 28);

      if (seatNumber) {
        ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
        ctx.font = "bold 11px 'Familjen Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(`SEAT ${seatNumber}`, width - 130, 28);
      }

      // Dynamic Floating Anti-Piracy Forensic Watermark
      const watermarkText = patronIdentity
        ? `LICENSED PATRON: ${patronIdentity} • SESSION ID: ${title.slice(0, 10)}`
        : `STUDIO DRM PROTECTED • NO SCREEN RECORDING`;

      // Watermark floats across canvas in a smooth curve to prevent cropping
      const wmX = width * 0.15 + (Math.sin(curTime * 0.3) * 0.5 + 0.5) * (width * 0.6);
      const wmY = height * 0.2 + (Math.cos(curTime * 0.4) * 0.5 + 0.5) * (height * 0.55);

      ctx.save();
      ctx.font = "bold 10px 'Familjen Grotesk', -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.textAlign = "center";
      ctx.fillText(watermarkText, wmX, wmY);
      ctx.restore();

      // Live SMPTE Timecode display at bottom right
      const hours = Math.floor(curTime / 3600);
      const minutes = Math.floor((curTime % 3600) / 60);
      const seconds = Math.floor(curTime % 60);
      const frames = Math.floor((curTime % 1) * 24);
      const tc = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;

      ctx.font = "12px 'SF Mono', ui-monospace, Menlo, monospace";
      ctx.fillStyle = isPaused ? "#f43f5e" : "#10b981";
      ctx.fillText(isPaused ? `PAUSED [${tc}]` : `LIVE TC: ${tc}`, width - 170, height - 18);

      // Paused Overlay Watermark
      if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px 'Familjen Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CINEMA PROJECTION PAUSED", width / 2, height / 2 - 8);

        ctx.font = "12px 'Familjen Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Companion stream synchronized with auditorium screen", width / 2, height / 2 + 16);
        ctx.textAlign = "start";
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, durationSeconds, cinemaName, seatNumber, isMuted, captureBlocked, patronIdentity, title]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl select-none"
      style={{
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* 16:9 Aspect Ratio Canvas */}
      <div className="relative w-full pb-[56.25%] bg-black">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Studio Content Capture Block Warning Overlay */}
        {captureBlocked && (
          <div
            onClick={handleResumePlayback}
            className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center z-30 cursor-pointer space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                Studio Content Protection Active
              </h4>
              <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
                {blockMessage || "Screen recording, screenshots, and display clipping are strictly prohibited."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResumePlayback}
              className="mt-2 py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors"
            >
              Click to Resume Playback
            </button>
          </div>
        )}

        {/* DRM Security Pill */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-neutral-700/60 text-[10px] text-neutral-300 font-mono pointer-events-none">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>DRM PROTECTED &bull; ANTI-CAPTURE ACTIVE</span>
        </div>
      </div>

      {/* Control Surface */}
      <div className="bg-neutral-950/95 border-t border-neutral-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? "bg-rose-500" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-mono text-[11px] text-neutral-300 font-bold">
              {isPaused ? "PROJECTION PAUSED" : "THEATER LIVE"}
            </span>
          </div>
          <span className="text-neutral-600">|</span>
          <span className="font-mono text-neutral-400 text-[11px] hidden sm:inline truncate max-w-[180px]">
            {title}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title={isMuted ? "Unmute stream" : "Mute stream"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-neutral-200" />
            )}
          </button>
          <span className="font-mono text-neutral-400 text-[11px] bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {formatTime(internalTime)} / {formatTime(durationSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
