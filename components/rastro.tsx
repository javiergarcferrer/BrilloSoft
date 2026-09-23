"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * De qué ruta vino el lector, dentro de esta visita. No pinta nada.
 *
 * `document.referrer` no sirve: en una navegación de cliente de Next no
 * cambia, y sigue diciendo la página por la que se entró al sitio. Aquí se
 * lleva la cuenta a mano, solo del `pathname` —la consulta la guarda el
 * historial del navegador, que es justo lo que `components/ruta.tsx` usa para
 * volver—, en memoria del módulo: dura lo que dura la pestaña y no se escribe
 * en ningún sitio.
 */
let actual: string | null = null;
let anterior: string | null = null;

export function rutaAnterior(): string | null {
  return anterior;
}

export default function Rastro() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === actual) return;
    anterior = actual;
    actual = pathname;
  }, [pathname]);
  return null;
}
