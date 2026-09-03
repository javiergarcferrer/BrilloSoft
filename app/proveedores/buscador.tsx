"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconSearch, IconX } from "@/components/icons";
import { cn } from "@/lib/cn";
import { Accion } from "@/components/papel";

/**
 * El campo de búsqueda de proveedores.
 *
 * El estado vive en la URL (`?q=`), como en el resto de la plataforma: una
 * búsqueda se comparte, se marca y se vuelve a ella con el botón atrás. El
 * componente solo traduce lo que se teclea en una navegación, y obedece a la
 * URL cuando esta cambia por fuera.
 *
 * La ayuda bajo el campo no es decorativa: los dos caminos de búsqueda tienen
 * alcances muy distintos —el número busca en el registro entero, el nombre
 * solo entre quienes ganaron algo hace poco— y quien va a teclear necesita
 * saberlo antes, no después de ver «sin resultados».
 */
export default function BuscadorProveedores({
  inicial,
  ayuda,
}: {
  inicial: string;
  ayuda: string;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(inicial);
  const [pendiente, iniciar] = useTransition();

  useEffect(() => setValor(inicial), [inicial]);

  const ir = (texto: string) => {
    const q = texto.trim();
    iniciar(() =>
      router.push(q ? `/proveedores?q=${encodeURIComponent(q)}` : "/proveedores"),
    );
  };

  return (
    <form
      role="search"
      aria-busy={pendiente}
      onSubmit={(e) => {
        e.preventDefault();
        ir(valor);
      }}
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <IconSearch
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="search"
            name="q"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Nombre, RNC, cédula o número de RPE"
            aria-label="Buscar un proveedor del Estado"
            enterKeyHint="search"
            className={cn(
              "w-full rounded-lg border border-hairline bg-surface py-2.5 pl-9 pr-9 text-sm text-ink outline-none transition",
              "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15",
            )}
          />
          {valor && (
            <button
              type="button"
              onClick={() => {
                setValor("");
                ir("");
              }}
              aria-label="Limpiar la búsqueda"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button type="submit" className="shrink-0">
          <Accion>Buscar</Accion>
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{ayuda}</p>
    </form>
  );
}
