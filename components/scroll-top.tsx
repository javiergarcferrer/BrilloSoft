"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconArrowUp } from "./icons";
import { Button } from "@/components/ui/button";
import { subeConLaPestana, subirArriba } from "@/components/mobile-tab-bar";
import { cn } from "@/lib/cn";

/**
 * Botón flotante para volver arriba — tras tres pantallas.
 *
 * Desde `lg`, donde no hay tab bar, aparece siempre en la esquina inferior
 * derecha. Por debajo de `lg` depende de la página. En las cuatro raíces de
 * la tab bar (`/`, `/licitaciones`, `/congreso`, `/nomina`) no se pinta:
 * ahí sube al principio tocar la pestaña encendida, como en las apps del
 * sistema, y un botón encima de la columna —que en el teléfono ocupa todo el
 * ancho— tapaba los títulos de las tarjetas. En cualquier otra ruta —una
 * ficha, una vista interna, una página de «Más»— ninguna pestaña es la página
 * actual, así que tocarla navega en vez de subir; sin el botón, el teléfono se
 * quedaba sin manera de volver arriba. Ahí flota por encima de la tab bar y,
 * si la ficha monta su barra de acciones (`data-barra-acciones`), por encima
 * de ella también, igual que el aviso de instalación.
 *
 * Tres pantallas y no 700 px: antes de eso, volver arriba es un gesto del
 * pulgar o de la rueda y el botón no ahorra nada; solo estorba.
 *
 * Flota de verdad: es de las piezas de la plataforma que llevan sombra.
 * `boton-subir` es el asidero por el que `globals.css` lo retira mientras el
 * aviso de instalación ocupa su esquina.
 */
export default function ScrollTop() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 3);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  // En una raíz de pestaña, en el teléfono sube la pestaña: el botón solo desde `lg`.
  const soloEscritorio = subeConLaPestana(pathname);

  return (
    <Button
      size="icon"
      onClick={subirArriba}
      className={cn(
        "boton-subir fixed right-4 z-40 h-11 w-11 rounded-lg bg-ink text-canvas shadow-card hover:bg-brand-700",
        "bottom-[calc(5.25rem+env(safe-area-inset-bottom))] max-lg:[[data-barra-acciones]_&]:bottom-[calc(9.75rem+env(safe-area-inset-bottom))] lg:bottom-4",
        soloEscritorio ? "hidden lg:inline-flex" : "inline-flex",
      )}
    >
      <IconArrowUp className="h-5 w-5" />
      <span className="sr-only">Volver arriba</span>
    </Button>
  );
}
