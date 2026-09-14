"use client";

import { useId } from "react";
import { IconSearch, IconX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * El campo de búsqueda de la plataforma — uno, no cuatro.
 *
 * Estaba escrito tres veces (licitaciones, proveedores, congreso) con tres
 * alturas, dos radios y dos azules distintos en el botón, y solo uno de los
 * tres ofrecía borrar lo tecleado. Es el patrón de dilución que documenta
 * `docs/IDENTIDAD.md` §8: donde no hay primitiva compartida, la idea se
 * reimplementa en cada sitio y cada copia se desvía un poco.
 *
 * Dos decisiones son de la casa y viajan con la pieza:
 *
 *  · **La ayuda va debajo del campo, siempre que exista.** Los alcances de
 *    búsqueda de esta plataforma son muy distintos entre sí —el RNC busca en el
 *    registro entero, el nombre solo entre quienes ganaron algo hace poco— y
 *    quien va a teclear necesita saberlo *antes*, no después de leer «sin
 *    resultados» (ergonomía §6: un control explica su alcance antes del toque).
 *  · **Borrar es un botón con nombre**, no un aspa muda, y solo aparece cuando
 *    hay algo que borrar.
 */
export function CampoBusqueda({
  valor,
  onValor,
  onEnviar,
  onLimpiar,
  etiqueta,
  placeholder,
  ayuda,
  pendiente = false,
  textoBoton = "Buscar",
  name = "q",
  className,
}: {
  valor: string;
  onValor: (v: string) => void;
  /** Qué hacer al enviar. Recibe el texto ya recortado. */
  onEnviar: (valor: string) => void;
  /** Si se pasa, aparece el botón de borrar. */
  onLimpiar?: () => void;
  /** Para lector de pantalla: «Buscar un proveedor del Estado». */
  etiqueta: string;
  placeholder?: string;
  /** La línea en llano que dice **qué alcance tiene** esta búsqueda. */
  ayuda?: React.ReactNode;
  pendiente?: boolean;
  textoBoton?: string;
  name?: string;
  className?: string;
}) {
  const ayudaId = useId();

  return (
    <form
      role="search"
      aria-busy={pendiente}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar(valor.trim());
      }}
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <IconSearch
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          />
          <Input
            type="search"
            name={name}
            value={valor}
            onChange={(e) => onValor(e.target.value)}
            placeholder={placeholder}
            aria-label={etiqueta}
            aria-describedby={ayuda ? ayudaId : undefined}
            enterKeyHint="search"
            className={cn("pl-9", onLimpiar && valor ? "pr-10" : "pr-3")}
          />
          {onLimpiar && valor && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onLimpiar}
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ink-soft"
            >
              <IconX className="h-4 w-4" />
              <span className="sr-only">Limpiar la búsqueda</span>
            </Button>
          )}
        </div>
        <Button type="submit" disabled={pendiente} className="shrink-0">
          {pendiente ? "Buscando…" : textoBoton}
        </Button>
      </div>
      {ayuda && (
        <p id={ayudaId} className="mt-2 text-xs leading-relaxed text-ink-soft">
          {ayuda}
        </p>
      )}
    </form>
  );
}
