import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <header className="bg-slate-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-lg font-bold">
                L
              </span>
              <span>
                <span className="block text-lg font-semibold leading-tight">
                  Licitaciones RD
                </span>
                <span className="block text-xs text-slate-400">
                  Datos abiertos DGCP · República Dominicana
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/estadisticas"
                className="hidden text-slate-300 hover:text-white sm:block"
              >
                Estadísticas
              </Link>
              <Link href="/guia" className="text-slate-300 hover:text-white">
                Guía
              </Link>
              <Link href="/seguimiento" className="text-slate-300 hover:text-white">
                Seguimiento
              </Link>
              <a
                href="https://datosabiertos.dgcp.gob.do/api-dgcp/docs/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-slate-300 hover:text-white sm:block"
              >
                API DGCP ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-center text-xs text-slate-400">
          Fuente: Portal de Datos Abiertos de la Dirección General de Contrataciones
          Públicas (DGCP). Esta herramienta es independiente y no oficial.
        </footer>
      </body>
    </html>
  );
}
