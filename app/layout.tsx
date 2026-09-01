import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Public_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import MobileTabBar from "@/components/mobile-tab-bar";
import InstallPrompt from "@/components/install-prompt";
import ScrollTop from "@/components/scroll-top";
import HeaderSearch from "@/components/header-search";
import GlobalNav from "@/components/global-nav";
import SectionBar from "@/components/section-bar";
import { SECCIONES } from "@/lib/secciones";

/*
  Tres familias, tres oficios (ver app/globals.css):
    · Instrument Serif — la pregunta: titulares.
    · Public Sans      — la explicación: cuerpo e interfaz. Es la tipografía
      del estándar web de gobierno, puesta a servir al ciudadano.
    · IBM Plex Mono    — el registro: montos, códigos, expedientes y fechas,
      todo lo que se copia y se verifica.
*/
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Socrático.do — Preguntarle al Estado con sus propios datos",
    template: "%s · Socrático.do",
  },
  description:
    "Qué compra, qué legisla y a quién paga el Estado dominicano: compras públicas de la DGCP, iniciativas del Congreso Nacional y la nómina pública, leídas en vivo desde sus fuentes oficiales.",
  openGraph: {
    title: "Socrático.do",
    description:
      "Compras públicas, Congreso Nacional y nómina estatal de República Dominicana, en un solo lugar.",
    locale: "es_DO",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Socrático.do",
  },
};

export const viewport: Viewport = {
  themeColor: "#171d2e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * El contrasello: un sello que no aprueba nada, pregunta.
 *
 * En el país del sello y la firma, la marca toma la forma del instrumento que
 * valida documentos y la pone del lado del ciudadano: el aro lleva el registro
 * y el centro, la «¿» —que en español anuncia que la pregunta apenas empieza—.
 * Su punto va siempre en rojo sello: es la regla única de la identidad.
 */
function BrandMark({
  className = "h-9 w-9",
  fondo = "#171d2e",
  trazo = "#f7f3ea",
}: {
  className?: string;
  /** Color del sello. Tinta sobre papel; papel sobre tinta. */
  fondo?: string;
  trazo?: string;
}) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-label="Socrático.do">
      <rect width="96" height="96" rx="20" fill={fondo} />
      <g transform="translate(48 50) scale(0.5) translate(-100 -96)">
        {/* La «¿» se dibuja girando media vuelta el signo de cierre. */}
        <g transform="rotate(180 100 96)">
          <path
            d="M 74 72 C 74 42 126 42 126 72 C 126 94 103 93 103 114"
            fill="none"
            stroke={trazo}
            strokeWidth="15"
            strokeLinecap="round"
          />
          {/* El punto es el sello: nunca cambia de color. */}
          <circle cx="103" cy="143" r="10" fill="#a63a2a" />
        </g>
      </g>
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${publicSans.variable} ${instrumentSerif.variable} ${plexMono.variable}`}>
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
          className="sticky top-0 z-50 bg-ink/95 text-white backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex min-h-[64px] max-w-6xl items-center gap-4 px-4 py-2">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <BrandMark className="h-9 w-9" fondo="#f7f3ea" trazo="#171d2e" />
              <span className="font-display text-[19px] leading-none max-[380px]:hidden">
                Socrático<span className="text-sello-400">.do</span>
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
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
              <div className="shrink-0 lg:w-60">
                <div className="flex items-center gap-2.5">
                  <BrandMark className="h-9 w-9" />
                  <span className="font-display text-[19px] leading-none text-ink">
                    Socrático<span className="punto-sello">.do</span>
                  </span>
                </div>
                <p className="mt-4 max-w-xs text-xs leading-relaxed">
                  Qué compra, qué legisla y a quién paga el Estado dominicano,
                  leído en vivo desde sus fuentes oficiales. Herramienta
                  independiente y no oficial.
                </p>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
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
            </div>

            {/*
              Banda de seguridad y cumplimiento: los estándares a la vista en
              toda la plataforma, con el marco normativo dominicano nombrado.
              La credibilidad institucional se declara página por página.
            */}
            <div className="mt-10 rounded-2xl border border-hairline bg-canvas/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-brand-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3z" />
                    <path d="M9.5 12l1.8 1.8 3.4-3.6" />
                  </svg>
                  Seguridad y cumplimiento
                </h2>
                <Link
                  href="/seguridad"
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  Postura completa →
                </Link>
              </div>

              <div className="mt-4 grid gap-x-8 gap-y-4 text-xs leading-relaxed sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold text-brand-700">
                    Ley 172-13
                  </p>
                  <p className="mt-1 font-semibold text-ink">Protección de datos personales</p>
                  <p className="mt-0.5">
                    Las superficies de inteligencia no guardan datos personales.
                    En Democracia, la cédula se cifra con una clave que no sale
                    de la base y el voto es privado a nivel de base de datos.
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold text-brand-700">
                    Ley 200-04
                  </p>
                  <p className="mt-1 font-semibold text-ink">Acceso a la información pública</p>
                  <p className="mt-0.5">
                    Fuentes oficiales leídas con agente identificable,
                    respetando robots.txt y sin evadir bloqueos. Lo que una
                    fuente niega, se declara.
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold text-brand-700">
                    NORTIC · OGTIC
                  </p>
                  <p className="mt-1 font-semibold text-ink">Estándares web del Estado</p>
                  <p className="mt-0.5">
                    HTTPS de extremo a extremo, minimización de datos, código y
                    migraciones auditables en el repositorio.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-hairline pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p>
                Fuentes: DGCP, los SIL de ambas cámaras del Congreso, la
                Consultoría Jurídica del Poder Ejecutivo, Crédito Público y las
                nóminas de transparencia institucional.
              </p>
              <nav className="flex shrink-0 gap-x-4">
                <Link href="/" className="hover:text-brand-700">Panorama</Link>
                <Link href="/seguridad" className="hover:text-brand-700">Seguridad</Link>
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
