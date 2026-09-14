import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

/**
 * Una fila de filtros que **son enlaces**: tipo de norma, año, cuatrienio del
 * Senado.
 *
 * Son enlaces y no botones porque cada uno es una página distinta —se comparte,
 * se marca, se vuelve con el botón atrás—, y por eso no son `Tabs`: unas
 * pestañas intercambian paneles dentro de la misma página. El vestido sí es el
 * mismo que el de un control, y de ahí que use `Button asChild`.
 *
 * Estaba escrito tres veces con tres tamaños. El activo se marca con relleno de
 * tinta de firma **y** `aria-current`: el color solo no llega a quien no lo ve.
 */
export function NavFiltros({
  etiqueta,
  children,
  className,
}: {
  /** Qué se está filtrando: lo lee un lector de pantalla antes de la lista. */
  etiqueta: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav aria-label={etiqueta} className={cn("flex flex-wrap gap-1.5", className)}>
      {children}
    </nav>
  );
}

export function FiltroEnlace({
  href,
  activo,
  mono = false,
  children,
  className,
}: {
  href: string;
  activo: boolean;
  /** Para lo que es un número o un código: año, cuatrienio. */
  mono?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant={activo ? "default" : "secondary"}
      size="sm"
      className={cn(
        mono && "font-mono tabular-nums",
        activo
          ? "bg-brand-600 hover:bg-brand-700"
          : "text-ink-soft hover:text-ink",
        className,
      )}
    >
      <Link href={href} aria-current={activo ? "page" : undefined}>
        {children}
      </Link>
    </Button>
  );
}
