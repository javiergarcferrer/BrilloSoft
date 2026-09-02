/**
 * Nómina pública — modelo de datos, formateadores y agregaciones.
 *
 * El conjunto es una **foto transversal del Estado**: el último mes publicado
 * por cada institución en su nómina de transparencia, consolidado por
 * `scripts/build-nomina.py` (que documenta fuentes, formatos y límites).
 * Cada fila es una plaza (institución, área, cargo, sueldo bruto) — sin
 * nombres ni datos personales. La cobertura es la que cada institución
 * publica en formato procesable: se declara, no se disimula.
 */

/** Una fila es una tupla compacta de índices de diccionario + sueldo. */
export type Row = readonly [inst: number, area: number, cargo: number, sueldo: number];

export const COL = { INST: 0, AREA: 1, CARGO: 2, SUELDO: 3 } as const;

export interface InstitucionNomina {
  codigo: string;
  nombre: string;
  /** Período de la foto de esta institución. */
  anio: number;
  mes: number;
  plazas: number;
  /** Σ sueldos del mes, en DOP. */
  masa: number;
}

export type NominaData = {
  generatedAt: string;
  esquema: string;
  currency: string;
  monthNames: string[];
  instituciones: InstitucionNomina[];
  areas: string[];
  cargos: string[];
  rows: Row[];
};

export const MONTH_ABBR = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/**
 * Fetch the encoded dataset from /public.
 *
 * Sin `force-cache`: la respuesta lleva `Cache-Control` (next.config.ts) con
 * una hora de frescura y renovación en segundo plano, así que el navegador
 * la reutiliza sin quedarse con una instantánea vieja tras un despliegue.
 */
export async function loadNomina(): Promise<NominaData> {
  const res = await fetch("/data/nomina.json");
  if (!res.ok) throw new Error(`No se pudo cargar la nómina (${res.status})`);
  return res.json();
}

const dop = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});
const int = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 0 });

/** RD$1,234,567 */
export const formatDOP = (n: number) => dop.format(Math.round(n));
/** 1,234,567 */
export const formatInt = (n: number) => int.format(Math.round(n));

/** Compact pesos for axes / chips: RD$60.5M, RD$21K. */
export function formatCompactDOP(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `RD$${(n / 1e9).toFixed(2)}MM`;
  if (a >= 1e6) return `RD$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `RD$${Math.round(n / 1e3)}K`;
  return `RD$${Math.round(n)}`;
}

/** "May '26" para el período de una institución. */
export const periodLabel = (anio: number, mes: number) =>
  `${MONTH_ABBR[mes - 1]} '${String(anio).slice(2)}`;

export type Bucket = { label: string; min: number; max: number };

/** Salary brackets used by the distribution chart (RD$). */
export const SALARY_BUCKETS: Bucket[] = [
  { label: "RD$0", min: 0, max: 0 },
  { label: "1–15K", min: 1, max: 15000 },
  { label: "15–25K", min: 15001, max: 25000 },
  { label: "25–50K", min: 25001, max: 50000 },
  { label: "50–80K", min: 50001, max: 80000 },
  { label: "80K+", min: 80001, max: Infinity },
];

export function bucketOf(sueldo: number): number {
  for (let i = 0; i < SALARY_BUCKETS.length; i++) {
    const b = SALARY_BUCKETS[i];
    if (sueldo >= b.min && sueldo <= b.max) return i;
  }
  return SALARY_BUCKETS.length - 1;
}

export type GroupStat = {
  key: number; // dictionary index
  count: number;
  total: number;
  avg: number;
  min: number;
  max: number;
};

/**
 * Aggregate filtered rows by a dimension column (INST, AREA or CARGO).
 * Returns one stat row per distinct key, unsorted.
 */
export function aggregateBy(rows: Row[], col: number): GroupStat[] {
  const acc = new Map<number, GroupStat>();
  for (const r of rows) {
    const k = r[col];
    const s = r[COL.SUELDO];
    let g = acc.get(k);
    if (!g) {
      g = { key: k, count: 0, total: 0, avg: 0, min: s, max: s };
      acc.set(k, g);
    }
    g.count++;
    g.total += s;
    if (s < g.min) g.min = s;
    if (s > g.max) g.max = s;
  }
  for (const g of acc.values()) g.avg = g.count ? g.total / g.count : 0;
  return [...acc.values()];
}

/** Median of a numeric array (mutates a copy). */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
