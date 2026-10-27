import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PottyPlay | Cinema Companion Viewing Platform",
  description:
    "Follow your ongoing cinema screening on your personal device during a quick break. Strict 15-minute companion streaming for authenticated cinema attendees.",
  applicationName: "PottyPlay",
  authors: [{ name: "PottyPlay Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#07090e" },
    { media: "(prefers-color-scheme: dark)", color: "#07090e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cinema-950 text-cinema-100 min-h-[100dvh] flex flex-col selection:bg-gold-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
