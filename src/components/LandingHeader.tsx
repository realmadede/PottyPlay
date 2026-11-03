"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Menu, X, ArrowRight } from "lucide-react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-5 pt-3 transition-all">
      <div className="max-w-7xl mx-auto glass-ios26 glass-ios26-rim glass-ios26-iridescent glass-ios26-glint rounded-full">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex-shrink-0">
          <BrandLogo size="md" variant="full" href="/" />
        </div>

        {/* Public B2B Navigation */}
        <nav className="hidden xl:flex items-center space-x-3 2xl:space-x-5 text-xs font-semibold text-muted flex-shrink-0">
          <a
            href="#proposition"
            className="hover:text-ink transition-colors duration-150"
          >
            Proposition
          </a>
          <a
            href="#how-it-works"
            className="hover:text-ink transition-colors duration-150"
          >
            How It Works
          </a>
          <a
            href="#patron-experience"
            className="hover:text-ink transition-colors duration-150"
          >
            Experience
          </a>
          <a
            href="#operator-benefits"
            className="hover:text-ink transition-colors duration-150"
          >
            Theater Benefits
          </a>
          <a
            href="#synchronization"
            className="hover:text-ink transition-colors duration-150"
          >
            Sync
          </a>
          <a
            href="#security"
            className="hover:text-ink transition-colors duration-150"
          >
            Security & Rights
          </a>
          <Link
            href="/developers"
            className="hover:text-ink transition-colors duration-150"
          >
            Developers
          </Link>
          <Link
            href="/support"
            className="hover:text-ink transition-colors duration-150"
          >
            Support
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <a
            href="#register"
            className="hidden sm:inline-flex py-2 px-4 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors duration-150 shadow-sm items-center space-x-1.5"
          >
            <span>Register Cinema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 rounded-full border border-line text-ink hover:bg-field touch-manipulation"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden max-w-7xl mx-auto mt-2 glass-ios26 glass-ios26-rim glass-ios26-iridescent glass-ios26-glint rounded-3xl px-4 py-5 space-y-3 shadow-elevated">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-muted">
            <a
              href="#proposition"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Product Proposition
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              How It Works (Platform Overview)
            </a>
            <a
              href="#patron-experience"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Patron Experience
            </a>
            <a
              href="#operator-benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Cinema Operator Benefits
            </a>
            <a
              href="#synchronization"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Screening Synchronization
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Studio Rights & Security
            </a>
            <Link
              href="/developers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Developer Integration Portal
            </Link>
            <Link
              href="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-field hover:text-ink"
            >
              Support & Help Center
            </Link>
          </nav>

          <div className="pt-3 border-t border-line flex flex-col space-y-2">
            <a
              href="#register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl text-center font-black text-xs bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-sm flex items-center justify-center space-x-1.5"
            >
              <span>Register Cinema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
