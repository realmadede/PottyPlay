"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Sliders, ShieldCheck, Tv } from "lucide-react";

export function NavigationHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Customer Experience", icon: Film },
    { href: "/simulator", label: "Cinema Simulator", icon: Tv },
    { href: "/operator", label: "Operator Dashboard", icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-cinema-900/90 backdrop-blur-md border-b border-cinema-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-500 to-amber-700 flex items-center justify-center shadow-lg shadow-gold-500/10 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 text-cinema-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-cinema-50 tracking-tight">
                PottyPlay
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cinema-800 text-gold-400 border border-gold-500/30">
                Hackathon MVP
              </span>
            </div>
            <span className="text-xs text-cinema-400 font-normal">
              Cinema Companion Viewing
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-cinema-800 text-gold-400 border border-cinema-700 shadow-sm"
                    : "text-cinema-400 hover:text-cinema-200 hover:bg-cinema-850"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
