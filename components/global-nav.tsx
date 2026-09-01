"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES, seccionDe } from "@/lib/secciones";
import { cn } from "@/lib/cn";

/**
 * Navegación primaria de escritorio (el móvil navega con la tab bar inferior).
 *
 * Un ítem por vertical más el panorama. El estado activo responde «¿dónde
 * estoy?» desde cualquier profundidad: `/procesos/XYZ` enciende Licitaciones,
 * `/congreso/155693` enciende Congreso. Vive sobre el header oscuro.
 */
export default function GlobalNav() {
  const pathname = usePathname();
  const actual = seccionDe(pathname);

  const base =
    "relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors";

  return (
    <nav aria-label="Secciones" className="hidden items-center gap-0.5 lg:flex">
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={cn(
          base,
          pathname === "/"
            ? "bg-canvas/12 text-canvas"
            : "text-canvas/65 hover:bg-canvas/10 hover:text-canvas",
        )}
      >
        Panorama
      </Link>

      {SECCIONES.map((seccion) => {
        const activa = actual?.id === seccion.id;
        return (
          <Link
            key={seccion.id}
            href={seccion.href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              base,
              "flex items-center gap-1.5",
              activa
                ? "bg-canvas/12 text-canvas"
                : "text-canvas/65 hover:bg-canvas/10 hover:text-canvas",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-opacity",
                seccion.hue.punto,
                activa ? "opacity-100" : "opacity-40",
              )}
            />
            <>
                <span className="xl:hidden">{seccion.nombre}</span>
                <span className="hidden xl:inline">{seccion.pregunta}</span>
              </>
          </Link>
        );
      })}
    </nav>
  );
}
