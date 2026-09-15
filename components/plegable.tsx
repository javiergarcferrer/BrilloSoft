"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Revelación progresiva.
 *
 * Un historial de 33 trámites en bruto no informa: entierra el único evento
 * que importa —el último— bajo treinta y dos rutinarios. La regla es mostrar
 * el resumen que responde la pregunta y dejar el resto a un toque, sin perder
 * nada: la transparencia no exige vaciar el expediente en la pantalla, exige
 * que el expediente esté ahí.
 *
 * El botón dice **cuántos hay**, no «ver más»: quien decide si abre necesita
 * saber a qué se enfrenta. Esa es la política, y por eso esta pieza existe
 * sobre `ui/collapsible` en vez de llamarlo directamente desde las páginas: el
 * `Collapsible` de Radix aporta el estado, el `aria-expanded` y la relación
 * entre disparador y región; la regla de qué dice el botón es de la casa.
 */
export default function Plegable({
  resumen,
  children,
  etiqueta,
  etiquetaCerrar = "Ocultar",
  className,
}: {
  /** Lo que se ve siempre: lo que responde la pregunta. */
  resumen?: ReactNode;
  /** El resto, que aparece al abrir. */
  children: ReactNode;
  /** «Ver los 33 trámites». Con el número, siempre. */
  etiqueta: string;
  etiquetaCerrar?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Collapsible open={abierto} onOpenChange={setAbierto} className={className}>
      {resumen}
      <CollapsibleContent>
        <div className={cn(Boolean(resumen) && "border-t border-hairline")}>
          {children}
        </div>
      </CollapsibleContent>
      {/*
        El mando ocupa el ancho del bloque y mide 44 px de alto en el teléfono.
        Antes era un renglón de texto de 16 px perdido en el medio de un
        contenedor con relleno: el dedo acertaba en la caja, no en el botón, y
        el toque no hacía nada. Quien abre un historial de treinta trámites lo
        hace con el pulgar, así que el objetivo es la fila entera.
      */}
      <div className={cn(Boolean(resumen) && !abierto && "border-t border-hairline")}>
        <CollapsibleTrigger className="flex min-h-11 w-full items-center px-5 py-3 text-left text-xs font-semibold text-brand-700 transition-colors hover:bg-canvas/60 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
          {abierto ? etiquetaCerrar : etiqueta}
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
