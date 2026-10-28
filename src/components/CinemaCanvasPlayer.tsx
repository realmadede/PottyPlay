"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, ShieldCheck, Film } from "lucide-react";

interface CinemaCanvasPlayerProps {
  positionSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  title: string;
  cinemaName: string;
  seatNumber?: string;
  onPositionUpdate?: (pos: number) => void;
}

export function CinemaCanvasPlayer({
  positionSeconds,
  durationSeconds,
  isPaused,
  title,
  cinemaName,
  seatNumber,
}: CinemaCanvasPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [internalTime, setInternalTime] = useState(positionSeconds);
  const lastSyncRef = useRef({ serverPos: positionSeconds, localTime: Date.now() });

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
        const y =
          height * 0.65 +
          Math.sin((x + curTime * 15) * 0.005) * 15 +
          Math.cos(x * 0.01) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Foreground horizon
      ctx.fillStyle = "#04070c";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.78);
      for (let x = 0; x <= width; x += 20) {
        const y =
          height * 0.78 +
          Math.sin((x + curTime * 35) * 0.008) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Acacia tree silhouette
      const treeX = width * 0.22;
      const treeY = height * 0.77;
      ctx.fillStyle = "#030508";
      ctx.beginPath();
      ctx.moveTo(treeX - 6, treeY);
      ctx.quadraticCurveTo(treeX - 12, treeY - 60, treeX - 35, treeY - 80);
      ctx.quadraticCurveTo(treeX - 2, treeY - 65, treeX, treeY - 100);
      ctx.quadraticCurveTo(treeX + 15, treeY - 70, treeX + 40, treeY - 85);
      ctx.quadraticCurveTo(treeX + 10, treeY - 60, treeX + 6, treeY);
      ctx.closePath();
      ctx.fill();

      // Canopy
      ctx.beginPath();
      ctx.ellipse(treeX - 10, treeY - 95, 55, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(treeX + 25, treeY - 85, 40, 10, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Animated cinematic bird/star cluster moving slowly
      const birdOffset = (curTime * 20) % (width + 100);
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
      ctx.fillText(`POTTYPLAY SYNCHRONIZED STREAM | ${cinemaName}`, 20, 28);

      if (seatNumber) {
        ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
        ctx.font = "bold 11px 'Familjen Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(`SEAT ${seatNumber} COMPANION VIEW`, width - 180, 28);
      }

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
  }, [isPaused, durationSeconds, cinemaName, seatNumber, isMuted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-cinema-800 shadow-2xl">
      {/* 16:9 Aspect Ratio Canvas */}
      <div className="relative w-full pb-[56.25%] bg-black">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Video Overlay Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-cinema-900/95 border-t border-cinema-800/80 text-xs">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="flex h-2 w-2 relative flex-shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPaused ? "bg-rose-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPaused ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <span className="font-medium text-cinema-200 truncate">{title}</span>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0 tabular-nums text-cinema-400">
          <span>
            {formatTime(internalTime)} / {formatTime(durationSeconds)}
          </span>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-cinema-400 hover:text-cinema-100 hover:bg-cinema-800 transition-colors"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-cinema-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cinema-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
