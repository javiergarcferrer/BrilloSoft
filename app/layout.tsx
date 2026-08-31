import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import MobileTabBar from "@/components/mobile-tab-bar";
import InstallPrompt from "@/components/install-prompt";
import ScrollTop from "@/components/scroll-top";
import HeaderSearch from "@/components/header-search";
import GlobalNav from "@/components/global-nav";
import SectionBar from "@/components/section-bar";
import { SECCIONES } from "@/lib/secciones";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gobiername.data — Inteligencia sobre el Estado dominicano",
    template: "%s · Gobiername.data",
  },
  description:
    "Qué compra, qué legisla y a quién paga el Estado dominicano: compras públicas de la DGCP, iniciativas del Congreso Nacional y la nómina pública, leídas en vivo desde sus fuentes oficiales.",
  openGraph: {
    title: "Gobiername.data",
    description:
      "Compras públicas, Congreso Nacional y nómina estatal de República Dominicana, en un solo lugar.",
    locale: "es_DO",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gobiername.data",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" role="img" aria-label="Gobiername.data">
      <defs>
        <linearGradient id="lrd-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lrd-grad)" />
      <rect x="11" y="12" width="13" height="2.4" rx="1.2" fill="white" opacity="0.95" />
      <rect x="11" y="18" width="8.5" height="2.4" rx="1.2" fill="white" opacity="0.65" />
      <circle cx="23.5" cy="24" r="5.4" fill="none" stroke="white" strokeWidth="2.3" />
      <path d="M27.2 27.7 30.8 31.3" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] antialiased lg:pb-0">
        {/*
          Chrome de dos niveles:
          1) Header global — marca, búsqueda con alcance (solo donde aplica) y
             el nav de verticales en escritorio. Responde «¿qué es esto y a
             dónde puedo ir?».
          2) SectionBar — solo dentro de una vertical: nombre, matiz y sus
             vistas. Responde «¿dónde estoy y qué hay aquí?».
          El contenido nunca carga con tareas de orientación.
        */}
        <header
          className="sticky top-0 z-50 bg-slate-900/90 text-white backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex min-h-[64px] max-w-6xl items-center gap-4 px-4 py-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <BrandMark />
              <span className="text-[15px] font-semibold tracking-tight max-[380px]:hidden">
                Gobiername<span className="text-emerald-400">.data</span>
              </span>
            </Link>

            <div className="flex min-w-0 flex-1 justify-center">
              <HeaderSearch />
            </div>

            <GlobalNav />
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </header>

        <SectionBar />

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <MobileTabBar />
        <ScrollTop />
        <InstallPrompt />

        <footer className="mt-10 border-t border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-soft">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2.5">
                  <BrandMark />
                  <span className="font-semibold text-ink">Gobiername.data</span>
                </div>
                <p className="mt-4 max-w-xs text-xs leading-relaxed">
                  Qué compra, qué legisla y a quién paga el Estado dominicano,
                  leído en vivo desde sus fuentes oficiales. Herramienta
                  independiente y no oficial.
                </p>
              </div>

              {SECCIONES.map((seccion) => (
                <nav key={seccion.id} aria-label={seccion.nombre}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink">
                    <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${seccion.hue.punto}`} />
                    {seccion.nombre}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {seccion.vistas.map((vista) => (
                      <li key={vista.href}>
                        <Link href={vista.href} className="hover:text-brand-700">
                          {vista.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2 border-t border-hairline pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p>
                Fuentes: DGCP, SIL de la Cámara de Diputados y la nómina pública
                de empleados fijos.
              </p>
              <nav className="flex gap-x-4">
                <Link href="/" className="hover:text-brand-700">Panorama</Link>
                <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
                  Estado de las fuentes
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
