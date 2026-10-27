"use client";

import Link from "next/link";
import { Film, ArrowUpRight } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-brand-accent shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-brand-text-primary tracking-tight">
              PottyPlay
            </span>
            <span className="text-[10px] text-brand-text-secondary leading-none">
              Cinema Companion Viewing
            </span>
          </div>
        </Link>

        {/* Public Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-brand-text-secondary">
          <a href="#how-it-works" className="hover:text-brand-text-primary transition-colors">
            How It Works
          </a>
          <a href="#patron-benefits" className="hover:text-brand-text-primary transition-colors">
            For Patrons
          </a>
          <a href="#operator-benefits" className="hover:text-brand-text-primary transition-colors">
            For Theaters
          </a>
          <a href="#security" className="hover:text-brand-text-primary transition-colors">
            Security & Rights
          </a>
          <a href="#contact" className="hover:text-brand-text-primary transition-colors">
            Partnership
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center space-x-3">
          <Link
            href="/watch"
            className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold bg-brand-accent text-white hover:bg-black transition-colors"
          >
            <span>Open Player</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
