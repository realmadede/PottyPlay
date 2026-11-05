"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, ShieldCheck, ShieldAlert, Wifi, Globe, AlertCircle, Loader2 } from "lucide-react";
import { Button as GlisseButton } from "@/components/glisse";

interface CinemaCanvasPlayerProps {
  positionSeconds: number;
  durationSeconds: number;
  isPaused: boolean;
  title: string;
  cinemaName: string;
  seatNumber?: string;
  patronIdentity?: string;
  videoUrl?: string;
  edgeVideoUrl?: string | null;
  venueWifiSsid?: string | null;
  preferredRoute?: "LAN_EDGE" | "WAN_CDN";
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
  videoUrl,
  edgeVideoUrl,
  venueWifiSsid,
  preferredRoute = "WAN_CDN",
}: CinemaCanvasPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [internalTime, setInternalTime] = useState(positionSeconds);
  const [captureBlocked, setCaptureBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const lastSyncRef = useRef({ serverPos: positionSeconds, localTime: Date.now() });

  // In-Auditorium Local Edge Streaming resolution
  const initialUseEdge = Boolean(
    edgeVideoUrl && (preferredRoute === "LAN_EDGE" || !videoUrl)
  );
  const [activeSourceType, setActiveSourceType] = useState<"LAN_EDGE" | "WAN_CDN">(
    initialUseEdge ? "LAN_EDGE" : "WAN_CDN"
  );
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | undefined>(
    initialUseEdge && edgeVideoUrl ? edgeVideoUrl : (videoUrl || edgeVideoUrl || undefined)
  );
  const [edgeFailed, setEdgeFailed] = useState<boolean>(false);
  const [showWifiTip, setShowWifiTip] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState(Boolean(activeStreamUrl));
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamRetryCount, setStreamRetryCount] = useState(0);

  useEffect(() => {
    setStreamError(
      activeStreamUrl ? null : "No authorized video stream is available for this screening."
    );
    setIsBuffering(Boolean(activeStreamUrl));
  }, [activeStreamUrl]);

  // Fallback handler if local edge server is unreachable
  const handleStreamError = useCallback(() => {
    if (activeSourceType === "LAN_EDGE" && videoUrl) {
      console.warn(
        "[POTTYPLAY-STREAM] Cinema LAN edge server unreachable. Seamlessly failing over to public WAN cloud CDN."
      );
      setEdgeFailed(true);
      setActiveSourceType("WAN_CDN");
      setActiveStreamUrl(videoUrl);
      setStreamError(null);
      setIsBuffering(true);
      if (venueWifiSsid) {
        setShowWifiTip(true);
      }
      return;
    }
    setIsBuffering(false);
    setStreamError("The cinema stream could not be loaded. Check your connection and retry.");
  }, [activeSourceType, videoUrl, venueWifiSsid]);

  const handleRetryStream = () => {
    if (!activeStreamUrl) return;
    setStreamError(null);
    setIsBuffering(true);
    setStreamRetryCount((count) => count + 1);
  };

  // Keep activeStreamUrl in sync if props update
  useEffect(() => {
    if (!edgeFailed && edgeVideoUrl && preferredRoute === "LAN_EDGE") {
      setActiveSourceType("LAN_EDGE");
      setActiveStreamUrl(edgeVideoUrl);
    } else if (!edgeFailed && edgeVideoUrl && !videoUrl) {
      setActiveSourceType("LAN_EDGE");
      setActiveStreamUrl(edgeVideoUrl);
    } else if (videoUrl) {
      if (edgeFailed || preferredRoute === "WAN_CDN" || !edgeVideoUrl) {
        setActiveSourceType("WAN_CDN");
        setActiveStreamUrl(videoUrl);
      }
    }
  }, [videoUrl, edgeVideoUrl, preferredRoute, edgeFailed]);

  // Web Audio Synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const toggleMute = () => {
    if (isMuted) {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;

            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0, ctx.currentTime);
            masterGain.connect(ctx.destination);
            gainNodeRef.current = masterGain;

            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(260, ctx.currentTime);

            osc1.type = "sine";
            osc1.frequency.setValueAtTime(110, ctx.currentTime);

            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(164.81, ctx.currentTime);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(masterGain);

            osc1.start();
            osc2.start();
          }
        }
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        }
        if (gainNodeRef.current && audioCtxRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(0.06, audioCtxRef.current.currentTime, 0.1);
        }
      } catch (err) {
        console.warn("[AUDIO] Audio synthesis failed to initialize:", err);
      }
      setIsMuted(false);
    } else {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      }
      setIsMuted(true);
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      if (isPaused || captureBlocked || isMuted) {
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05);
      } else {
        gainNodeRef.current.gain.setTargetAtTime(0.06, audioCtxRef.current.currentTime, 0.1);
      }
    }
  }, [isPaused, captureBlocked, isMuted]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

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

  // Adaptive Stream Engine (HLS.js / Native Video) binding
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    setStreamError(null);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls =
      activeStreamUrl.includes(".m3u8") ||
      activeStreamUrl.includes("/hls/") ||
      activeStreamUrl.includes("application/vnd.apple.mpegurl");

    const attachHlsInstance = (HlsConstructor: any) => {
      try {
        const hls = new HlsConstructor({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(activeStreamUrl);
        hls.attachMedia(video);

        hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
          const serverPosition = lastSyncRef.current.serverPos;
          if (Math.abs(video.currentTime - serverPosition) > 1.2) {
            video.currentTime = serverPosition;
          }
        });

        hls.on(HlsConstructor.Events.ERROR, (_: any, data: any) => {
          if (data && data.fatal) {
            console.warn("[POTTYPLAY-HLS] Stream network/media error:", data.type);
            handleStreamError();
          }
        });
      } catch (err) {
        console.warn("[POTTYPLAY-HLS] Instance creation failed:", err);
        handleStreamError();
      }
    };

    if (isHls) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS for Safari (iOS/macOS)
        video.src = activeStreamUrl;
        video.load();
      } else {
        import("hls.js")
          .then(({ default: HlsConstructor }) => {
            if (HlsConstructor.isSupported()) {
              attachHlsInstance(HlsConstructor);
            } else {
              video.src = activeStreamUrl;
              video.load();
            }
          })
          .catch(() => {
            setIsBuffering(false);
            setStreamError("The playback engine could not be loaded. Check your connection and retry.");
          });
      }
    } else {
      // Standard MP4 / WebM progressive video stream
      video.src = activeStreamUrl;
      video.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl, handleStreamError, streamRetryCount]);

  // Synchronize playback timeline, drift compensation, and paused states
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    if (isPaused || captureBlocked) {
      video.pause();
    } else {
      video.play().catch(() => {
        setIsBuffering(false);
        setStreamError("Playback did not start. Check the connection and retry.");
      });
    }

    const drift = Math.abs(video.currentTime - positionSeconds);
    if (drift > 1.2) {
      video.currentTime = positionSeconds;
    }
  }, [positionSeconds, isPaused, captureBlocked, activeStreamUrl]);

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

      ctx.clearRect(0, 0, width, height);

      // Calculate smooth time
      let curTime = lastSyncRef.current.serverPos;
      if (!isPaused) {
        const delta = (Date.now() - lastSyncRef.current.localTime) / 1000;
        curTime = Math.min(durationSeconds, lastSyncRef.current.serverPos + delta);
      }
      setInternalTime(curTime);

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
        {activeStreamUrl && (
          <video
            ref={videoRef}
            src={activeStreamUrl}
            playsInline
            muted={isMuted}
            onError={handleStreamError}
            onLoadStart={() => {
              setIsBuffering(true);
              setStreamError(null);
            }}
            onCanPlay={() => setIsBuffering(false)}
            onPlaying={() => setIsBuffering(false)}
            onWaiting={() => setIsBuffering(true)}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {(isBuffering || streamError) && !captureBlocked && (
          <div
            role={streamError ? "alert" : "status"}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/75 p-6 text-center text-white"
          >
            {streamError ? (
              <>
                <AlertCircle className="h-6 w-6 text-amber-400" />
                <p className="max-w-sm text-sm">{streamError}</p>
                {activeStreamUrl && (
                  <button
                    type="button"
                    onClick={handleRetryStream}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400"
                  >
                    Retry stream
                  </button>
                )}
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                <p className="text-sm">Connecting to the authorized cinema stream...</p>
              </>
            )}
          </div>
        )}

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

        {/* In-Auditorium Network Routing Pill */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-neutral-700/60 text-[10px] text-neutral-300 font-mono pointer-events-none">
          {activeSourceType === "LAN_EDGE" ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300 font-bold">CINEMA LAN EDGE</span>
            </>
          ) : (
            <>
              <Globe className="w-3 h-3 text-sky-400" />
              <span className="text-neutral-300">CLOUD CDN</span>
            </>
          )}
        </div>
      </div>

      {/* In-Auditorium Local Wi-Fi Guidance Advisory */}
      {showWifiTip && venueWifiSsid && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center space-x-2">
            <Wifi className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Weak mobile signal? If available, connect to cinema Wi-Fi: <strong>{venueWifiSsid}</strong>. Playback can still depend on connection quality.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowWifiTip(false)}
            className="text-amber-400/80 hover:text-amber-200 ml-2 text-[10px] uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Surface */}
      <div className="bg-neutral-950/95 border-t border-neutral-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                streamError
                  ? "bg-red-500"
                  : isBuffering
                  ? "bg-amber-400 animate-pulse"
                  : isPaused
                  ? "bg-rose-500"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-mono text-[11px] text-neutral-300 font-bold">
                {streamError
                  ? "STREAM UNAVAILABLE"
                  : isBuffering
                  ? "CONNECTING TO STREAM"
                  : isPaused
                  ? "PROJECTION PAUSED"
                  : "THEATER LIVE"}
            </span>
          </div>
          <span className="text-neutral-600">|</span>
          <span className="font-mono text-neutral-400 text-[11px] hidden sm:inline truncate max-w-[180px]">
            {title}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <GlisseButton
            variant="glass"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute stream" : "Mute stream"}
            className="!p-1.5"
            icon={
              isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-neutral-200" />
              )
            }
          />
          <span className="font-mono text-neutral-400 text-[11px] bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {formatTime(internalTime)} / {formatTime(durationSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
