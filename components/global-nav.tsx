"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES, seccionDe } from "@/lib/secciones";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

/**
 * Navegación primaria de escritorio (el móvil navega con la tab bar inferior).
 *
 * Un ítem por vertical más el panorama. El estado activo responde «¿dónde
 * estoy?» desde cualquier profundidad: `/procesos/XYZ` enciende Licitaciones,
 * `/congreso/155693` enciende Congreso. Vive sobre el header oscuro, y por eso
 * usa la variante `tinta` del botón: es la única que está pensada para fondo
 * de tinta.
 *
 * Aquí las etiquetas son **preguntas** («¿Qué compra?») cuando hay sitio: el
 * usuario está eligiendo a dónde ir y la pregunta dice qué va a encontrar. En
 * la barra de sección y en la tab bar, donde ya sabe dónde está, manda el
 * sustantivo corto.
 */
export default function GlobalNav() {
  const pathname = usePathname();
  const actual = seccionDe(pathname);

  const item = cn(
    buttonVariants({ variant: "tinta", size: "sm" }),
    "h-8 gap-1.5 px-3 text-[13px] font-medium",
  );

  return (
    <nav aria-label="Secciones" className="hidden items-center gap-0.5 lg:flex">
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        data-activo={pathname === "/"}
        className={item}
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
            data-activo={activa}
            className={item}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-opacity",
                seccion.hue.punto,
                activa ? "opacity-100" : "opacity-40",
              )}
            />
            <span className="xl:hidden">{seccion.nombre}</span>
            <span className="hidden xl:inline">{seccion.pregunta}</span>
          </Link>
        );
      })}
    </nav>
  );
}
