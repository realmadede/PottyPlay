"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Sliders, Tv, ExternalLink } from "lucide-react";

export function NavigationHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/cinema", label: "Projection Console", icon: Tv },
    { href: "/operator", label: "Operations Dashboard", icon: Sliders },
    { href: "/watch", label: "Patron Viewer", icon: Film },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#FFB800] flex items-center justify-center font-bold text-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
            PP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-[#111111] tracking-tight">
                PottyPlay
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#FFB800]/20 text-[#111111] border border-[#FFB800]/40">
                Theater Console
              </span>
            </div>
            <span className="text-[11px] text-[#6B7280]">
              Cinema Companion Viewing Platform
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-[#6B7280] hover:text-[#111111] hover:bg-[#FFFDF7]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/"
            className="hidden md:flex items-center space-x-1 px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#111111] transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
