"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import TopSearch from "@/components/top-search";
import { seccionDe } from "@/lib/secciones";

/**
 * Slot de búsqueda del header, con alcance honesto.
 *
 * El buscador de licitaciones (con guardadas y recientes) solo se muestra
 * dentro de su vertical: un campo de búsqueda en el chrome global que en
 * realidad busca una sola cosa es la clase de trampa cognitiva que esta
 * plataforma evita. Fuera de licitaciones el header queda en marca + nav, y
 * cada vertical ofrece su búsqueda dentro de su propia superficie.
 */
export default function HeaderSearch() {
  const pathname = usePathname();
  const seccion = seccionDe(pathname);

  if (!seccion?.conBuscadorGlobal) return null;

  return (
    <Suspense
      fallback={
        <div className="h-12 w-full max-w-xl rounded-full bg-white/10 ring-1 ring-inset ring-white/15" />
      }
    >
      <TopSearch />
    </Suspense>
  );
}
