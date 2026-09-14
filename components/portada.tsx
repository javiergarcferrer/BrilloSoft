import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * La portada de una vertical: la banda de tinta con la pregunta.
 *
 * Es **tinta plana** con la trama de papel milimetrado, nunca un degradado
 * (docs/IDENTIDAD.md §1), y su epígrafe lleva el punto en rojo sello, que es la
 * regla única de la marca. El titular es una pregunta y va en serif: la
 * pregunta la hace la plataforma y la responden los datos de abajo.
 *
 * Estaba copiada en siete páginas —siete veces la misma trama, el mismo punto y
 * el mismo `p-6 sm:p-8`— con las diferencias que era de esperar: titulares a
 * dos tamaños distintos y párrafos separados unas veces `mt-1.5` y otras
 * `mt-3`. Ahora la portada es una y las páginas solo traen su pregunta.
 */
export function Portada({
  rotulo,
  titulo,
  descripcion,
  aviso,
  children,
  principal = false,
  className,
}: {
  /** El epígrafe en versalitas: la fuente y su corte. */
  rotulo: ReactNode;
  /** La pregunta. */
  titulo: ReactNode;
  /** El párrafo que explica qué se está mirando. */
  descripcion?: ReactNode;
  /** Segunda línea de rótulo, en ocre: el alcance de una muestra, un límite. */
  aviso?: ReactNode;
  /** Lo que va debajo: la tira de cifras, los botones. */
  children?: ReactNode;
  /**
   * La portada del panorama, que es la primera pantalla de la plataforma:
   * respira un poco más y su pregunta es la más grande del sitio. Una sola
   * página la lleva.
   */
  principal?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg bg-ink text-canvas",
        className,
      )}
    >
      <div className="absolute inset-0 app-grid-dark" aria-hidden />
      <div className={cn("relative p-6", principal ? "sm:p-9" : "sm:p-8")}>
        <p className="rotulo inline-flex items-start gap-2 text-canvas/70">
          <span
            aria-hidden
            className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-sello-400"
          />
          <span>{rotulo}</span>
        </p>

        {aviso && (
          <p className="rotulo mt-3 flex items-start gap-2 text-alerta-200">
            <span
              aria-hidden
              className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-alerta-400"
            />
            <span>{aviso}</span>
          </p>
        )}

        <h1
          className={cn(
            "mt-4 max-w-3xl font-display leading-[1.1]",
            principal ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
          )}
        >
          {titulo}
        </h1>

        {descripcion && (
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-canvas/70">
            {descripcion}
          </div>
        )}

        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

/** La tira de cifras de una portada: casillas sobre la tinta. */
export function PortadaCifras({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {children}
    </dl>
  );
}

/**
 * Una cifra sobre la tinta. Todas en mono tabular —se comparan entre sí—; lo
 * único que distingue a la destacada es el relleno, no la familia.
 */
export function PortadaCifra({
  etiqueta,
  valor,
  destacar = false,
}: {
  etiqueta: ReactNode;
  valor: ReactNode;
  destacar?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3",
        destacar ? "bg-canvas/10" : "bg-canvas/5",
      )}
    >
      <dt className="text-xs text-canvas/60">{etiqueta}</dt>
      <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
        {valor}
      </dd>
    </div>
  );
}
