import {
  CATEGORIAS,
  INSTITUCIONES,
  LICITACIONES,
  PERFIL_DEFAULT,
} from "./data";
import type {
  Categoria,
  Estado,
  Etapa,
  FiltrosBusqueda,
  Institucion,
  Licitacion,
  PerfilCapacidad,
} from "./types";

/**
 * Reference "today" for the platform. Pinned so the demo's relative deadlines
 * render identically on the server and client (no hydration drift). Swap for
 * `new Date()` when wired to a live feed.
 */
export const HOY = new Date("2026-06-14T12:00:00-04:00");

const dopFmt = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});
const usdFmt = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMonto(monto: number, moneda: "DOP" | "USD" = "DOP") {
  return (moneda === "USD" ? usdFmt : dopFmt).format(monto);
}

/** Compact form for KPIs, e.g. "RD$48.5 MM" / "US$2.4 MM". */
export function formatMontoCompacto(monto: number, moneda: "DOP" | "USD" = "DOP") {
  const sym = moneda === "USD" ? "US$" : "RD$";
  if (monto >= 1_000_000_000) return `${sym}${(monto / 1_000_000_000).toFixed(1)} MMM`;
  if (monto >= 1_000_000) return `${sym}${(monto / 1_000_000).toFixed(1)} MM`;
  if (monto >= 1_000) return `${sym}${(monto / 1_000).toFixed(0)} K`;
  return `${sym}${monto}`;
}

