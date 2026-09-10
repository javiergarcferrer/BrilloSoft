"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrdenProceso, Proceso } from "@/lib/dgcp";
/*
  Las etapas se importan de `lib/estados.ts` y no de `lib/dgcp.ts`: son
  vocabulario de interfaz —color y condición del estado— y este componente es
  de cliente. Traerlas del adaptador metería sus mil doscientas líneas de
  acceso a la DGCP en el bundle del navegador para leer cinco etiquetas.
*/
import {
  ETAPAS,
  etapaDe,
  etapaPorClave,
  type EtapaClave,
} from "@/lib/estados";
import ProcesoCard from "@/components/proceso-card";
import { cn } from "@/lib/cn";
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
  etapa: EtapaFiltro;
  setEtapa: (v: EtapaFiltro) => void;
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

/** Etapa seleccionada; `""` es «todas», que no filtra nada. */
type EtapaFiltro = EtapaClave | "";

/** La etapa con la que abre el buscador: la pregunta del titular. */
const ETAPA_INICIAL: EtapaFiltro = "abiertos";

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

/*
  El orden no se re-declara aquí. Es la misma enumeración que la ruta usa de
  allowlist (`ORDENES` en lib/dgcp.ts): si las dos listas divergieran, el
  `<select>` ofrecería un valor que el servidor descarta y el listado saldría
  ordenado por otra cosa mientras el control afirma lo contrario — un control
  sin efecto, que es justo lo que el gate persigue. Es un import de tipo: se
  borra al compilar y no arrastra el adaptador al bundle.
*/
type Orden = OrdenProceso;

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
  muestra?: boolean;
  error?: string;
}

function hoyMenosDias(dias: number): string {
  const d = new Date(Date.now() - dias * 86400000);
  return d.toISOString().slice(0, 10);
}

/**
 * La etapa que pide un querystring.
 *
 * `?etapa=` es lo que se escribe hoy. `?estado=` es lo que llevan los enlaces
 * compartidos y las búsquedas guardadas de antes —`lib/busquedas.ts` guarda el
 * querystring crudo—, así que un estado literal de la DGCP se traduce a su
 * etapa en vez de quedar ignorado. `?estado=` vacío era «todos los estados»:
 * se conserva.
 */
function etapaDeParams(p: URLSearchParams): EtapaFiltro {
  const clave = p.get("etapa");
  if (clave !== null) return (etapaPorClave(clave)?.clave ?? "") as EtapaFiltro;
  const estado = p.get("estado");
  if (estado !== null) return estado ? etapaDe(estado).clave : "";
  return ETAPA_INICIAL;
}

