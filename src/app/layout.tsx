import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Choco OBF — Luau Source Obfuscator",
  description:
    "Choco OBF is a Roblox Luau source-code obfuscator. It transforms readable Luau into a harder-to-read equivalent while preserving runtime behaviour, and validates its own output.",
};

export const viewport: Viewport = {
  themeColor: "#160c09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-theme="cocoa" className="bg-bg text-accent antialiased">
        {children}
      </body>
    </html>
  );
}
