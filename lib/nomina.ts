/**
 * Nómina explorer — data model, formatters and aggregation helpers.
 *
 * The dataset is a public Dominican payroll ("Nómina de Empleados Fijos") of
 * monthly snapshots (Jul-2023 → May-2026). Each row is one budgeted position in
 * a given month, so headcount = row count and gasto = Σ sueldo. There are no
 * names/PII. See scripts/build-nomina.py for how the JSON is produced.
 */

/** A row is a compact tuple of dictionary indices + values (see build script). */
export type Row = readonly [
  loc: number,
  cargo: number,
  sueldo: number,
  mes: number, // 1–12
  anio: number,
];

export const COL = { LOC: 0, CARGO: 1, SUELDO: 2, MES: 3, ANIO: 4 } as const;

export type NominaData = {
  generatedAt: string;
  source: string;
  currency: string;
  monthNames: string[];
  localidades: string[];
  cargos: string[];
  rows: Row[];
};

export const MONTH_ABBR = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Fetch the encoded dataset from /public. */
export async function loadNomina(): Promise<NominaData> {
  const res = await fetch("/data/nomina.json", { cache: "force-cache" });
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

/** Period key for time series ordering: 2024-03 → 202403. */
export const periodKey = (anio: number, mes: number) => anio * 100 + mes;
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
 * Aggregate filtered rows by a dimension column (LOC or CARGO).
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
