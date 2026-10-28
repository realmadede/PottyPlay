import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PottyPlay | Cinema Companion Viewing Platform",
  description:
    "Authoritative cinema companion viewing platform. Continue following your ongoing theatrical screening during a temporary break.",
  applicationName: "PottyPlay",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand-mark.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0D0F12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-bg text-ink min-h-[100dvh] flex flex-col selection:bg-amber-500 selection:text-neutral-950 font-sans antialiased"
      >
        {/* iOS 26 Global Optical Lens Displacement Filter */}
        <svg className="fixed pointer-events-none w-0 h-0 overflow-hidden" aria-hidden="true" focusable="false">
          <defs>
            <filter id="ios26-lens" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feBlend in="SourceGraphic" in2="displaced" mode="screen" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}

