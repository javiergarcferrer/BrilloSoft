"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import { diasHasta, formatFecha, formatMonto } from "@/lib/format";
import { cierreMeta, estadoMeta } from "@/lib/estados";
import {
  getSeguimiento,
  onSeguimientoCambio,
  toggleSeguimiento,
} from "@/lib/seguimiento";
import { IconArrowRight, IconBuilding, IconStar } from "./icons";

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
  const href = `/procesos/${encodeURIComponent(p.codigo_proceso)}`;

  return (
    <article className="group flex flex-col rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-hairline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card hover:ring-brand-500/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${estado.badge}`}
          >
            <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${estado.dot}`}>
              {estado.abierto && <span className="live-dot text-emerald-500" />}
            </span>
            {estado.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {p.modalidad}
          </span>
          {p.dirigido_mipymes === "Si" && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
              MIPYMES
            </span>
          )}
        </div>
        <button
          onClick={() => toggleSeguimiento(p.codigo_proceso)}
          title={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
          aria-label={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
          aria-pressed={seguido}
          className={`-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
            seguido
              ? "text-amber-400"
              : "text-slate-300 hover:bg-amber-50 hover:text-amber-400"
          }`}
        >
          <IconStar className="h-5 w-5" filled={seguido} />
        </button>
      </div>

      <h2 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight">
        <Link href={href} className="transition-colors hover:text-brand-700">
          {p.titulo || p.descripcion || p.codigo_proceso}
        </Link>
      </h2>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
        <IconBuilding className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="line-clamp-1">{p.unidad_compra}</span>
      </p>

      <div className="mt-3 flex flex-1 items-end justify-between gap-3 border-t border-hairline pt-3">
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight text-ink">
            {formatMonto(p.monto_estimado, p.divisa)}
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-soft">
            Publicado {formatFecha(p.fecha_publicacion)}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {cierre && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cierre.badge}`}
            >
              {cierre.texto}
            </span>
          )}
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-600"
          >
            Ver detalle
            <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
