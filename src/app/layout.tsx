import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Choco OBF — Luau Obfuscation Laboratory",
  description:
    "Choco OBF is a Roblox Luau source-code obfuscator. It transforms readable Luau into a harder-to-read equivalent while preserving runtime behaviour, and validates its own output.",
};

export const viewport: Viewport = {
  themeColor: "#100906",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="icon" href="/ChocoOBF.png" type="image/png" />
      </head>
      <body data-theme="cocoa" className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        {children}
      </body>
    </html>
  );
}