export default function Buscador() {
  const sp = useSearchParams();
  const [q, setQ] = useState(() => sp.get("q") ?? "");
  const [etapa, setEtapa] = useState<EtapaFiltro>(() => etapaDeParams(sp));
  const [modalidad, setModalidad] = useState(() => sp.get("modalidad") ?? "");
  const [startdate, setStartdate] = useState(
    () => sp.get("desde") ?? hoyMenosDias(30)
  );
  const [enddate, setEnddate] = useState(() => sp.get("hasta") ?? "");
  const [mipyme, setMipyme] = useState(() => sp.get("mipyme") === "1");
  const [orden, setOrden] = useState<Orden>(
    () => (sp.get("orden") as Orden) || "recientes"
  );
  const etapaSel = etapaPorClave(etapa);
  const [page, setPage] = useState(() => Math.max(1, Number(sp.get("page")) || 1));

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
    if (etapa !== ETAPA_INICIAL) params.set("etapa", etapa);
    if (modalidad) params.set("modalidad", modalidad);
    if (startdate && startdate !== hoyMenosDias(30)) params.set("desde", startdate);
    if (enddate) params.set("hasta", enddate);
    if (mipyme) params.set("mipyme", "1");
    if (orden !== "recientes") params.set("orden", orden);
    if (unidadSel) params.set("uc", String(unidadSel.codigo));
    // La página también: ahora que la búsqueda pagina de verdad, un enlace
    // compartido desde la página 7 que abriera en la 1 no es el mismo enlace.
    if (page > 1) params.set("page", String(page));
    return params;
  }, [q, etapa, modalidad, startdate, enddate, mipyme, orden, page, unidadSel]);

  // Mantiene los filtros en la URL (compartible / guardable). La ruta se toma
  // de la ubicación real: este componente vivió en `/` y hoy vive en
  // `/licitaciones`; un literal aquí desorientaría todo el chrome (nav global,
  // barra de sección) al reescribir el pathname.
  useEffect(() => {
    const qs = currentParams.toString();
    const base = window.location.pathname;
    const url = qs ? `${base}?${qs}` : base;
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [currentParams]);

  // Aplica filtros desde un querystring (búsqueda guardada / enlace compartido).
  const applyFromParams = useCallback(
    (p: URLSearchParams) => {
      setQ(p.get("q") ?? "");
      setEtapa(etapaDeParams(p));
      setModalidad(p.get("modalidad") ?? "");
      setStartdate(p.get("desde") ?? hoyMenosDias(30));
      setEnddate(p.get("hasta") ?? "");
      setMipyme(p.get("mipyme") === "1");
      setOrden((p.get("orden") as Orden) || "recientes");
      const uc = p.get("uc");
      const u = uc ? unidades.find((x) => String(x.codigo) === uc) : null;
      setUnidadTexto(u ? etiquetaUnidad(u) : "");
      setPage(Math.max(1, Number(p.get("page")) || 1));
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
      if (etapa) params.set("etapa", etapa);
      if (modalidad) params.set("modalidad", modalidad);
      if (startdate) params.set("startdate", startdate);
      if (enddate) params.set("enddate", enddate);
      if (mipyme) params.set("mipyme", "true");
      if (unidadSel) params.set("unidad_compra", String(unidadSel.codigo));
      // El orden viaja al servidor: ordenar aquí solo reordenaba las 24 filas
      // de la página y el control decía «Mayor monto» de miles de procesos.
      if (orden !== "recientes") params.set("orden", orden);
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
  }, [q, etapa, modalidad, startdate, enddate, mipyme, orden, page, unidadSel]);

  // Debounce para el texto; inmediato para el resto de filtros.
  useEffect(() => {
    const t = setTimeout(fetchData, q ? 450 : 0);
    return () => clearTimeout(t);
  }, [fetchData, q]);

  /*
    Cualquier cambio de filtro reinicia la paginación — pero solo un cambio
    de verdad. Este efecto también corre en el montaje, y hacerlo entonces
    tiraba la página que acababa de leerse de la URL: un enlace compartido
    desde la página 7 abría en la 1. Comparar la firma de los filtros contra
    la del render anterior distingue «montó» de «cambió» sin banderas.
  */
  const firmaFiltros = `${q}|${etapa}|${modalidad}|${startdate}|${enddate}|${mipyme}|${orden}|${unidadSel?.codigo ?? ""}`;
  const firmaPrevia = useRef(firmaFiltros);
  useEffect(() => {
    if (firmaPrevia.current === firmaFiltros) return;
    firmaPrevia.current = firmaFiltros;
    setPage(1);
  }, [firmaFiltros]);

  /*
    La lista llega ya filtrada y ordenada, y paginada de verdad.

    Aquí vivían dos cosas que decían algo falso. Una: el orden se aplicaba
    sobre `data.content`, o sea sobre las 24 filas de la página, mientras el
    control ofrecía «Mayor monto» de un rango de miles. Otra: en modo búsqueda
    la capa recortaba a 300 coincidencias y esta lista las soltaba de 24 en 24
    con un «Mostrar más», así que la 301 no existía y nadie lo decía. Las dos
    se arreglan en el mismo sitio —`listProcesos` ordena y pagina lo que
    declara haber barrido—, y aquí solo se pinta.
  */
  const lista = data?.content ?? [];
  const enBusqueda = q.trim().length > 0;
  /* El conteo sale del barrido, no del censo: la interfaz está obligada a decirlo. */
  const esMuestra = Boolean(data?.muestra);

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
      ...lista.map((p) => cols.map(([, f]) => esc(f(p))).join(",")),
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

  /*
    Todos los filtros puestos, incluidos los que vienen por defecto.
    Emitir un chip solo cuando el valor difiere del inicial deja invisibles
    justo los dos que más recortan —etapa y ventana de fechas—: quien busca
    «hospital» y ve «0 coincidencias» nunca se entera de que está mirando
    treinta días de procesos abiertos. El estado del sistema que más pesa no
    puede ser el que se le pide recordar sin habérselo dicho.

    `porDefecto` los distingue en gris: quitarlos **abre** la búsqueda en vez
    de restaurar nada.

    La fecha dice «publicados» y no solo «últimos 30 días» porque el filtro
    corre sobre la **publicación**, no sobre el cierre. Es lo que hace que un
    proceso que cerró ayer pero se publicó hace dos meses no salga; sin la
    palabra, la ausencia parece un hueco de la fuente y es la ventana pedida.
  */
  const chips: {
    key: string;
    label: string;
    clear: () => void;
    porDefecto?: boolean;
  }[] = [];
  chips.push(
    etapa === ETAPA_INICIAL
      ? {
          key: "etapa",
          label: "solo abiertos",
          porDefecto: true,
          clear: () => setEtapa(""),
        }
      : etapaSel
        ? { key: "etapa", label: etapaSel.label.toLowerCase(), clear: () => setEtapa("") }
        : {
            key: "etapa",
            label: "todas las etapas",
            porDefecto: true,
            clear: () => setEtapa(ETAPA_INICIAL),
          },
  );
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
  chips.push(
    startdate === hoyMenosDias(30)
      ? {
          key: "desde",
          label: "publicados: últimos 30 días",
          porDefecto: true,
          clear: () => setStartdate(""),
        }
      : startdate
        ? { key: "desde", label: `publicados desde ${startdate}`, clear: () => setStartdate(hoyMenosDias(30)) }
        : { key: "desde", label: "todo el histórico", porDefecto: true, clear: () => setStartdate(hoyMenosDias(30)) },
  );
  if (enddate) chips.push({ key: "hasta", label: `hasta ${enddate}`, clear: () => setEnddate("") });

  const filtros: FiltrosProps = {
    etapa, setEtapa, modalidad, setModalidad, unidades, unidadTexto,
    setUnidadTexto, unidadSel, startdate, setStartdate, enddate, setEnddate,
    orden, setOrden, mipyme, setMipyme,
  };

  const feedHref = (() => {
    const f = new URLSearchParams();
    if (q.trim()) f.set("q", q.trim());
    // Siempre, incluso vacío: `etapa=` es «todas» y su ausencia es «abiertos».
    f.set("etapa", etapa);
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
          <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
            ¿Qué está comprando el Estado ahora mismo?
          </h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="relative inline-block h-1.5 w-1.5 rounded-md border border-brand-200 bg-brand-500 text-brand-500">
              <span className="live-dot" />
            </span>
            En vivo desde la API de datos abiertos de la DGCP
          </p>
        </div>
      </div>

      {/* Filtros — panel en escritorio */}
      <section className="hidden rounded-lg bg-surface p-5 border border-hairline lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconFilter className="h-4 w-4 text-brand-600" />
          Filtros
        </div>
        <div className="mt-4">
          <FiltrosControles {...filtros} />
        </div>
      </section>

      {/* Barra de control en móvil: filtros + conteo + chips activos */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-hairline bg-canvas px-4 py-2.5 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3.5 py-2 text-sm font-semibold  transition active:scale-95"
          >
            <IconSliders className="h-4 w-4 text-brand-600" />
            Filtros
            {chips.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 font-mono text-[11px] font-semibold tabular-nums text-canvas">
                {chips.length}
              </span>
            )}
          </button>
          {/*
            También aquí se marca la muestra. Es el conteo que se ve en un
            teléfono —la superficie principal— y repetir el número desnudo
            encima del que sí declara su base es justo cómo una muestra acaba
            usándose de censo.
          */}
          <span className="ml-auto text-xs text-ink-soft">
            {data
              ? `${data.totalResults.toLocaleString("es-DO")} ${enBusqueda ? "coincid." : "procesos"}${esMuestra ? " (muestra)" : ""}`
              : ""}
          </span>
        </div>
        {chips.length > 0 && (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={c.clear}
                title={
                  c.porDefecto
                    ? "Filtro por defecto — quítalo para ampliar la búsqueda"
                    : "Quitar este filtro"
                }
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition active:scale-95",
                  c.porDefecto
                    ? "border-hairline bg-canvas text-ink-soft hover:text-ink"
                    : "border-brand-200 bg-brand-50 text-brand-700",
                )}
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
            className="h-12 w-full rounded-lg bg-brand-600 text-sm font-semibold text-canvas transition active:scale-[0.99]"
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
                title={
                  c.porDefecto
                    ? "Filtro por defecto — quítalo para ampliar la búsqueda"
                    : "Quitar este filtro"
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition active:scale-95",
                  c.porDefecto
                    ? "border-hairline bg-canvas text-ink-soft hover:text-ink"
                    : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
                )}
              >
                {c.label}
                <IconX className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={() => {
                setEtapa(ETAPA_INICIAL);
                setModalidad("");
                setUnidadTexto("");
                setMipyme(false);
                setStartdate(hoyMenosDias(30));
                setEnddate("");
              }}
              className="ml-1 text-xs font-medium text-ink-soft transition hover:text-brand-700"
            >
              Limpiar todo
            </button>
          </div>
        )}
        {/*
          El conteo cambia sin recargar la página: sin `aria-live` un lector de
          pantalla no se entera de que la búsqueda terminó ni de cuántos
          resultados hay. `polite` espera a que el usuario deje de teclear;
          `atomic` lee la frase entera («384 procesos») y no solo el número que
          cambió.
        */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
              Consultando la DGCP…
            </span>
          ) : error ? (
            <span className="text-alerta-700">{error}</span>
          ) : data ? (
            <span>
              <strong className="text-ink">
                {data.totalResults.toLocaleString("es-DO")}
              </strong>{" "}
              {enBusqueda ? "coincidencias" : "procesos"}
              {/*
                La base se declara siempre que el conteo salga del barrido, no
                solo al buscar texto: filtrar por etapa u ordenar por monto
                también cuenta sobre la muestra, y un número sin su base invita
                a usarlo de denominador.
              */}
              {esMuestra && data.scanned
                ? ` · entre ${data.scanned.toLocaleString("es-DO")} registros del rango`
                : ""}
              {esMuestra && data.truncated
                ? " — rango amplio: acota las fechas para contarlos todos"
                : ""}
            </span>
          ) : null}
          {!loading && lista.length > 0 && (
            <span className="flex items-center gap-2">
              {/*
                El botón dice cuántas filas baja. Antes ponía «CSV» a secas
                junto a un encabezado que anuncia miles de procesos, y el
                archivo trae solo las de esta página: quien lo abre cree tener
                el conjunto y cita veinticuatro filas. Es el peor error de esta
                casa —silencioso y citable—, y se cierra diciendo el alcance en
                el propio control.
              */}
              <button
                onClick={exportarCsv}
                title={`Descarga las ${lista.length} filas de esta página, con los filtros puestos`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 font-medium transition hover:border-brand-500 hover:text-brand-700"
              >
                <IconDownload className="h-4 w-4" /> CSV ({lista.length})
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
          {/*
            El paginador ya vale también en modo búsqueda: la capa pagina de
            verdad las coincidencias en vez de recortarlas a 300.
          */}
          {data && data.pages > 1 && (
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

        {/*
          Mientras llega la página siguiente o un filtro nuevo, los resultados
          anteriores se quedan a la vista, atenuados: cambiar la rejilla por
          un esqueleto en cada clic hacía saltar la página y perder el sitio.
          El esqueleto solo aparece cuando aún no hay nada que mostrar.
        */}
        {loading && lista.length === 0 && !error ? (
          <div className="grid gap-3 md:grid-cols-2" role="status" aria-busy="true">
            <span className="sr-only">Consultando la DGCP…</span>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shimmer h-44 rounded-lg border border-hairline"
              />
            ))}
          </div>
        ) : error ? (
          /*
            «No hay resultados» y «la fuente no contestó» son dos cosas
            distintas, y antes se pintaban igual: una rejilla vacía con una
            línea ocre de 12px. Sin esta rama, quien tropieza con un 502 de la
            DGCP se queda con una página en blanco y sin la única acción útil.
          */
          <div className="rounded-lg border border-alerta-600/25 bg-alerta-50 px-5 py-10 text-center">
            <p className="font-sans text-sm font-semibold text-ink">
              La DGCP no respondió
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
              No es un problema de tu búsqueda: los filtros siguen puestos. La
              fuente oficial no contestó a tiempo.
            </p>
            <button
              type="button"
              onClick={() => fetchData()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-brand-700"
            >
              Reintentar
            </button>
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-lg bg-surface p-12 text-center border border-hairline">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-hairline text-ink-soft">
              <IconSearch className="h-6 w-6" />
            </span>
            <p className="mt-3 font-semibold text-ink">Sin resultados con estos filtros</p>
            {/*
              Pedir una etapa cerrada dentro de una ventana corta devuelve poco
              o nada, y la razón no se adivina: la ventana corre sobre la fecha
              de **publicación**. Un proceso que cerró la semana pasada pudo
              publicarse dos meses antes. Decirlo aquí es la diferencia entre
              «la plataforma no los tiene» y «pídelos bien».
            */}
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
              {etapaSel && etapaSel.clave !== "abiertos"
                ? "El rango de fechas filtra por publicación, no por cierre: un proceso que acaba de cerrar pudo publicarse mucho antes.Amplía «Publicado desde» para alcanzarlo."
                : "Prueba ampliar el rango de fechas o quitar el filtro de etapa."}
            </p>
          </div>
        ) : (
          <div
            aria-busy={loading}
            className={cn(
              "grid gap-3 transition-opacity duration-200 md:grid-cols-2",
              loading && "pointer-events-none opacity-50",
            )}
          >
            {lista.map((p) => (
              <ProcesoCard key={p.codigo_proceso} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FiltrosControles({
  etapa, setEtapa, modalidad, setModalidad, unidades, unidadTexto,
  setUnidadTexto, unidadSel, startdate, setStartdate, enddate, setEnddate,
  orden, setOrden, mipyme, setMipyme,
}: FiltrosProps) {
  const etapaSel = etapaPorClave(etapa);
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
          <span className="mt-1 block text-[11px] text-alerta-600">
            Selecciona una institución de la lista para aplicar el filtro.
          </span>
        )}
      </label>

      {/*
        Etapa, no «estado». El control ofrecía los siete `estado_proceso` de la
        DGCP tal cual, así que «¿qué ya cerró?» —donde están el ganador y el
        precio— exigía saber que la respuesta se reparte entre seis de ellos y
        elegirlos de uno en uno. Ahora la pregunta es una opción, y debajo se
        dice en llano qué se está pidiendo.
      */}
      <label className="block text-xs font-medium text-ink-soft lg:col-span-3">
        Etapa
        <select
          value={etapa}
          onChange={(e) => setEtapa(e.target.value as EtapaFiltro)}
          className={INPUT_CLS}
        >
          <option value="">Todas las etapas</option>
          {ETAPAS.map((e) => (
            <option key={e.clave} value={e.clave}>
              {e.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-[11px] leading-snug text-ink-soft">
          {etapaSel?.ayuda ?? "Abiertos y cerrados, en cualquier punto de su trámite."}
        </span>
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
        Publicado hasta
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
          {/*
            «(RD$)» no es adorno: el registro publica también en dólares y en
            euros, y sin tasa de cambio no hay forma honesta de mezclarlos en
            un mismo ranking. Se ordena dentro del peso y lo demás va al final
            con su divisa a la vista; la etiqueta dice exactamente eso.
          */}
          <option value="monto_desc">Mayor monto (RD$)</option>
          <option value="monto_asc">Menor monto (RD$)</option>
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
