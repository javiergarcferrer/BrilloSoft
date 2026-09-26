import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Paneles pequeños con **una escala común**: la misma medida partida por una
 * faceta (el gasto por área y por cargo), cada panel con una sola serie en la
 * firma y su nombre en el título, no en un color.
 *
 * Es la salida legal a «demasiadas series»: en vez de un sexto color, otro
 * panel. La escala común es lo que hace que dos paneles se comparen de un
 * vistazo; sin ella, una barra llena en uno y otra llena en el otro dicen lo
 * mismo sin serlo. Por eso el ayudante `maximoComun` va aquí y cada primitiva
 * acepta `maximo`.
 */
export function Multiples({
  children,
  columnas = 2,
  className,
}: {
  children: ReactNode;
  columnas?: 2 | 3;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-5", columnas === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "lg:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/** El máximo de varias series, para pintarlas en la misma escala. */
export function maximoComun(series: number[][]): number {
  return Math.max(1, ...series.flat());
}
