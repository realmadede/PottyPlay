"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Film, Sliders, Tv, ExternalLink } from "lucide-react";

export function NavigationHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/cinema", label: "Projection Console", shortLabel: "Console", icon: Tv },
    { href: "/operator", label: "Operations Dashboard", shortLabel: "Operator", icon: Sliders },
    { href: "/watch", label: "Patron Viewer", shortLabel: "Viewer", icon: Film },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-field/95 backdrop-blur-md border-b border-line overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 min-w-0">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0 flex-shrink-0">
          <Image
            src="/brand-mark.svg"
            alt="PottyPlay Brand Mark"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-ink tracking-tight">
                PottyPlay
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-heather/20 text-ink border border-heather/40 flex-shrink-0">
                Console
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-muted truncate">
              Cinema Companion Viewing Platform
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 min-w-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 ${
                  isActive
                    ? "bg-ink text-bg shadow-sm"
                    : "text-muted hover:text-ink hover:bg-bg"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="inline sm:hidden">{item.shortLabel}</span>
              </Link>
            );
          })}
          <Link
            href="/"
            className="hidden lg:flex items-center space-x-1 px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
