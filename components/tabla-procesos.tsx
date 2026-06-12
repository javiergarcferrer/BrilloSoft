"use client";

import Link from "next/link";
import type { Proceso } from "@/lib/dgcp";
import { diasHasta, formatFecha, formatMonto } from "@/lib/format";
import Estrella from "./estrella";

export type OrdenTabla = "recientes" | "cierre" | "monto_desc" | "monto_asc";

export default function TablaProcesos({
  procesos,
  orden,
  onOrden,
}: {
  procesos: Proceso[];
  orden: OrdenTabla;
  onOrden: (o: OrdenTabla) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-8 px-3 py-2.5" aria-label="Seguimiento" />
            <th className="px-3 py-2.5">Proceso</th>
            <th className="px-3 py-2.5">Institución</th>
            <th className="px-3 py-2.5">Modalidad</th>
            <th className="px-3 py-2.5">
              <button
                onClick={() => onOrden("recientes")}
                className={`uppercase tracking-wide hover:text-slate-900 ${
                  orden === "recientes" ? "font-bold text-slate-900" : ""
                }`}
              >
                Publicado{orden === "recientes" ? " ↓" : ""}
              </button>
            </th>
            <th className="px-3 py-2.5">
              <button
                onClick={() => onOrden("cierre")}
                className={`uppercase tracking-wide hover:text-slate-900 ${
                  orden === "cierre" ? "font-bold text-slate-900" : ""
                }`}
              >
                Cierre{orden === "cierre" ? " ↑" : ""}
              </button>
            </th>
            <th className="px-3 py-2.5 text-right">
              <button
                onClick={() =>
                  onOrden(orden === "monto_desc" ? "monto_asc" : "monto_desc")
                }
                className={`uppercase tracking-wide hover:text-slate-900 ${
                  orden === "monto_desc" || orden === "monto_asc"
                    ? "font-bold text-slate-900"
                    : ""
                }`}
              >
                Monto{orden === "monto_desc" ? " ↓" : orden === "monto_asc" ? " ↑" : ""}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {procesos.map((p) => {
            const dias = diasHasta(p.fecha_fin_recepcion_ofertas);
            const abierto = p.estado_proceso === "Proceso publicado";
            const punto =
              !abierto || dias === null || dias < 0
                ? "bg-slate-300"
                : dias <= 2
                  ? "bg-red-500"
                  : dias <= 7
                    ? "bg-amber-400"
                    : "bg-emerald-500";
            return (
              <tr
                key={p.codigo_proceso}
                className="border-b border-slate-100 align-top hover:bg-slate-50"
              >
                <td className="px-3 py-2.5">
                  <Estrella codigo={p.codigo_proceso} className="text-base" />
                </td>
                <td className="max-w-[340px] px-3 py-2.5">
                  <Link
                    href={`/procesos/${encodeURIComponent(p.codigo_proceso)}`}
                    className="line-clamp-2 font-medium leading-snug hover:text-emerald-700"
                  >
                    {p.titulo || p.codigo_proceso}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    {p.codigo_proceso}
                    <span
                      className={`rounded px-1 py-px font-sans text-[10px] font-medium ${
                        abierto
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.estado_proceso}
                    </span>
                  </div>
                </td>
                <td className="max-w-[200px] px-3 py-2.5">
                  <span className="line-clamp-2 text-slate-600">{p.unidad_compra}</span>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{p.modalidad}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                  {formatFecha(p.fecha_publicacion)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${punto}`} />
                    <span className="text-slate-600">
                      {formatFecha(p.fecha_fin_recepcion_ofertas)}
                    </span>
                    {abierto && dias !== null && dias >= 0 && (
                      <span className="text-xs text-slate-400">
                        ({dias === 0 ? "hoy" : `${dias} d`})
                      </span>
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">
                  {formatMonto(p.monto_estimado, p.divisa)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
