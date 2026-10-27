import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full";
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export function BrandLogo({
  size = "md",
  variant = "full",
  showTagline = true,
  className = "",
  href = "/",
}: BrandLogoProps) {
  const sizeMap = {
    xs: { icon: "w-5 h-5", text: "text-xs", badge: "text-[9px]" },
    sm: { icon: "w-7 h-7", text: "text-sm", badge: "text-[10px]" },
    md: { icon: "w-9 h-9", text: "text-base", badge: "text-[11px]" },
    lg: { icon: "w-11 h-11", text: "text-lg", badge: "text-xs" },
    xl: { icon: "w-14 h-14", text: "text-2xl", badge: "text-sm" },
  };

  const dimensions = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center space-x-3 group ${className}`}>
      {/* Geometric Brand Mark */}
      <div
        className={`${dimensions.icon} flex-shrink-0 rounded-xl bg-brand-accent p-1.5 shadow-sm border border-neutral-800 transition-transform duration-200 group-hover:scale-105 flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB800" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Theater Screen Arc */}
          <path
            d="M 12 24 C 22 18 42 18 52 24"
            stroke="#FFFFFF"
            strokeOpacity="0.2"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Continuity Möbius Loop */}
          <path
            d="M 18 40 C 13 32 17 23 26 21 C 35 19 43 25 46 33 C 48 38 45 44 40 46 C 34 48 28 46 25 41"
            stroke="url(#logoGoldGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Synchronized Vector */}
          <polygon points="30,28 39,33 30,38" fill="#FFB800" />
          <circle cx="50" cy="24" r="2.5" fill="#FFB800" />
        </svg>
      </div>

      {variant === "full" && (
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-2">
            <span
              className={`font-extrabold tracking-tight text-brand-text-primary ${dimensions.text}`}
            >
              PottyPlay
            </span>
          </div>
          {showTagline && (
            <span
              className={`text-brand-text-secondary font-medium tracking-normal ${dimensions.badge} -mt-0.5`}
            >
              Cinema Companion Viewing
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
