"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "./icons";

/** Floating scroll-to-top button; appears after scrolling, sits above the
 *  mobile tab bar. */
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
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      /*
        El mismo defecto que tenía el aviso de instalación: el desplazamiento
        inferior libra la tab bar móvil, que en escritorio es `lg:hidden`, y
        aquí no había **ningún** override `lg:`. El botón flotaba 84 px sobre
        el borde esquivando una barra que no se pinta.
      */
      className="boton-subir fixed right-4 z-40 grid h-11 w-11 place-items-center rounded-lg bg-ink text-canvas shadow-card transition hover:bg-brand-700 active:scale-90 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-4"
    >
      <IconArrowUp className="h-5 w-5" />
    </button>
  );
}
