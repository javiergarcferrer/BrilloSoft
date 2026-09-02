import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Every display use is semibold, so ship the single 600 instance instead of
// the full variable file (≈36 KB → ≈half) and let the browser skip a
// synthesised-bold pass.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.metaDescription,
  applicationName: SITE.name,
  keywords: [
    "limpieza",
    "mantenimiento",
    "limpieza de tapizados",
    "limpieza de muebles",
    "limpieza de alfombras",
    "limpieza de cortinas",
    "tratamiento de madera",
    "Ecolab",
    "República Dominicana",
    "Vista Verde",
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.metaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.metaDescription,
  },
  alternates: { canonical: SITE.url },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: "#2f6144",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">
        <SiteHeader />
        <main id="inicio">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
