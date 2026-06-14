import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { TrackerProvider } from "@/lib/licitaciones/store";
import { AppHeader } from "@/components/licita/app-header";
import { AppFooter } from "@/components/licita/app-footer";
import { CommandPalette } from "@/components/licita/command-palette";
import { PLATFORM } from "@/lib/licitaciones/data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const SITE_URL = "https://licitard.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PLATFORM.name} — ${PLATFORM.tagline}`,
    template: `%s · ${PLATFORM.name}`,
  },
  description: PLATFORM.descripcion,
  applicationName: PLATFORM.name,
  keywords: [
    "licitaciones",
    "contrataciones públicas",
    "DGCP",
    "Portal Transaccional",
    "compras dominicanas",
    "República Dominicana",
    "licitaciones públicas",
    "concursos públicos",
    "proveedores del Estado",
    "LicitaRD",
  ],
  authors: [{ name: PLATFORM.name }],
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: SITE_URL,
    siteName: PLATFORM.name,
    title: `${PLATFORM.name} — ${PLATFORM.tagline}`,
    description: PLATFORM.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: `${PLATFORM.name} — ${PLATFORM.tagline}`,
    description: PLATFORM.descripcion,
  },
  alternates: { canonical: SITE_URL },
  category: "government",
};

export const viewport: Viewport = {
  themeColor: "#1f4fd8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">
        <TrackerProvider>
          <AppHeader />
          <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
          <AppFooter />
          <CommandPalette />
        </TrackerProvider>
      </body>
    </html>
  );
}
