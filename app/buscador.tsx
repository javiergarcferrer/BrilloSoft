"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import ProcesoCard from "@/components/proceso-card";

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

interface Unidad {
  codigo: number;
  nombre: string;
  acronimo: string;
}

function etiquetaUnidad(u: Unidad): string {
  return u.acronimo && u.acronimo !== "N/A" ? `${u.nombre} (${u.acronimo})` : u.nombre;
}

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
  const sp = useSearchParams();
  const [q, setQ] = useState(() => sp.get("q") ?? "");
  const [estado, setEstado] = useState(() => sp.get("estado") ?? "Proceso publicado");
  const [modalidad, setModalidad] = useState(() => sp.get("modalidad") ?? "");
  const [startdate, setStartdate] = useState(
    () => sp.get("desde") ?? hoyMenosDias(30)
  );
  const [enddate, setEnddate] = useState(() => sp.get("hasta") ?? "");
  const [mipyme, setMipyme] = useState(() => sp.get("mipyme") === "1");
  const [orden, setOrden] = useState<Orden>(
    () => (sp.get("orden") as Orden) || "recientes"
  );
  const [page, setPage] = useState(1);

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [unidadTexto, setUnidadTexto] = useState("");
  const ucInicial = useRef(sp.get("uc"));

  useEffect(() => {
    let cancel = false;
    fetch("/api/unidades")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Unidad[]) => {
        if (cancel || !Array.isArray(list)) return;
        setUnidades(list);
        if (ucInicial.current) {
          const u = list.find((x) => String(x.codigo) === ucInicial.current);
          if (u) setUnidadTexto(etiquetaUnidad(u));
        }
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  const unidadSel = useMemo(
    () => unidades.find((u) => etiquetaUnidad(u) === unidadTexto) ?? null,
    [unidades, unidadTexto]
  );

  // Mantiene los filtros en la URL para compartir/guardar la búsqueda.
  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (estado !== "Proceso publicado") params.set("estado", estado);
    if (modalidad) params.set("modalidad", modalidad);
    if (startdate && startdate !== hoyMenosDias(30)) params.set("desde", startdate);
    if (enddate) params.set("hasta", enddate);
    if (mipyme) params.set("mipyme", "1");
    if (orden !== "recientes") params.set("orden", orden);
    if (unidadSel) params.set("uc", String(unidadSel.codigo));
    const qs = params.toString();
    const url = qs ? `/?${qs}` : "/";
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [q, estado, modalidad, startdate, enddate, mipyme, orden, unidadSel]);

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
      if (unidadSel) params.set("unidad_compra", String(unidadSel.codigo));
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
  }, [q, estado, modalidad, startdate, enddate, mipyme, page, unidadSel]);

  // Debounce para el texto; inmediato para el resto de filtros.
  useEffect(() => {
    const t = setTimeout(fetchData, q ? 450 : 0);
    return () => clearTimeout(t);
  }, [fetchData, q]);

  // Cualquier cambio de filtro reinicia la paginación.
  useEffect(() => {
    setPage(1);
  }, [q, estado, modalidad, startdate, enddate, mipyme, unidadSel]);

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

  // En modo búsqueda pueden llegar cientos de coincidencias: renderiza por tandas.
  const [visibles, setVisibles] = useState(24);
  useEffect(() => {
    setVisibles(24);
  }, [data]);
  const listaVisible = enBusqueda ? ordenados.slice(0, visibles) : ordenados;

  const exportarCsv = () => {
    const cols: [string, (p: Proceso) => string | number][] = [
      ["codigo_proceso", (p) => p.codigo_proceso],
      ["titulo", (p) => p.titulo],
      ["unidad_compra", (p) => p.unidad_compra],
      ["modalidad", (p) => p.modalidad],
      ["estado", (p) => p.estado_proceso],
      ["monto_estimado", (p) => p.monto_estimado],
      ["divisa", (p) => p.divisa],
      ["fecha_publicacion", (p) => p.fecha_publicacion],
      ["fecha_fin_recepcion_ofertas", (p) => p.fecha_fin_recepcion_ofertas],
      ["url_portal", (p) => p.url],
    ];
    const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lineas = [
      cols.map(([h]) => h).join(","),
      ...ordenados.map((p) => cols.map(([, f]) => esc(f(p))).join(",")),
    ];
    const blob = new Blob(["﻿" + lineas.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `licitaciones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">Oportunidades de compras públicas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Busca y filtra los procesos publicados por las instituciones del Estado
          dominicano, en vivo desde la API de datos abiertos de la DGCP.
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              setEstado("Proceso publicado");
              setModalidad("");
              setMipyme(false);
              setStartdate(hoyMenosDias(30));
              setEnddate("");
              setOrden("recientes");
            }}
            className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
          >
            Abiertas ahora
          </button>
          <button
            onClick={() => {
              setEstado("Proceso publicado");
              setOrden("cierre");
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
          >
            ⏰ Cierran pronto
          </button>
          <button
            onClick={() => {
              setOrden("monto_desc");
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
          >
            💰 Mayor monto
          </button>
          <button
            onClick={() => {
              setMipyme(true);
              setEstado("Proceso publicado");
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
          >
            Para MIPYMES
          </button>
        </div>

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

          <label className="md:col-span-12 block text-xs font-medium text-slate-600">
            Institución (unidad de compra)
            <input
              list="lista-unidades"
              value={unidadTexto}
              onChange={(e) => setUnidadTexto(e.target.value)}
              placeholder={
                unidades.length
                  ? "Todas — escribe para filtrar por institución…"
                  : "Cargando instituciones…"
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="lista-unidades">
              {unidades.map((u) => (
                <option key={u.codigo} value={etiquetaUnidad(u)} />
              ))}
            </datalist>
            {unidadTexto && !unidadSel && (
              <span className="mt-1 block text-[11px] text-amber-600">
                Selecciona una institución de la lista para aplicar el filtro.
              </span>
            )}
          </label>

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
          {!loading && ordenados.length > 0 && (
            <span className="flex items-center gap-2">
              <button
                onClick={exportarCsv}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 hover:border-emerald-500 hover:text-emerald-700"
              >
                ⬇ Exportar CSV
              </button>
              <a
                href={(() => {
                  const f = new URLSearchParams();
                  if (q.trim()) f.set("q", q.trim());
                  if (estado) f.set("estado", estado);
                  if (modalidad) f.set("modalidad", modalidad);
                  if (mipyme) f.set("mipyme", "1");
                  if (unidadSel) f.set("uc", String(unidadSel.codigo));
                  return `/api/feed?${f.toString()}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                title="Suscríbete a esta búsqueda con cualquier lector RSS y entérate de los procesos nuevos"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1 hover:border-emerald-500 hover:text-emerald-700"
              >
                📡 RSS
              </a>
            </span>
          )}
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
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {listaVisible.map((p) => (
                <ProcesoCard key={p.codigo_proceso} p={p} />
              ))}
            </div>
            {enBusqueda && ordenados.length > visibles && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setVisibles((v) => v + 24)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700"
                >
                  Mostrar más ({ordenados.length - visibles} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
