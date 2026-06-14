import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SiteNav from "@/components/site-nav";
import MobileTabBar from "@/components/mobile-tab-bar";
import InstallPrompt from "@/components/install-prompt";
import ScrollTop from "@/components/scroll-top";
import SavedSearchesMenu from "@/components/saved-searches-menu";

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
    default: "Licitaciones RD — Oportunidades de compras públicas",
    template: "%s · Licitaciones RD",
  },
  description:
    "Explora y busca procesos de compras y licitaciones del Estado dominicano usando los datos abiertos de la DGCP: filtros por institución, precios históricos de adjudicación y guía para ofertar.",
  openGraph: {
    title: "Licitaciones RD",
    description:
      "Encuentra oportunidades de compras públicas en República Dominicana y aprende cómo ofertar.",
    locale: "es_DO",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Licitaciones RD",
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
    <svg viewBox="0 0 40 40" className="h-9 w-9" role="img" aria-label="Licitaciones RD">
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
        <header
          className="sticky top-0 z-50 bg-slate-900/90 text-white backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
            >
              <BrandMark />
              <span className="leading-tight">
                <span className="block text-[15px] font-semibold tracking-tight">
                  Licitaciones RD
                </span>
                <span className="hidden text-[11px] text-slate-400 sm:block">
                  Datos abiertos DGCP · República Dominicana
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <div className="hidden lg:block">
                <SiteNav />
              </div>
              <SavedSearchesMenu />
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/45 to-transparent" />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <MobileTabBar />
        <ScrollTop />
        <InstallPrompt />

        <footer className="mt-10 border-t border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <BrandMark />
                <span className="font-semibold text-ink">Licitaciones RD</span>
              </div>
              <nav className="flex flex-wrap gap-x-5 gap-y-1">
                <Link href="/" className="hover:text-brand-700">Buscar</Link>
                <Link href="/estadisticas" className="hover:text-brand-700">Estadísticas</Link>
                <Link href="/guia" className="hover:text-brand-700">Guía para ofertar</Link>
                <Link href="/seguimiento" className="hover:text-brand-700">Seguimiento</Link>
              </nav>
            </div>
            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-ink-soft">
              Fuente: Portal de Datos Abiertos de la Dirección General de
              Contrataciones Públicas (DGCP). Esta herramienta es independiente y
              no oficial; los datos se muestran tal como los publica la DGCP.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
