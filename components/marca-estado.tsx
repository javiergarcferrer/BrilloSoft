import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { TONOS, type Tono } from "@/lib/estados";
import { Badge } from "@/components/ui/badge";

/**
 * La marca de estado de un expediente, sea de la fuente que sea.
 *
 * `lib/estados.ts` ya decidía **el color** una sola vez —cinco oficios, y cada
 * fuente traduce su vocabulario a ellos—, pero la marca que lo pinta estaba
 * escrita tres veces: en la tarjeta de un proceso, en la fila de una iniciativa
 * y en el plazo de cierre, con tres tamaños y dos mayúsculas distintas. Es la
 * misma lección de aquel archivo, un piso más arriba: centralizar la tabla no
 * basta si el componente que la usa se reimplementa en cada sitio.
 *
 * `vivo` enciende el latido del punto: se reserva a lo que **sigue abierto a
 * que alguien haga algo**, que es el único estado donde el movimiento dice algo
 * cierto.
 */
export function MarcaEstado({
  tono,
  children,
  vivo = false,
  conPunto = true,
  title,
  className,
}: {
  tono: Tono;
  children: ReactNode;
  vivo?: boolean;
  conPunto?: boolean;
  /** El literal crudo del origen: «La DGCP lo publica como “…”». */
  title?: string;
  className?: string;
}) {
  return (
    <Badge
      forma="etiqueta"
      title={title}
      className={cn("gap-1.5 ring-1 ring-inset", TONOS[tono].badge, className)}
    >
      {conPunto && (
        <span
          aria-hidden
          className={cn(
            "relative inline-block h-1.5 w-1.5 rounded-full",
            TONOS[tono].dot,
          )}
        >
          {vivo && <span className="live-dot text-brand-500" />}
        </span>
      )}
      {children}
    </Badge>
  );
}
