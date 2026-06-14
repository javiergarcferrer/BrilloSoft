"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Proceso } from "@/lib/dgcp";
import ProcesoCard from "@/components/proceso-card";
import { BottomSheet } from "@/components/bottom-sheet";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFilter,
  IconRss,
  IconSearch,
  IconSliders,
  IconX,
} from "@/components/icons";

interface FiltrosProps {
  estado: string;
  setEstado: (v: string) => void;
  modalidad: string;
  setModalidad: (v: string) => void;
  unidades: Unidad[];
  unidadTexto: string;
  setUnidadTexto: (v: string) => void;
  unidadSel: Unidad | null;
  startdate: string;
  setStartdate: (v: string) => void;
  enddate: string;
  setEnddate: (v: string) => void;
  orden: Orden;
  setOrden: (v: Orden) => void;
  mipyme: boolean;
  setMipyme: (v: boolean) => void;
}

const INPUT_CLS =
  "mt-1 w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

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

  // Querystring que representa los filtros actuales (URL + guardar búsqueda).
  const currentParams = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (estado !== "Proceso publicado") params.set("estado", estado);
    if (modalidad) params.set("modalidad", modalidad);
    if (startdate && startdate !== hoyMenosDias(30)) params.set("desde", startdate);
    if (enddate) params.set("hasta", enddate);
    if (mipyme) params.set("mipyme", "1");
    if (orden !== "recientes") params.set("orden", orden);
    if (unidadSel) params.set("uc", String(unidadSel.codigo));
    return params;
  }, [q, estado, modalidad, startdate, enddate, mipyme, orden, unidadSel]);

  // Mantiene los filtros en la URL (compartible / guardable).
  useEffect(() => {
    const qs = currentParams.toString();
    const url = qs ? `/?${qs}` : "/";
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [currentParams]);

  // Aplica filtros desde un querystring (búsqueda guardada / enlace compartido).
  const applyFromParams = useCallback(
    (p: URLSearchParams) => {
      setQ(p.get("q") ?? "");
      setEstado(p.get("estado") ?? "Proceso publicado");
      setModalidad(p.get("modalidad") ?? "");
      setStartdate(p.get("desde") ?? hoyMenosDias(30));
      setEnddate(p.get("hasta") ?? "");
      setMipyme(p.get("mipyme") === "1");
      setOrden((p.get("orden") as Orden) || "recientes");
      const uc = p.get("uc");
      const u = uc ? unidades.find((x) => String(x.codigo) === uc) : null;
      setUnidadTexto(u ? etiquetaUnidad(u) : "");
    },
    [unidades]
  );

  // Re-aplica cuando la URL cambia por una navegación real (menú de guardadas,
  // enlace compartido) — `replaceState` propio no dispara esto.
  const spString = sp.toString();
  const applyRef = useRef(applyFromParams);
  applyRef.current = applyFromParams;
  const primerSync = useRef(true);
  useEffect(() => {
    if (primerSync.current) {
      primerSync.current = false;
      return;
    }
    applyRef.current(new URLSearchParams(spString));
  }, [spString]);

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

  const [sheetOpen, setSheetOpen] = useState(false);

  // Active (non-default) filters as removable chips — fast one-tap clearing.
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (estado && estado !== "Proceso publicado")
    chips.push({ key: "est", label: estado, clear: () => setEstado("Proceso publicado") });
  if (modalidad) chips.push({ key: "mod", label: modalidad, clear: () => setModalidad("") });
  if (unidadSel)
    chips.push({
      key: "uc",
      label:
        unidadSel.acronimo && unidadSel.acronimo !== "N/A"
          ? unidadSel.acronimo
          : unidadSel.nombre,
      clear: () => setUnidadTexto(""),
    });
  if (mipyme) chips.push({ key: "mip", label: "MIPYMES", clear: () => setMipyme(false) });
  if (startdate !== hoyMenosDias(30))
    chips.push({ key: "desde", label: `desde ${startdate}`, clear: () => setStartdate(hoyMenosDias(30)) });
  if (enddate) chips.push({ key: "hasta", label: `hasta ${enddate}`, clear: () => setEnddate("") });

  const filtros: FiltrosProps = {
    estado, setEstado, modalidad, setModalidad, unidades, unidadTexto,
    setUnidadTexto, unidadSel, startdate, setStartdate, enddate, setEnddate,
    orden, setOrden, mipyme, setMipyme,
  };

  const feedHref = (() => {
    const f = new URLSearchParams();
    if (q.trim()) f.set("q", q.trim());
    if (estado) f.set("estado", estado);
    if (modalidad) f.set("modalidad", modalidad);
    if (mipyme) f.set("mipyme", "1");
    if (unidadSel) f.set("uc", String(unidadSel.codigo));
    return `/api/feed?${f.toString()}`;
  })();

  return (
    <div className="space-y-5">
      {/* Encabezado compacto — la búsqueda vive en la barra superior */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
            Oportunidades de compras públicas
          </h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 text-emerald-500">
              <span className="live-dot" />
            </span>
            En vivo desde la API de datos abiertos de la DGCP
          </p>
        </div>
      </div>

      {/* Filtros — panel en escritorio */}
      <section className="hidden rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-hairline lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconFilter className="h-4 w-4 text-brand-600" />
          Filtros
        </div>
        <div className="mt-4">
          <FiltrosControles {...filtros} />
        </div>
      </section>

      {/* Barra de control en móvil: filtros + conteo + chips activos */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-hairline bg-canvas/85 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3.5 py-2 text-sm font-semibold shadow-soft transition active:scale-95"
          >
            <IconSliders className="h-4 w-4 text-brand-600" />
            Filtros
            {chips.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {chips.length}
              </span>
            )}
          </button>
          <span className="ml-auto text-xs text-ink-soft">
            {data
              ? `${data.totalResults.toLocaleString("es-DO")} ${enBusqueda ? "coincid." : "procesos"}`
              : ""}
          </span>
        </div>
        {chips.length > 0 && (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={c.clear}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/15 transition active:scale-95"
              >
                <span className="max-w-[8.5rem] truncate">{c.label}</span>
                <IconX className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtros — hoja inferior en móvil */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtros"
        footer={
          <button
            onClick={() => setSheetOpen(false)}
            className="h-12 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white transition active:scale-[0.99]"
          >
            {data
              ? `Ver ${data.totalResults.toLocaleString("es-DO")} resultados`
              : "Ver resultados"}
          </button>
        }
      >
        <div className="pb-2">
          <FiltrosControles {...filtros} />
        </div>
      </BottomSheet>

      {/* Resultados */}
      <section>
        {chips.length > 0 && (
          <div className="mb-3 hidden flex-wrap items-center gap-1.5 lg:flex">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/15 transition hover:bg-brand-100 active:scale-95"
              >
                {c.label}
                <IconX className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={() => {
                setEstado("Proceso publicado");
                setModalidad("");
                setUnidadTexto("");
                setMipyme(false);
                setStartdate(hoyMenosDias(30));
                setEnddate("");
              }}
              className="ml-1 text-xs font-medium text-ink-soft transition hover:text-rose-600"
            >
              Limpiar todo
            </button>
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
              Consultando la DGCP…
            </span>
          ) : error ? (
            <span className="text-rose-600">⚠ {error}</span>
          ) : data ? (
            <span>
              <strong className="text-ink">
                {data.totalResults.toLocaleString("es-DO")}
              </strong>{" "}
              {enBusqueda ? "coincidencias" : "procesos"}
              {enBusqueda && data.scanned
                ? ` · en ${data.scanned.toLocaleString("es-DO")} registros del rango`
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 font-medium transition hover:border-brand-500 hover:text-brand-700"
              >
                <IconDownload className="h-4 w-4" /> CSV
              </button>
              <a
                href={feedHref}
                target="_blank"
                rel="noopener noreferrer"
                title="Suscríbete a esta búsqueda con cualquier lector RSS y entérate de los procesos nuevos"
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 font-medium transition hover:border-brand-500 hover:text-brand-700"
              >
                <IconRss className="h-4 w-4" /> RSS
              </a>
            </span>
          )}
          {!enBusqueda && data && data.pages > 1 && (
            <span className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 disabled:opacity-40"
              >
                <IconChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <span className="tabular-nums">
                Página {data.page} de {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 disabled:opacity-40"
              >
                Siguiente <IconChevronRight className="h-4 w-4" />
              </button>
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shimmer h-44 rounded-2xl ring-1 ring-hairline"
              />
            ))}
          </div>
        ) : ordenados.length === 0 && !error ? (
          <div className="rounded-2xl bg-surface p-12 text-center shadow-soft ring-1 ring-hairline">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <IconSearch className="h-6 w-6" />
            </span>
            <p className="mt-3 font-semibold text-ink">Sin resultados con estos filtros</p>
            <p className="mt-1 text-sm text-ink-soft">
              Prueba ampliar el rango de fechas o quitar el filtro de estado.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {listaVisible.map((p) => (
                <ProcesoCard key={p.codigo_proceso} p={p} />
              ))}
            </div>
            {enBusqueda && ordenados.length > visibles && (
              <div className="mt-5 text-center">
                <button
                  onClick={() => setVisibles((v) => v + 24)}
                  className="rounded-full border border-hairline bg-surface px-5 py-2.5 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700"
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

function FiltrosControles({
  estado, setEstado, modalidad, setModalidad, unidades, unidadTexto,
  setUnidadTexto, unidadSel, startdate, setStartdate, enddate, setEnddate,
  orden, setOrden, mipyme, setMipyme,
}: FiltrosProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <label className="block text-xs font-medium text-ink-soft lg:col-span-12">
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
          className={INPUT_CLS}
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

      <label className="block text-xs font-medium text-ink-soft lg:col-span-3">
        Estado
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={INPUT_CLS}>
          <option value="">Todos</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-ink-soft lg:col-span-3">
        Modalidad
        <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className={INPUT_CLS}>
          <option value="">Todas</option>
          {MODALIDADES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-ink-soft lg:col-span-2">
        Publicado desde
        <input
          type="date"
          value={startdate}
          onChange={(e) => setStartdate(e.target.value)}
          className={INPUT_CLS}
        />
      </label>

      <label className="block text-xs font-medium text-ink-soft lg:col-span-2">
        Hasta
        <input
          type="date"
          value={enddate}
          onChange={(e) => setEnddate(e.target.value)}
          className={INPUT_CLS}
        />
      </label>

      <label className="block text-xs font-medium text-ink-soft lg:col-span-2">
        Ordenar por
        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className={INPUT_CLS}>
          <option value="recientes">Más recientes</option>
          <option value="cierre">Cierre más próximo</option>
          <option value="monto_desc">Mayor monto</option>
          <option value="monto_asc">Menor monto</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink lg:col-span-12">
        <input
          type="checkbox"
          checked={mipyme}
          onChange={(e) => setMipyme(e.target.checked)}
          className="h-4 w-4 rounded border-hairline accent-brand-600"
        />
        Solo dirigidos a MIPYMES
      </label>
    </div>
  );
}
