"use client";

import SeguirButton from "./seguir-button";
import Compartir, { type TipoCompartido } from "./compartir";
import { IconRss } from "./icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { TIPOS_SEGUIDO, huellaDe, type Situacion, type TipoSeguido } from "@/lib/seguimiento";

/**
 * Las acciones de una ficha: seguirla, compartirla y, si tiene, su RSS.
 *
 * Existe para que cada ficha lleve **una línea** y no tres controles con sus
 * props: las fichas las editan varias sesiones a la vez, y una pieza compuesta
 * aquí mantiene los cambios ahí en una importación y un uso. `situacion` son
 * los datos crudos del estado; la huella se calcula con `huellaDe`, la misma
 * función que usa `/api/seguimiento`, así que lo que se guarda al seguir y lo
 * que se compara al volver no pueden divergir.
 *
 * Un tipo que no se puede seguir (el capítulo presupuestario, que es una
 * instantánea) solo lleva compartir.
 */
export default function AccionesFicha({
  tipo,
  id,
  titulo,
  href,
  situacion,
  feed,
  className,
}: {
  tipo: TipoCompartido;
  id: string;
  titulo: string;
  href: string;
  situacion?: Situacion;
  /** Ruta del RSS de esta ficha, si lo tiene. */
  feed?: string;
  className?: string;
}) {
  const seguible = (TIPOS_SEGUIDO as readonly string[]).includes(tipo);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {seguible && (
        <SeguirButton
          tipo={tipo as TipoSeguido}
          id={id}
          titulo={titulo}
          href={href}
          huella={situacion ? huellaDe(situacion) : undefined}
        />
      )}
      <Compartir titulo={titulo} tipo={tipo} />
      {feed && (
        <Button asChild variant="outline" size="sm">
          <a href={feed} title="Recibe cada cambio en tu lector de noticias (RSS)">
            <IconRss className="h-3.5 w-3.5" />
            RSS
          </a>
        </Button>
      )}
    </div>
  );
}
