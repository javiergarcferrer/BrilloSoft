import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "BrilloSoft — Cleaning Operations CRM",
  description:
    "Coordinate cleaning crews, quote jobs, manage recurring clients and keep accounting in sync.",
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh">
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
