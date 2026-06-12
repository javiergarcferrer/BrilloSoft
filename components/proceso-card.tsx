"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import { diasHasta, formatFecha, formatMonto } from "@/lib/format";
import {
  getSeguimiento,
  onSeguimientoCambio,
  toggleSeguimiento,
} from "@/lib/seguimiento";

export default function ProcesoCard({ p }: { p: Proceso }) {
  const [seguido, setSeguido] = useState(false);
  useEffect(() => {
    const sync = () => setSeguido(getSeguimiento().includes(p.codigo_proceso));
    sync();
    return onSeguimientoCambio(sync);
  }, [p.codigo_proceso]);

  const dias = diasHasta(p.fecha_fin_recepcion_ofertas);
  const abierto = p.estado_proceso === "Proceso publicado";
  let cierreBadge: { texto: string; clase: string } | null = null;
  if (dias !== null) {
    if (dias < 0) {
      cierreBadge = { texto: "Recepción cerrada", clase: "bg-slate-100 text-slate-500" };
    } else if (dias <= 2) {
      cierreBadge = {
        texto: `Cierra en ${dias === 0 ? "horas" : `${dias} d`}`,
        clase: "bg-red-100 text-red-700",
      };
    } else if (dias <= 7) {
      cierreBadge = { texto: `Cierra en ${dias} días`, clase: "bg-amber-100 text-amber-700" };
    } else {
      cierreBadge = { texto: `Cierra en ${dias} días`, clase: "bg-emerald-100 text-emerald-700" };
    }
  }

  return (
    <article className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-400">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          <span
            className={`rounded-full px-2 py-0.5 ${
              abierto ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {p.estado_proceso}
          </span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">
            {p.modalidad}
          </span>
          {p.dirigido_mipymes === "Si" && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
              MIPYMES
            </span>
          )}
          {cierreBadge && (
            <span className={`rounded-full px-2 py-0.5 ${cierreBadge.clase}`}>
              {cierreBadge.texto}
            </span>
          )}
        </div>
        <button
          onClick={() => toggleSeguimiento(p.codigo_proceso)}
          title={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
          aria-label={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
          className={`shrink-0 text-lg leading-none transition ${
            seguido ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
          }`}
        >
          {seguido ? "★" : "☆"}
        </button>
      </div>

      <h2 className="mt-2 line-clamp-2 font-semibold leading-snug">
        <Link
          href={`/procesos/${encodeURIComponent(p.codigo_proceso)}`}
          className="hover:text-emerald-700"
        >
          {p.titulo || p.descripcion || p.codigo_proceso}
        </Link>
      </h2>
      <p className="mt-1 line-clamp-1 text-sm text-slate-500">{p.unidad_compra}</p>

      <div className="mt-3 flex flex-1 items-end justify-between gap-2 text-sm">
        <div>
          <div className="font-semibold text-slate-900">
            {formatMonto(p.monto_estimado, p.divisa)}
          </div>
          <div className="text-xs text-slate-500">
            Publicado {formatFecha(p.fecha_publicacion)} · {p.codigo_proceso}
          </div>
        </div>
        <Link
          href={`/procesos/${encodeURIComponent(p.codigo_proceso)}`}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
