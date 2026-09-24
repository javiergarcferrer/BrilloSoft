"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "./icons";
import { Button } from "@/components/ui/button";

/** Sube al principio de la página, sin animar si se pidió menos movimiento. */
export function subirArriba() {
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: quieto ? "auto" : "smooth" });
}

/**
 * Botón flotante para volver arriba — solo desde `xl` y solo tras tres
 * pantallas.
 *
 * Por debajo de `xl` no existe, y es una decisión, no un olvido. Medido a
 * 390 px en `/licitaciones`, el botón aparecía a los 700 px de desplazamiento
 * y caía sobre el título de las tarjetas: en el teléfono la columna de
 * contenido ocupa todo el ancho, así que cualquier cosa que flote encima tapa
 * algo. Ahí volver arriba es de la tab bar —tocar la pestaña de la página en
 * la que ya se está sube al principio, como en las apps del sistema— y, en
 * iOS, de tocar la barra de estado. Entre `lg` y `xl` la columna de 72 rem
 * deja menos de 60 px de margen y el botón seguiría pisando el borde derecho
 * del contenido; desde 1280 px el margen le cabe entero.
 *
 * Tres pantallas y no 700 px: antes de eso, volver arriba es un gesto del
 * pulgar o de la rueda y el botón no ahorra nada; solo estorba.
 *
 * Flota de verdad: es de las piezas de la plataforma que llevan sombra.
 * `boton-subir` es el asidero por el que `globals.css` lo retira mientras el
 * aviso de instalación ocupa su esquina.
 */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 3);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <Button
      size="icon"
      onClick={subirArriba}
      className="boton-subir fixed bottom-4 right-4 z-40 hidden h-11 w-11 rounded-lg bg-ink text-canvas shadow-card hover:bg-brand-700 xl:inline-flex"
    >
      <IconArrowUp className="h-5 w-5" />
      <span className="sr-only">Volver arriba</span>
    </Button>
  );
}
