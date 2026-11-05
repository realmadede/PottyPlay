"use client";

import React from "react";
import { DynamicGlassSurface } from "./DynamicGlassSurface";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "card" | "pill" | "panel" | "dock";
  interactive?: boolean;
  ambient?: boolean;
  iridescent?: boolean;
  className?: string;
}

export function GlassSurface({
  children,
  variant = "card",
  interactive = true,
  ambient = false,
  iridescent = true,
  className = "",
  style,
  ...props
}: GlassSurfaceProps) {
  const radius =
    variant === "pill" ? 9999 : variant === "dock" ? 32 : variant === "panel" ? 16 : 24;

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
  const iridClass = iridescent ? "glass-ios26-iridescent" : "";

  return (
    <DynamicGlassSurface
      borderRadius={radius}
      interactive={interactive}
      className={`lg-glass glass-ios26 glass-ios26-rim ${iridClass} ${glintClass} ${ambientClass} ${variantClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </DynamicGlassSurface>
  );
}
