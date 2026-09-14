"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import { diasHasta, formatMonto } from "@/lib/format";
import { cierreMeta, estadoMeta } from "@/lib/estados";
import { cn } from "@/lib/cn";
import {
  getSeguimiento,
  onSeguimientoCambio,
  toggleSeguimiento,
} from "@/lib/seguimiento";
import { IconArrowRight, IconBuilding, IconStar } from "./icons";
import Antiguedad from "@/components/antiguedad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarcaEstado } from "@/components/marca-estado";
import { etapaDe } from "@/lib/estados";

export default function ProcesoCard({ p }: { p: Proceso }) {
  const [seguido, setSeguido] = useState(false);
  useEffect(() => {
    const sync = () => setSeguido(getSeguimiento().includes(p.codigo_proceso));
    sync();
    return onSeguimientoCambio(sync);
  }, [p.codigo_proceso]);

  const estado = estadoMeta(p.estado_proceso);
  const dias = diasHasta(p.fecha_fin_recepcion_ofertas);
  const cierre = estado.abierto ? cierreMeta(dias) : null;
  /*
    En un proceso ya cerrado la tarjeta no decía **cuándo** cerró: el plazo
    solo se pintaba mientras corría, y al pasar a «Sobres abiertos» o
    «Adjudicado» el hueco quedaba vacío. Da igual en una lista de procesos
    abiertos; en una de cerrados —que ahora se puede pedir— era la mitad de la
    fila. Solo si la fecha ya pasó: un cerrado con cierre futuro es el registro
    contradiciéndose, y ahí la fecha no se afirma.
  */
  const cerroHace = !estado.abierto && dias !== null && dias < 0;
  const href = `/procesos/${encodeURIComponent(p.codigo_proceso)}`;

  return (
    <Card
      as="article"
      className="cv-auto group flex flex-col p-4 transition-colors hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <MarcaEstado
            tono={etapaDe(p.estado_proceso).tono}
            vivo={estado.abierto}
            title={`La DGCP lo publica como «${estado.original}»`}
          >
            {estado.label}
          </MarcaEstado>
          <Badge forma="etiqueta" variant="contorno" className="bg-canvas font-medium">
            {p.modalidad}
          </Badge>
          {p.dirigido_mipymes === "Si" && (
            <Badge forma="etiqueta" variant="contorno" className="bg-canvas font-medium">
              MIPYMES
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleSeguimiento(p.codigo_proceso)}
          aria-label={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
          aria-pressed={seguido}
          className={cn(
            "-mr-1 -mt-1 shrink-0",
            seguido
              ? "text-brand-600 hover:bg-brand-50 hover:text-brand-700"
              : "text-ink-soft hover:text-brand-600",
          )}
        >
          <IconStar className="h-5 w-5" filled={seguido} />
        </Button>
      </div>

      <h2 className="mt-2.5 line-clamp-2 font-sans text-[15px] font-semibold leading-snug tracking-tight">
        <Link href={href} className="transition-colors hover:text-brand-700">
          {p.titulo || p.descripcion || p.codigo_proceso}
        </Link>
      </h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
        <IconBuilding className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <span className="line-clamp-1">{p.unidad_compra}</span>
      </p>

      <div className="mt-3 flex flex-1 items-end justify-between gap-3 border-t border-hairline pt-3">
        <div className="min-w-0">
          <div className="font-mono text-base font-semibold tabular-nums text-ink">
            {formatMonto(p.monto_estimado, p.divisa)}
          </div>
          <Antiguedad
            iso={p.fecha_publicacion}
            prefijo="Publicado"
            className="mt-0.5 block truncate text-xs text-ink-soft"
          />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {cierre && (
            <Badge
              forma="etiqueta"
              className={cn("ring-1 ring-inset", cierre.badge)}
            >
              {cierre.texto}
            </Badge>
          )}
          {cerroHace && (
            <Antiguedad
              iso={p.fecha_fin_recepcion_ofertas}
              prefijo="Cerró"
              className="block text-[11px] text-ink-soft"
            />
          )}
          <Button asChild variant="link" size="sm" className="h-auto gap-1 px-0 text-xs">
            <Link href={href}>
              Ver detalle
              <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