const fechaFmt = new Intl.DateTimeFormat("es-DO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const fechaLargaFmt = new Intl.DateTimeFormat("es-DO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatFecha(iso: string) {
  return fechaFmt.format(new Date(`${iso}T12:00:00-04:00`));
}

export function formatFechaLarga(iso: string) {
  return fechaLargaFmt.format(new Date(`${iso}T12:00:00-04:00`));
}

/** Whole days from HOY until the given ISO date (negative = past). */
export function diasRestantes(iso: string) {
  const target = new Date(`${iso}T23:59:59-04:00`);
  return Math.ceil((target.getTime() - HOY.getTime()) / 86_400_000);
}

export function textoDiasRestantes(iso: string) {
  const d = diasRestantes(iso);
  if (d < 0) return `Cerró hace ${Math.abs(d)} d`;
  if (d === 0) return "Cierra hoy";
  if (d === 1) return "Cierra mañana";
  return `Cierra en ${d} días`;
}

export interface EstadoMeta {
  label: string;
  /** Token-based classes for a soft badge. */
  badge: string;
  dot: string;
}

const ESTADO_META: Record<Estado, EstadoMeta> = {
  abierta: { label: "Abierta", badge: "bg-open-soft text-open ring-open/20", dot: "bg-open" },
  por_cerrar: { label: "Por cerrar", badge: "bg-soon-soft text-soon ring-soon/20", dot: "bg-soon" },
  cerrada: { label: "En evaluación", badge: "bg-slate-soft text-ink-soft ring-hairline", dot: "bg-ink-soft" },
  adjudicada: { label: "Adjudicada", badge: "bg-awarded-soft text-awarded ring-awarded/20", dot: "bg-awarded" },
  desierta: { label: "Desierta", badge: "bg-closed-soft text-closed ring-closed/20", dot: "bg-closed" },
};

export function estadoMeta(estado: Estado): EstadoMeta {
  return ESTADO_META[estado];
}

const ETAPA_META: Record<Etapa, { label: string; badge: string; dot: string; orden: number }> = {
  interesada: { label: "Interesada", badge: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-400", orden: 0 },
  evaluando: { label: "Evaluando", badge: "bg-accent-50 text-accent-700 ring-accent-200", dot: "bg-accent-500", orden: 1 },
  preparando: { label: "Preparando oferta", badge: "bg-soon-soft text-soon ring-soon/20", dot: "bg-soon", orden: 2 },
  presentada: { label: "Presentada", badge: "bg-awarded-soft text-awarded ring-awarded/20", dot: "bg-awarded", orden: 3 },
  ganada: { label: "Ganada", badge: "bg-open-soft text-open ring-open/20", dot: "bg-open", orden: 4 },
  perdida: { label: "No adjudicada", badge: "bg-closed-soft text-closed ring-closed/20", dot: "bg-closed", orden: 5 },
};

export function etapaMeta(etapa: Etapa) {
  return ETAPA_META[etapa];
}

export const ETAPAS_ORDEN: Etapa[] = [
  "interesada",
  "evaluando",
  "preparando",
  "presentada",
  "ganada",
  "perdida",
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

const instById = new Map(INSTITUCIONES.map((i) => [i.id, i]));
const catById = new Map(CATEGORIAS.map((c) => [c.id, c]));
const licById = new Map(LICITACIONES.map((l) => [l.id, l]));

export function getInstitucion(id: string): Institucion | undefined {
  return instById.get(id);
}
export function getCategoria(id: string): Categoria | undefined {
  return catById.get(id);
}
export function getLicitacion(id: string): Licitacion | undefined {
  return licById.get(id);
}

// ---------------------------------------------------------------------------
// Match scoring (opportunity fit 0-100)
// ---------------------------------------------------------------------------

/**
 * Scores how well an opportunity fits a buyer-side capability profile, mirroring
 * the semantic match scoring used by leading platforms. Combines category
 * strength, geography, value band and recency into a 0-100 score.
 */
export function puntuacionAfinidad(
  lic: Licitacion,
  perfil: PerfilCapacidad = PERFIL_DEFAULT,
): number {
  const categoria = perfil.categorias[lic.categoriaId] ?? 0.15;
  let score = categoria * 62; // up to 62 pts from category fit

  // Geography (up to 16 pts)
  if (perfil.provinciasPreferidas.includes(lic.provincia)) score += 16;
  else if (lic.provincia === "Nacional (todo el país)") score += 11;
  else score += 4;

  // Value band fit (up to 14 pts) — normalize USD roughly to DOP
  const montoDop = lic.moneda === "USD" ? lic.montoEstimado * 60 : lic.montoEstimado;
  if (montoDop >= perfil.montoMin && montoDop <= perfil.montoMax) score += 14;
  else if (montoDop < perfil.montoMin) score += 6;
  else score += 3;

  // Freshness / actionability (up to 8 pts)
  const dias = diasRestantes(lic.cierre);
  if (lic.estado === "abierta" && dias > 7) score += 8;
  else if (lic.estado === "por_cerrar" || (dias > 0 && dias <= 7)) score += 5;
  else score += 1;

  return Math.max(4, Math.min(99, Math.round(score)));
}

export function nivelAfinidad(score: number): {
  label: string;
  color: string;
  ring: string;
} {
  if (score >= 75) return { label: "Afinidad alta", color: "text-open", ring: "stroke-open" };
  if (score >= 50) return { label: "Afinidad media", color: "text-accent-600", ring: "stroke-accent-500" };
  return { label: "Afinidad baja", color: "text-ink-soft", ring: "stroke-ink-soft" };
}

// ---------------------------------------------------------------------------
// Search & filtering
// ---------------------------------------------------------------------------

export const FILTROS_VACIOS: FiltrosBusqueda = {
  texto: "",
  categorias: [],
  instituciones: [],
  procedimientos: [],
  estados: [],
  provincias: [],
  montoMin: null,
  montoMax: null,
};

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export type Orden = "afinidad" | "cierre" | "monto" | "reciente";

export function filtrarLicitaciones(
  filtros: FiltrosBusqueda,
  orden: Orden = "afinidad",
): Licitacion[] {
  const q = normalizar(filtros.texto.trim());
  const terminos = q.split(/\s+/).filter(Boolean);

  const resultado = LICITACIONES.filter((lic) => {
    if (terminos.length) {
      const inst = getInstitucion(lic.institucionId);
      const cat = getCategoria(lic.categoriaId);
      const haystack = normalizar(
        [
          lic.titulo,
          lic.descripcion,
          lic.id,
          lic.provincia,
          lic.procedimiento,
          inst?.nombre ?? "",
          inst?.sigla ?? "",
          cat?.nombre ?? "",
        ].join(" "),
      );
      if (!terminos.every((t) => haystack.includes(t))) return false;
    }
    if (filtros.categorias.length && !filtros.categorias.includes(lic.categoriaId)) return false;
    if (filtros.instituciones.length && !filtros.instituciones.includes(lic.institucionId)) return false;
    if (filtros.procedimientos.length && !filtros.procedimientos.includes(lic.procedimiento)) return false;
    if (filtros.estados.length && !filtros.estados.includes(lic.estado)) return false;
    if (filtros.provincias.length && !filtros.provincias.includes(lic.provincia)) return false;

    const montoDop = lic.moneda === "USD" ? lic.montoEstimado * 60 : lic.montoEstimado;
    if (filtros.montoMin != null && montoDop < filtros.montoMin) return false;
    if (filtros.montoMax != null && montoDop > filtros.montoMax) return false;
    return true;
  });

  return ordenar(resultado, orden);
}

export function ordenar(lics: Licitacion[], orden: Orden): Licitacion[] {
  const copia = [...lics];
  switch (orden) {
    case "afinidad":
      return copia.sort((a, b) => puntuacionAfinidad(b) - puntuacionAfinidad(a));
    case "cierre":
      return copia.sort((a, b) => diasRestantes(a.cierre) - diasRestantes(b.cierre));
    case "monto": {
      const dop = (l: Licitacion) => (l.moneda === "USD" ? l.montoEstimado * 60 : l.montoEstimado);
      return copia.sort((a, b) => dop(b) - dop(a));
    }
    case "reciente":
      return copia.sort((a, b) => +new Date(b.publicada) - +new Date(a.publicada));
  }
}

export function contarFiltrosActivos(f: FiltrosBusqueda): number {
  return (
    (f.texto.trim() ? 1 : 0) +
    f.categorias.length +
    f.instituciones.length +
    f.procedimientos.length +
    f.estados.length +
    f.provincias.length +
    (f.montoMin != null ? 1 : 0) +
    (f.montoMax != null ? 1 : 0)
  );
}
