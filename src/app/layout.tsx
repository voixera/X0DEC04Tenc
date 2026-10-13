import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Choco OBF — Lua/Luau Source Obfuscator",
  description:
    "Choco OBF is a Luau source code obfuscation platform for Roblox developers. It makes script source harder to read while preserving runtime behaviour.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-accent antialiased">{children}</body>
    </html>
  );
}
