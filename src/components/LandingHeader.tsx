"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Menu, X, ArrowRight, ExternalLink } from "lucide-react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-bg/95 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo size="md" variant="full" href="/" />

        {/* Public B2B Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-7 text-xs font-semibold text-brand-text-secondary">
          <a
            href="#proposition"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            Proposition
          </a>
          <a
            href="#how-it-works"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            How It Works
          </a>
          <a
            href="#patron-experience"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            Patron Experience
          </a>
          <a
            href="#operator-benefits"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            Theater Benefits
          </a>
          <a
            href="#synchronization"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            Synchronization
          </a>
          <a
            href="#security"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            Security & Rights
          </a>
          <Link
            href="/developers"
            className="hover:text-brand-text-primary transition-colors duration-150"
          >
            Developers
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center space-x-3">
          <a
            href="#how-it-works"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-brand-text-primary hover:bg-neutral-100 transition-colors duration-150 border border-brand-border flex items-center"
          >
            <span>Platform Overview</span>
          </a>
          <a
            href="#register"
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-primary text-brand-accent hover:bg-brand-secondary transition-colors duration-150 shadow-subtle flex items-center space-x-1.5"
          >
            <span>Register Cinema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-xl border border-brand-border text-brand-text-primary hover:bg-white touch-manipulation"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-brand-border bg-brand-bg px-4 py-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-brand-text-secondary">
            <a
              href="#proposition"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary"
            >
              Product Proposition
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary"
            >
              How It Works
            </a>
            <a
              href="#patron-experience"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary"
            >
              Patron Experience
            </a>
            <a
              href="#operator-benefits"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary"
            >
              Cinema Operator Benefits
            </a>
            <a
              href="#synchronization"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary"
            >
              Screening Synchronization
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary"
            >
              Security & Entitlement Controls
            </a>
            <Link
              href="/developers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-white hover:text-brand-text-primary flex items-center justify-between"
            >
              <span>Developer Documentation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </nav>

          <div className="pt-3 border-t border-brand-border flex flex-col space-y-2 pb-[env(safe-area-inset-bottom)]">
            <a
              href="#register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 px-4 rounded-xl text-xs font-bold bg-brand-primary text-brand-accent hover:bg-brand-secondary shadow-subtle flex items-center justify-center space-x-1.5"
            >
              <span>Register Cinema Partner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
