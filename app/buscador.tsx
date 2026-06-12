"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import ProcesoCard from "@/components/proceso-card";
import TablaProcesos, { type OrdenTabla } from "@/components/tabla-procesos";

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

type Orden = OrdenTabla;
type Vista = "tabla" | "tarjetas";

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
  const [startdate, setStartdate] = useState(() => sp.get("desde") ?? hoyMenosDias(30));
  const [enddate, setEnddate] = useState(() => sp.get("hasta") ?? "");
  const [mipyme, setMipyme] = useState(() => sp.get("mipyme") === "1");
  const [orden, setOrden] = useState<Orden>(
    () => (sp.get("orden") as Orden) || "recientes"
  );
  const [montoMin, setMontoMin] = useState(() => sp.get("min") ?? "");
  const [montoMax, setMontoMax] = useState(() => sp.get("max") ?? "");
  const [page, setPage] = useState(1);
  const [avanzados, setAvanzados] = useState(false);
  const [vista, setVista] = useState<Vista>("tabla");
  const [tiempoMs, setTiempoMs] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Preferencia de vista persistida.
  useEffect(() => {
    const v = window.localStorage.getItem("lrd:vista");
    if (v === "tarjetas" || v === "tabla") setVista(v);
  }, []);
  const cambiarVista = (v: Vista) => {
    setVista(v);
    window.localStorage.setItem("lrd:vista", v);
  };

  // Atajo de teclado: "/" enfoca la búsqueda desde cualquier punto de la página.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
    if (montoMin) params.set("min", montoMin);
    if (montoMax) params.set("max", montoMax);
    if (unidadSel) params.set("uc", String(unidadSel.codigo));
    const qs = params.toString();
    const url = qs ? `/?${qs}` : "/";
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [q, estado, modalidad, startdate, enddate, mipyme, orden, montoMin, montoMax, unidadSel]);

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
    const t0 = performance.now();
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
      setTiempoMs(performance.now() - t0);
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
    let list = [...(data?.content ?? [])];
    const min = Number(montoMin) || 0;
    const max = Number(montoMax) || Infinity;
    if (min > 0 || max < Infinity) {
      list = list.filter(
        (p) => (p.monto_estimado ?? 0) >= min && (p.monto_estimado ?? 0) <= max
      );
    }
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
  }, [data, orden, montoMin, montoMax]);

  const enBusqueda = q.trim().length > 0;

  // En modo búsqueda pueden llegar cientos de coincidencias: renderiza por tandas.
  const [visibles, setVisibles] = useState(24);
  useEffect(() => {
    setVisibles(24);
  }, [data]);
  const listaVisible = enBusqueda ? ordenados.slice(0, visibles) : ordenados;

  // Chips de filtros activos (excluye los valores por defecto).
  const chips: { etiqueta: string; quitar: () => void }[] = [];
  if (estado && estado !== "Proceso publicado")
    chips.push({ etiqueta: `Estado: ${estado}`, quitar: () => setEstado("Proceso publicado") });
  if (estado === "") chips.push({ etiqueta: "Estado: todos", quitar: () => setEstado("Proceso publicado") });
  if (modalidad) chips.push({ etiqueta: modalidad, quitar: () => setModalidad("") });
  if (unidadSel)
    chips.push({ etiqueta: unidadSel.nombre, quitar: () => setUnidadTexto("") });
  if (mipyme) chips.push({ etiqueta: "Solo MIPYMES", quitar: () => setMipyme(false) });
  if (startdate && startdate !== hoyMenosDias(30))
    chips.push({ etiqueta: `Desde ${startdate}`, quitar: () => setStartdate(hoyMenosDias(30)) });
  if (enddate) chips.push({ etiqueta: `Hasta ${enddate}`, quitar: () => setEnddate("") });
  if (montoMin)
    chips.push({ etiqueta: `Monto ≥ ${Number(montoMin).toLocaleString("es-DO")}`, quitar: () => setMontoMin("") });
  if (montoMax)
    chips.push({ etiqueta: `Monto ≤ ${Number(montoMax).toLocaleString("es-DO")}`, quitar: () => setMontoMax("") });

  const limpiarTodo = () => {
    setQ("");
    setEstado("Proceso publicado");
    setModalidad("");
    setUnidadTexto("");
    setMipyme(false);
    setStartdate(hoyMenosDias(30));
    setEnddate("");
    setMontoMin("");
    setMontoMax("");
    setOrden("recientes");
  };

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

  const urlFeed = () => {
    const f = new URLSearchParams();
    if (q.trim()) f.set("q", q.trim());
    if (estado) f.set("estado", estado);
    if (modalidad) f.set("modalidad", modalidad);
    if (mipyme) f.set("mipyme", "1");
    if (unidadSel) f.set("uc", String(unidadSel.codigo));
    return `/api/feed?${f.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros, fija al hacer scroll */}
      <section className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.58 3.58a.75.75 0 11-1.06 1.06l-3.58-3.58A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQ("")}
                placeholder="Buscar por objeto, institución o código de proceso…"
                aria-label="Buscar procesos"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-12 text-sm outline-none ring-emerald-600/20 focus:border-emerald-600 focus:ring-4"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">
                /
              </kbd>
            </div>

            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              aria-label="Estado del proceso"
              className="rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              aria-label="Modalidad"
              className="hidden rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm md:block"
            >
              <option value="">Todas las modalidades</option>
              {MODALIDADES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <button
              onClick={() => setAvanzados((v) => !v)}
              aria-expanded={avanzados}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                avanzados
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
              }`}
            >
              Filtros {chips.length > 0 ? `(${chips.length})` : ""}
            </button>

            <div className="ml-auto flex rounded-lg border border-slate-300 p-0.5 text-xs font-medium">
              <button
                onClick={() => cambiarVista("tabla")}
                className={`rounded-md px-2.5 py-1.5 ${
                  vista === "tabla" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                Tabla
              </button>
              <button
                onClick={() => cambiarVista("tarjetas")}
                className={`rounded-md px-2.5 py-1.5 ${
                  vista === "tarjetas" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                Tarjetas
              </button>
            </div>
          </div>

          {avanzados && (
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-12">
              <label className="md:col-span-6 block text-xs font-medium text-slate-600">
                Institución (unidad de compra)
                <input
                  list="lista-unidades"
                  value={unidadTexto}
                  onChange={(e) => setUnidadTexto(e.target.value)}
                  placeholder={
                    unidades.length
                      ? "Todas — escribe para filtrar…"
                      : "Cargando instituciones…"
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
                Modalidad
                <select
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                >
                  <option value="">Todas</option>
                  {MODALIDADES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-3 flex items-end gap-2 pb-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={mipyme}
                  onChange={(e) => setMipyme(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                />
                Solo dirigidos a MIPYMES
              </label>

              <label className="md:col-span-3 block text-xs font-medium text-slate-600">
                Publicado desde
                <input
                  type="date"
                  value={startdate}
                  onChange={(e) => setStartdate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                />
              </label>
              <label className="md:col-span-3 block text-xs font-medium text-slate-600">
                Hasta
                <input
                  type="date"
                  value={enddate}
                  onChange={(e) => setEnddate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                />
              </label>
              <label className="md:col-span-3 block text-xs font-medium text-slate-600">
                Monto mínimo (RD$)
                <input
                  type="number"
                  min={0}
                  value={montoMin}
                  onChange={(e) => setMontoMin(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                />
              </label>
              <label className="md:col-span-3 block text-xs font-medium text-slate-600">
                Monto máximo (RD$)
                <input
                  type="number"
                  min={0}
                  value={montoMax}
                  onChange={(e) => setMontoMax(e.target.value)}
                  placeholder="Sin límite"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {(chips.length > 0 || enBusqueda) && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {chips.map((c) => (
                <button
                  key={c.etiqueta}
                  onClick={c.quitar}
                  title="Quitar filtro"
                  className="group flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 font-medium text-white hover:bg-slate-700"
                >
                  <span className="max-w-[220px] truncate">{c.etiqueta}</span>
                  <span className="text-slate-400 group-hover:text-white">×</span>
                </button>
              ))}
              <button
                onClick={limpiarTodo}
                className="rounded-full px-2 py-1 font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Resultados */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <span aria-live="polite">
            {loading ? (
              "Consultando la DGCP…"
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : data ? (
              <>
                <strong className="text-slate-900">
                  {(enBusqueda || montoMin || montoMax
                    ? ordenados.length
                    : data.totalResults
                  ).toLocaleString("es-DO")}
                </strong>{" "}
                {enBusqueda ? "coincidencias" : "procesos"}
                {tiempoMs !== null && (
                  <span className="text-slate-400">
                    {" "}
                    en {(tiempoMs / 1000).toFixed(1)} s
                  </span>
                )}
                {enBusqueda && data.truncated
                  ? " — rango amplio: acota las fechas para una búsqueda completa"
                  : ""}
              </>
            ) : null}
          </span>

          <span className="flex flex-wrap items-center gap-2">
            {!loading && ordenados.length > 0 && (
              <>
                <button
                  onClick={exportarCsv}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 hover:border-emerald-600 hover:text-emerald-700"
                >
                  Exportar CSV
                </button>
                <a
                  href={urlFeed()}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Suscríbete a esta búsqueda con cualquier lector RSS"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 hover:border-emerald-600 hover:text-emerald-700"
                >
                  RSS
                </a>
              </>
            )}
            {!enBusqueda && data && data.pages > 1 && (
              <span className="flex flex-wrap items-center gap-2">
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
          </span>
        </div>

        {loading ? (
          vista === "tabla" ? (
            <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
                />
              ))}
            </div>
          )
        ) : ordenados.length === 0 && !error ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
            Sin resultados con estos filtros. Amplía el rango de fechas o quita filtros.
          </div>
        ) : (
          <>
            {vista === "tabla" ? (
              <TablaProcesos procesos={listaVisible} orden={orden} onOrden={setOrden} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {listaVisible.map((p) => (
                  <ProcesoCard key={p.codigo_proceso} p={p} />
                ))}
              </div>
            )}
            {enBusqueda && ordenados.length > visibles && (
              <div className="text-center">
                <button
                  onClick={() => setVisibles((v) => v + 48)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:border-emerald-600 hover:text-emerald-700"
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
