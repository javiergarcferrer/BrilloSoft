"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PreciosStats } from "@/lib/dgcp";
import { formatFecha, formatMonto } from "@/lib/format";

export default function PreciosHistoricos({
  subclases,
  divisa,
}: {
  subclases: { codigo: string; descripcion: string }[];
  divisa: string;
}) {
  if (subclases.length === 0) return null;
  return (
    <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
      <h2 className="font-semibold">Precios históricos de adjudicación</h2>
      <p className="mt-1 text-sm text-slate-500">
        Lo que el Estado realmente pagó en contratos recientes por artículos de la misma
        categoría UNSPSC — úsalo como referencia antes de fijar tu precio.
      </p>
      <div className="mt-4 space-y-5">
        {subclases.map((s) => (
          <SubclaseStats key={s.codigo} subclase={s} divisa={divisa} />
        ))}
      </div>
    </section>
  );
}

function SubclaseStats({
  subclase,
  divisa,
}: {
  subclase: { codigo: string; descripcion: string };
  divisa: string;
}) {
  const [stats, setStats] = useState<PreciosStats | null>(null);
  const [error, setError] = useState(false);
  const [verEjemplos, setVerEjemplos] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch(`/api/precios?subclase=${subclase.codigo}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancel && setStats(d))
      .catch(() => !cancel && setError(true));
    return () => {
      cancel = true;
    };
  }, [subclase.codigo]);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {subclase.descripcion}{" "}
          <span className="font-mono text-xs font-normal text-slate-400">
            UNSPSC {subclase.codigo}
          </span>
        </h3>
        {stats && stats.muestras > 0 && (
          <button
            onClick={() => setVerEjemplos((v) => !v)}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            {verEjemplos ? "Ocultar contratos recientes" : "Ver contratos recientes"}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-slate-500">
          No se pudo consultar el histórico ahora mismo.
        </p>
      ) : !stats ? (
        <div className="mt-3 h-12 animate-pulse rounded bg-slate-100" />
      ) : stats.muestras === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Sin contratos recientes registrados en esta categoría.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 px-2 py-2">
              <div className="text-xs text-slate-500">Mínimo</div>
              <div className="text-sm font-semibold">
                {formatMonto(stats.min, divisa)}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 px-2 py-2 ring-1 ring-emerald-200">
              <div className="text-xs text-emerald-700">
                Mediana · {stats.muestras} contratos
              </div>
              <div className="text-sm font-bold text-emerald-800">
                {formatMonto(stats.mediana, divisa)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-2">
              <div className="text-xs text-slate-500">Máximo</div>
              <div className="text-sm font-semibold">
                {formatMonto(stats.max, divisa)}
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Precios unitarios; los rangos amplios suelen mezclar presentaciones o
            alcances distintos — compara siempre con la descripción del contrato.
          </p>

          {verEjemplos && (
            <ul className="mt-3 space-y-1.5">
              {stats.ejemplos.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {e.descripcion_usuario || e.descripcion_articulo}
                    </span>
                    <Link
                      href={`/procesos/${encodeURIComponent(e.codigo_proceso)}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {e.codigo_proceso}
                    </Link>{" "}
                    <span className="text-slate-400">
                      · {formatFecha(e.fecha_creacion_contrato)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold">
                      {formatMonto(e.precio_unitario, divisa)}
                    </span>
                    <span className="text-slate-400">
                      × {e.cantidad?.toLocaleString("es-DO")} {e.unidad_medida}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
