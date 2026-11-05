"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Glass, Button as GlisseButton } from "@/components/glisse";
import { Menu, X, ArrowRight, Smartphone } from "lucide-react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { id: "proposition", label: "Proposition" },
    { id: "how-it-works", label: "How It Works" },
    { id: "patron-experience", label: "Experience" },
    { id: "operator-benefits", label: "Theater Benefits" },
    { id: "synchronization", label: "Sync" },
    { id: "security", label: "Security & Rights" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo inside subtle glass pill */}
        <div className="flex-shrink-0">
          <Glass className="h-14 px-4 sm:px-5 flex items-center rounded-full border border-white/15 glass-ios26 glass-ios26-rim glass-ios26-glint shadow-lg">
            <BrandLogo size="md" variant="full" href="/" />
          </Glass>
        </div>

        {/* Central Glass Header containing nav links, developers, support & companion app */}
        <Glass className="hidden lg:flex items-center h-14 px-3 xl:px-4 rounded-full border border-white/20 glass-ios26 glass-ios26-rim glass-ios26-glint shadow-2xl space-x-1 flex-shrink-0">
          <nav className="flex items-center space-x-1 text-xs font-semibold text-muted">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="px-2.5 xl:px-3 py-1.5 rounded-full text-muted hover:text-ink hover:bg-white/10 active:scale-95 transition-all duration-150"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/developers"
              className="px-2.5 xl:px-3 py-1.5 rounded-full text-muted hover:text-ink hover:bg-white/10 active:scale-95 transition-all duration-150"
            >
              Developers
            </Link>
            <Link
              href="/support"
              className="px-2.5 xl:px-3 py-1.5 rounded-full text-muted hover:text-ink hover:bg-white/10 active:scale-95 transition-all duration-150"
            >
              Support
            </Link>
          </nav>

          <span className="w-px h-5 bg-white/15 mx-1" aria-hidden="true" />

          {/* Companion App Link inside this central header */}
          <Link href="/app?emulator=true">
            <GlisseButton
              variant="glass"
              className="text-xs font-bold whitespace-nowrap"
              icon={<Smartphone className="w-3.5 h-3.5" />}
            >
              <span>Companion App</span>
            </GlisseButton>
          </Link>
        </Glass>

        {/* Action Button: Register Cinema placed outside the central nav header with an outline */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <GlisseButton
            variant="filled"
            onClick={() => scrollToSection("register")}
            className="hidden sm:inline-flex h-14 px-5 sm:px-6 text-xs font-black shadow-xl border-2 border-amber-400/60 hover:border-amber-300 rounded-full"
          >
            <span>Register Cinema</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </GlisseButton>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-14 w-14 flex items-center justify-center rounded-full lg-glass border border-white/15 text-ink hover:bg-white/10 touch-manipulation shadow-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <Glass className="lg:hidden max-w-7xl mx-auto mt-2 glass-ios26 glass-ios26-rim rounded-3xl px-4 py-5 space-y-3 shadow-elevated border border-white/15">
          <nav className="flex flex-col space-y-1.5 text-sm font-semibold text-muted">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="text-left px-3 py-2 rounded-xl hover:bg-white/10 hover:text-ink transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/app?emulator=true"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/10 text-amber-400 font-bold"
            >
              Open Companion App (Emulator Mode)
            </Link>
            <Link
              href="/developers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/10 hover:text-ink transition-colors"
            >
              Developers & Architecture
            </Link>
            <Link
              href="/support"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-white/10 hover:text-ink transition-colors"
            >
              Support & Inquiries
            </Link>
          </nav>

          <div className="pt-3 border-t border-line flex flex-col space-y-2">
            <GlisseButton
              variant="filled"
              onClick={() => scrollToSection("register")}
              className="w-full text-xs font-black"
            >
              <span>Register Cinema</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </GlisseButton>
          </div>
        </Glass>
      )}
    </header>
  );
}
