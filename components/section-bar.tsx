"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { seccionDe, vistaActivaDe } from "@/lib/secciones";
import { getSeguimiento, onSeguimientoCambio } from "@/lib/seguimiento";
import { cn } from "@/lib/cn";

/**
 * Barra de sección: el segundo nivel de la jerarquía de navegación.
 *
 * Aparece solo dentro de una vertical y responde dos preguntas sin que el
 * usuario piense: «¿en qué vertical estoy?» (nombre + punto de matiz, siempre
 * en el mismo sitio) y «¿qué vistas tiene esta vertical?» (tabs con indicador
 * de activo). En el panorama y en páginas de plataforma (/fuentes) no pinta
 * nada: ahí no hay sección de la que orientarse.
 */
export default function SectionBar() {
  const pathname = usePathname();
  const seccion = seccionDe(pathname);

  const [seguidos, setSeguidos] = useState(0);
  useEffect(() => {
    const sync = () => setSeguidos(getSeguimiento().length);
    sync();
    return onSeguimientoCambio(sync);
  }, []);

  if (!seccion) return null;

  const activa = vistaActivaDe(seccion, pathname);
  const unaSolaVista = seccion.vistas.length <= 1;

  return (
    <div className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4">
        <span className="flex shrink-0 items-center gap-2 py-2.5 pr-2 text-[13px] font-semibold text-ink">
          <span aria-hidden className={cn("h-2 w-2 rounded-full", seccion.hue.punto)} />
          {seccion.nombre}
          <span className="hidden font-normal text-ink-soft sm:inline">
            {seccion.descriptor}
          </span>
        </span>

        {!unaSolaVista && (
          <nav aria-label={`Vistas de ${seccion.nombre}`} className="flex items-center">
            {seccion.vistas.map((vista) => {
              const esActiva = activa?.href === vista.href;
              return (
                <Link
                  key={vista.href}
                  href={vista.href}
                  aria-current={esActiva ? "page" : undefined}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13px] transition-colors",
                    esActiva
                      ? cn("font-semibold", seccion.hue.activo)
                      : "font-medium text-ink-soft hover:text-ink",
                  )}
                >
                  {vista.label}
                  {vista.seguimiento && seguidos > 0 && (
                    <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">
                      {seguidos}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity",
                      seccion.hue.barra,
                      esActiva ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
