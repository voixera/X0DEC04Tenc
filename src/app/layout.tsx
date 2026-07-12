import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "X0DEC04T Encrypt — Lua Source Code Encryption",
  description:
    "Professional-grade Lua source code encryption platform. Protect your intellectual property with multi-layer obfuscation and AES-128-GCM encryption.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-accent antialiased">{children}</body>
    </html>
  );
}
