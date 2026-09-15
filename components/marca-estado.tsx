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
  /*
    La marca **nunca parte su texto en dos líneas**. Un estado dicho en
    palabras —«Ya cerró la recepción», «Pendiente de promulgación»— envuelto a
    dos renglones rompe la altura de la fila que lo lleva, y en un listado de
    veinte filas eso es veinte alturas distintas: el ojo deja de barrer.
    `whitespace-nowrap` lo impide. Y el `shrink-0` que trae `Badge` se cambia
    aquí por `shrink` + `min-w-0`: con el sello rígido, un estado largo se
    salía de la fila y arrastraba el desbordamiento horizontal a la página
    entera; pudiendo encoger, el reparto de flex le quita ancho primero al
    titular —que es el que tiene de sobra— y solo recorta la marca cuando de
    verdad no queda sitio. El literal completo sigue disponible en `title`
    cuando el origen lo trae.
  */
  return (
    <Badge
      forma="etiqueta"
      title={title}
      className={cn(
        "min-w-0 max-w-full shrink gap-1.5 whitespace-nowrap ring-1 ring-inset",
        TONOS[tono].badge,
        className,
      )}
    >
      {conPunto && (
        <span
          aria-hidden
          className={cn(
            "relative inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            TONOS[tono].dot,
          )}
        >
          {vivo && <span className="live-dot text-brand-500" />}
        </span>
      )}
      <span className="truncate">{children}</span>
    </Badge>
  );
}
