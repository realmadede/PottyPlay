"use client";

import { useEffect } from "react";

const surfaceSelector = ".glass-ios26-glint";

export function GlassOpticsRuntime() {
  useEffect(() => {
    let activeSurface: HTMLElement | null = null;
    document.documentElement.classList.add("has-scroll-forming");

    const resetSurface = (surface: HTMLElement | null) => {
      surface?.style.removeProperty("--glint-x");
      surface?.style.removeProperty("--glint-y");
      surface?.style.removeProperty("--glint-angle");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const target = event.target instanceof Element ? event.target : null;
      const surface = target?.closest<HTMLElement>(surfaceSelector) ?? null;
      if (activeSurface !== surface) resetSurface(activeSurface);
      activeSurface = surface;
      if (!surface) return;

      const bounds = surface.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      surface.style.setProperty("--glint-x", `${(x * 100).toFixed(1)}%`);
      surface.style.setProperty("--glint-y", `${(y * 100).toFixed(1)}%`);
      surface.style.setProperty("--glint-angle", `${Math.round(Math.atan2(y - 0.5, x - 0.5) * 57.2958 + 180)}deg`);
    };

    const handlePointerOut = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const surface = target?.closest<HTMLElement>(surfaceSelector) ?? null;
      if (!surface || (event.relatedTarget instanceof Node && surface.contains(event.relatedTarget))) return;
      resetSurface(surface);
      if (activeSurface === surface) activeSurface = null;
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) {
        resetSurface(activeSurface);
        activeSurface = null;
      }
    };

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    motionPreference.addEventListener("change", handleMotionPreference);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      motionPreference.removeEventListener("change", handleMotionPreference);
      resetSurface(activeSurface);
      document.documentElement.classList.remove("has-scroll-forming");
    };
  }, []);

  return null;
}