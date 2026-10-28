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
        {children}
      </body>
    </html>
  );
}

