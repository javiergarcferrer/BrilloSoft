"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

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
 * saber a qué se enfrenta.
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
    <div className={className}>
      {resumen}
      {abierto && <div className={cn(Boolean(resumen) && "border-t border-hairline")}>{children}</div>}
      <div className={cn("px-5 py-3", Boolean(resumen) && !abierto && "border-t border-hairline")}>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="text-xs font-semibold text-brand-700 hover:underline"
        >
          {abierto ? etiquetaCerrar : etiqueta}
        </button>
      </div>
    </div>
  );
}
