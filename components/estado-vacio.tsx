import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Las dos pantallas que no se pueden confundir.
 *
 * «No hay resultados» y «la fuente no contestó» dicen cosas opuestas sobre el
 * Estado: la primera afirma que no existe nada; la segunda, que no pudimos
 * mirar. Escribir la segunda como la primera es afirmar una falsedad sobre un
 * registro público —«no está inscrito» cuando lo que pasó es que el registro
 * se cayó—, y por eso la regla §6 de la ergonomía las separa.
 *
 * Estaba escrita a mano seis veces, con seis textos y dos alturas. Aquí está
 * una vez, y la variante `caida` obliga por firma a decir las tres cosas que
 * esa pantalla debe decir: **qué pasó, qué sigue en pie y cuál es la única
 * acción útil**.
 */
export function EstadoVacio({
  titulo,
  children,
  accion,
  rotulo,
  variante = "vacio",
  como: Titulo = "p",
  className,
}: {
  titulo: ReactNode;
  /** Qué pasó y qué sigue en pie, en llano. */
  children?: ReactNode;
  /** La única acción útil desde aquí. En `caida`, casi siempre hay una. */
  accion?: ReactNode;
  /** Epígrafe opcional: el nombre del panel que se quedó sin contenido. */
  rotulo?: ReactNode;
  variante?: "vacio" | "caida";
  /**
   * Cuando el estado **es** la página —una ficha que no existe, una fuente
   * caída sin nada más que mostrar— su título es el h1: sin él, el lector de
   * pantalla llega a una página sin nombre.
   */
  como?: "p" | "h1" | "h2";
  className?: string;
}) {
  return (
    <Card className={className}>
      {rotulo && (
        <CardHeader>
          <CardTitle>{rotulo}</CardTitle>
        </CardHeader>
      )}
      {/*
        `py-14` (56 px arriba y abajo) se diseñó mirando una pantalla ancha. En
        un teléfono esa caja se come media pantalla para decir tres renglones, y
        lo que hay debajo —los filtros, el siguiente panel— queda fuera de
        vista. 36 px en el teléfono, los 56 desde `sm`.
      */}
      <div className="px-5 py-9 text-center sm:py-14">
        <Titulo
          className={cn(
            "font-sans text-sm font-medium",
            variante === "caida" ? "text-alerta-700" : "text-ink",
          )}
        >
          {titulo}
        </Titulo>
        {children && (
          <div className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
            {children}
          </div>
        )}
        {accion && <div className="mt-4 flex justify-center">{accion}</div>}
      </div>
    </Card>
  );
}
