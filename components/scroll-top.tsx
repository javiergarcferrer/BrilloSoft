"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "./icons";
import { Button } from "@/components/ui/button";

/** Botón flotante para volver arriba; aparece tras desplazarse un poco. */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <Button
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      /*
        Flota de verdad: es de las tres piezas de la plataforma que llevan
        sombra. El desplazamiento inferior libra la tab bar móvil, que en
        escritorio es `lg:hidden` — sin el override `lg:` el botón flotaba
        84 px sobre el borde esquivando una barra que no se pinta.
      */
      className="boton-subir fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 h-11 w-11 rounded-lg bg-ink text-canvas shadow-card hover:bg-brand-700 lg:bottom-4"
    >
      <IconArrowUp className="h-5 w-5" />
      <span className="sr-only">Volver arriba</span>
    </Button>
  );
}
