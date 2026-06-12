"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import { diasHasta, formatFecha, formatMonto } from "@/lib/format";

const ESTADOS = [
  "Proceso publicado",
  "Sobres estan abriendose",
  "Sobres abiertos o aperturados",
  "Proceso con etapa cerrada",
  "Proceso adjudicado y celebrado",
  "Proceso desierto",
  "Cancelado",
];

const MODALIDADES = [
  "Compras por Debajo del Umbral",
  "Contratación Menor",
  "Comparación de Precios",
  "Licitación Pública Nacional",
  "Licitación Pública Internacional",
  "Procesos de Excepción",
  "Subasta Inversa",
  "Sorteo de Obras",
];

type Orden = "recientes" | "cierre" | "monto_desc" | "monto_asc";

interface ApiResult {
  content: Proceso[];
  totalResults: number;
  pages: number;
  page: number;
  scanned?: number;
  truncated?: boolean;
  error?: string;
}

function hoyMenosDias(dias: number): string {
  const d = new Date(Date.now() - dias * 86400000);
  return d.toISOString().slice(0, 10);
}

export default function Buscador() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Proceso publicado");
  const [modalidad, setModalidad] = useState("");
  const [startdate, setStartdate] = useState(hoyMenosDias(30));
  const [enddate, setEnddate] = useState("");
  const [mipyme, setMipyme] = useState(false);
  const [orden, setOrden] = useState<Orden>("recientes");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (estado) params.set("estado", estado);
      if (modalidad) params.set("modalidad", modalidad);
      if (startdate) params.set("startdate", startdate);
      if (enddate) params.set("enddate", enddate);
      if (mipyme) params.set("mipyme", "true");
      params.set("page", String(page));
      params.set("limit", "24");
      const res = await fetch(`/api/procesos?${params}`, { signal: ctrl.signal });
      const json = (await res.json()) as ApiResult;
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setData(json);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [q, estado, modalidad, startdate, enddate, mipyme, page]);

  // Debounce para el texto; inmediato para el resto de filtros.
  useEffect(() => {
    const t = setTimeout(fetchData, q ? 450 : 0);
    return () => clearTimeout(t);
  }, [fetchData, q]);

  // Cualquier cambio de filtro reinicia la paginación.
  useEffect(() => {
    setPage(1);
  }, [q, estado, modalidad, startdate, enddate, mipyme]);

  const ordenados = useMemo(() => {
    const list = [...(data?.content ?? [])];
    switch (orden) {
      case "cierre":
        return list.sort(
          (a, b) =>
            new Date(a.fecha_fin_recepcion_ofertas).getTime() -
            new Date(b.fecha_fin_recepcion_ofertas).getTime()
        );
      case "monto_desc":
        return list.sort((a, b) => (b.monto_estimado ?? 0) - (a.monto_estimado ?? 0));
      case "monto_asc":
        return list.sort((a, b) => (a.monto_estimado ?? 0) - (b.monto_estimado ?? 0));
      default:
        return list;
    }
  }, [data, orden]);

  const enBusqueda = q.trim().length > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">Oportunidades de compras públicas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Busca y filtra los procesos publicados por las instituciones del Estado
          dominicano, en vivo desde la API de datos abiertos de la DGCP.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-12">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por palabra clave: pintura, cerámica, vehículos, hospital, ayuntamiento…"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4"
            />
          </div>

          <label className="md:col-span-3 block text-xs font-medium text-slate-600">
            Estado
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="">Todos</option>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-3 block text-xs font-medium text-slate-600">
            Modalidad
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="">Todas</option>
              {MODALIDADES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 block text-xs font-medium text-slate-600">
            Publicado desde
            <input
              type="date"
              value={startdate}
              onChange={(e) => setStartdate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            />
          </label>

          <label className="md:col-span-2 block text-xs font-medium text-slate-600">
            Hasta
            <input
              type="date"
              value={enddate}
              onChange={(e) => setEnddate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            />
          </label>

          <label className="md:col-span-2 block text-xs font-medium text-slate-600">
            Ordenar por
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="recientes">Más recientes</option>
              <option value="cierre">Cierre más próximo</option>
              <option value="monto_desc">Mayor monto</option>
              <option value="monto_asc">Menor monto</option>
            </select>
          </label>

          <label className="md:col-span-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={mipyme}
              onChange={(e) => setMipyme(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />
            Solo dirigidos a MIPYMES
          </label>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          {loading ? (
            <span>Consultando la DGCP…</span>
          ) : error ? (
            <span className="text-red-600">⚠ {error}</span>
          ) : data ? (
            <span>
              <strong>{data.totalResults.toLocaleString("es-DO")}</strong>{" "}
              {enBusqueda ? "coincidencias" : "procesos"}
              {enBusqueda && data.scanned
                ? ` (en ${data.scanned.toLocaleString("es-DO")} registros del rango)`
                : ""}
              {enBusqueda && data.truncated
                ? " — rango amplio: acota las fechas para una búsqueda completa"
                : ""}
            </span>
          ) : null}
          {!enBusqueda && data && data.pages > 1 && (
            <span className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
              >
                ← Anterior
              </button>
              Página {data.page} de {data.pages}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pages || loading}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
              />
            ))}
          </div>
        ) : ordenados.length === 0 && !error ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
            Sin resultados con estos filtros. Prueba ampliar el rango de fechas o quitar
            el filtro de estado.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {ordenados.map((p) => (
              <ProcesoCard key={p.codigo_proceso} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProcesoCard({ p }: { p: Proceso }) {
  const dias = diasHasta(p.fecha_fin_recepcion_ofertas);
  const abierto = p.estado_proceso === "Proceso publicado";
  let cierreBadge: { texto: string; clase: string } | null = null;
  if (dias !== null) {
    if (dias < 0) {
      cierreBadge = { texto: "Recepción cerrada", clase: "bg-slate-100 text-slate-500" };
    } else if (dias <= 2) {
      cierreBadge = { texto: `Cierra en ${dias === 0 ? "horas" : `${dias} d`}`, clase: "bg-red-100 text-red-700" };
    } else if (dias <= 7) {
      cierreBadge = { texto: `Cierra en ${dias} días`, clase: "bg-amber-100 text-amber-700" };
    } else {
      cierreBadge = { texto: `Cierra en ${dias} días`, clase: "bg-emerald-100 text-emerald-700" };
    }
  }

  return (
    <article className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-400">
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
