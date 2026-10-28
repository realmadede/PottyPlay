"use client";

import React, { useCallback, useRef } from "react";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "card" | "pill" | "panel" | "dock";
  interactive?: boolean;
  ambient?: boolean;
  className?: string;
}

export function GlassSurface({
  children,
  variant = "card",
  interactive = true,
  ambient = false,
  className = "",
  style,
  ...props
}: GlassSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--glint-x", `${x}px`);
    el.style.setProperty("--glint-y", `${y}px`);
  }, [interactive]);

  const variantClass =
    variant === "pill"
      ? "rounded-full"
      : variant === "dock"
      ? "rounded-3xl"
      : variant === "panel"
      ? "rounded-2xl"
      : "rounded-3xl";

  const ambientClass = ambient ? "glass-ios26-ambient" : "";
  const glintClass = interactive ? "glass-ios26-glint" : "";

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`glass-ios26 glass-ios26-rim ${glintClass} ${ambientClass} ${variantClass} ${className}`}
      style={style}
      {...props}
    >
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
