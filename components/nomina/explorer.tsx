"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  IconBuilding,
  IconChartBar,
  IconCoins,
  IconDownload,
  IconLayers,
  IconMapPin,
  IconSearch,
  IconTrendingUp,
  IconX,
} from "@/components/icons";
import {
  aggregateBy,
  bucketOf,
  COL,
  formatCompactDOP,
  formatDOP,
  formatInt,
  loadNomina,
  median,
  MONTH_ABBR,
  periodKey,
  periodLabel,
  SALARY_BUCKETS,
  type GroupStat,
  type NominaData,
  type Row,
} from "@/lib/nomina";
import { BarList, Histogram, TimeSeries, type SeriesPoint } from "./charts";
import { DataTable, type SortDir, type SortKey } from "./data-table";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type View = "resumen" | "tabla";
type LocMetric = "total" | "count" | "avg";
type IconType = React.ComponentType<{ className?: string }>;

export function Explorer() {
  const [data, setData] = useState<NominaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNomina().then(setData).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-hairline bg-surface p-6 text-sm text-ink-soft">
        {error}
      </p>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-6 text-sm text-ink-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-brand-600" />
        Cargando 91,806 registros…
      </div>
    );
  }
  return <ExplorerReady data={data} />;
}

function ExplorerReady({ data }: { data: NominaData }) {
  const [view, setView] = useState<View>("resumen");

  // ---- filters
  const [queryInput, setQueryInput] = useState("");
  const query = useDebounced(queryInput.trim(), 250);
  const [locId, setLocId] = useState<number | null>(null);
  const [years, setYears] = useState<Set<number>>(new Set());
  const [months, setMonths] = useState<Set<number>>(new Set());
  const [salMin, setSalMin] = useState<string>("");
  const [salMax, setSalMax] = useState<string>("");

  // ---- raw-table sort
  const [sortKey, setSortKey] = useState<SortKey>("periodo");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ---- ranking metric for "top localidades"
  const [locMetric, setLocMetric] = useState<LocMetric>("total");

  // dictionaries / option lists (computed once)
  const { allYears, allPeriods, locNorm, cargoNorm, locOptions } = useMemo(() => {
    const ys = new Set<number>();
    const ps = new Set<number>();
    for (const r of data.rows) {
      ys.add(r[COL.ANIO]);
      ps.add(periodKey(r[COL.ANIO], r[COL.MES]));
    }
    return {
      allYears: [...ys].sort((a, b) => a - b),
      allPeriods: [...ps].sort((a, b) => a - b),
      locNorm: data.localidades.map(norm),
      cargoNorm: data.cargos.map(norm),
      locOptions: data.localidades
        .map((name, i) => ({ i, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    };
  }, [data]);

  // search → matching dictionary indices
  const { locMatch, cargoMatch } = useMemo(() => {
    if (!query) return { locMatch: null, cargoMatch: null };
    const q = norm(query);
    return {
      locMatch: locNorm.map((s) => s.includes(q)),
      cargoMatch: cargoNorm.map((s) => s.includes(q)),
    };
  }, [query, locNorm, cargoNorm]);

  const min = salMin ? Number(salMin) : null;
  const max = salMax ? Number(salMax) : null;

  // ---- core filter
  const filtered = useMemo(() => {
    const out: Row[] = [];
    for (const r of data.rows) {
      if (locId != null && r[COL.LOC] !== locId) continue;
      if (years.size && !years.has(r[COL.ANIO])) continue;
      if (months.size && !months.has(r[COL.MES])) continue;
      const s = r[COL.SUELDO];
      if (min != null && s < min) continue;
      if (max != null && s > max) continue;
      if (locMatch && !(locMatch[r[COL.LOC]] || cargoMatch![r[COL.CARGO]])) continue;
      out.push(r);
    }
    return out;
  }, [data.rows, locId, years, months, min, max, locMatch, cargoMatch]);

  // ---- KPIs
  const kpis = useMemo(() => {
    let total = 0;
    const locSet = new Set<number>();
    const cargoSet = new Set<number>();
    const periodSet = new Set<number>();
    const salaries: number[] = [];
    for (const r of filtered) {
      total += r[COL.SUELDO];
      salaries.push(r[COL.SUELDO]);
      locSet.add(r[COL.LOC]);
      cargoSet.add(r[COL.CARGO]);
      periodSet.add(periodKey(r[COL.ANIO], r[COL.MES]));
    }
    const count = filtered.length;
    const periods = periodSet.size || 1;
    return {
      count,
      total,
      monthlyAvg: total / periods,
      avg: count ? total / count : 0,
      median: median(salaries),
      locs: locSet.size,
      cargos: cargoSet.size,
    };
  }, [filtered]);

  // ---- time series (axis respects year/month filters; values from filtered set)
  const series: SeriesPoint[] = useMemo(() => {
    const axis = allPeriods.filter((k) => {
      const y = Math.floor(k / 100);
      const m = k % 100;
      return (!years.size || years.has(y)) && (!months.size || months.has(m));
    });
    const acc = new Map<number, { count: number; total: number }>();
    for (const r of filtered) {
      const k = periodKey(r[COL.ANIO], r[COL.MES]);
      const a = acc.get(k) ?? { count: 0, total: 0 };
      a.count++;
      a.total += r[COL.SUELDO];
      acc.set(k, a);
    }
    return axis.map((k) => {
      const a = acc.get(k) ?? { count: 0, total: 0 };
      return {
        key: k,
        label: periodLabel(Math.floor(k / 100), k % 100),
        count: a.count,
        total: a.total,
      };
    });
  }, [filtered, allPeriods, years, months]);

  // ---- rankings + distribution
  const topLocs = useMemo(
    () => rankBy(aggregateBy(filtered, COL.LOC), locMetric, 12),
    [filtered, locMetric],
  );
  const topCargos = useMemo(() => rankBy(aggregateBy(filtered, COL.CARGO), "total", 12), [filtered]);

  const histogram = useMemo(() => {
    const counts = new Array(SALARY_BUCKETS.length).fill(0);
    for (const r of filtered) counts[bucketOf(r[COL.SUELDO])]++;
    return SALARY_BUCKETS.map((b, i) => ({ label: b.label, count: counts[i] }));
  }, [filtered]);

  // ---- sorted rows for the table
  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    const cmp: Record<SortKey, (a: Row, b: Row) => number> = {
      sueldo: (a, b) => (a[COL.SUELDO] - b[COL.SUELDO]) * dir,
      periodo: (a, b) =>
        (periodKey(a[COL.ANIO], a[COL.MES]) - periodKey(b[COL.ANIO], b[COL.MES])) * dir,
      localidad: (a, b) =>
        data.localidades[a[COL.LOC]].localeCompare(data.localidades[b[COL.LOC]], "es") * dir,
      cargo: (a, b) => data.cargos[a[COL.CARGO]].localeCompare(data.cargos[b[COL.CARGO]], "es") * dir,
    };
    arr.sort(cmp[sortKey]);
    return arr;
  }, [filtered, sortKey, sortDir, data]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "sueldo" || key === "periodo" ? "desc" : "asc");
    }
  };

  const exportCsv = () => {
    const head = "Localidad,Cargo,Sueldo,Mes,Año\n";
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const body = sorted
      .map((r) =>
        [
          esc(data.localidades[r[COL.LOC]]),
          esc(data.cargos[r[COL.CARGO]]),
          r[COL.SUELDO],
          data.monthNames[r[COL.MES] - 1],
          r[COL.ANIO],
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([head + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nomina-filtrada.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters =
    !!query || locId != null || years.size > 0 || months.size > 0 || !!salMin || !!salMax;
  const reset = () => {
    setQueryInput("");
    setLocId(null);
    setYears(new Set());
    setMonths(new Set());
    setSalMin("");
    setSalMax("");
  };

  const metricFormat = locMetric === "total" ? formatCompactDOP : formatInt;

  return (
    <div className="space-y-5">
      {/* ---------- filter bar ---------- */}
      <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Buscar por localidad o cargo…"
              className="h-11 w-full rounded-full border border-hairline bg-slate-50 pl-10 pr-9 text-sm outline-none focus:border-emerald-400"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => setQueryInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                aria-label="Limpiar búsqueda"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </label>

          <select
            value={locId ?? ""}
            onChange={(e) => setLocId(e.target.value === "" ? null : Number(e.target.value))}
            className="h-11 rounded-full border border-hairline bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 lg:max-w-xs"
          >
            <option value="">Todas las localidades ({data.localidades.length})</option>
            {locOptions.map((o) => (
              <option key={o.i} value={o.i}>
                {o.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={salMin}
              onChange={(e) => setSalMin(e.target.value)}
              placeholder="Sueldo mín."
              className="h-11 w-28 rounded-full border border-hairline bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400"
            />
            <span className="text-ink-soft">–</span>
            <input
              type="number"
              inputMode="numeric"
              value={salMax}
              onChange={(e) => setSalMax(e.target.value)}
              placeholder="máx."
              className="h-11 w-24 rounded-full border border-hairline bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ChipGroup
            label="Año"
            options={allYears.map((y) => ({ value: y, label: String(y) }))}
            selected={years}
            onToggle={(v) => setYears(toggle(years, v))}
          />
          <span className="hidden h-5 w-px bg-hairline sm:block" />
          <ChipGroup
            label="Mes"
            options={MONTH_ABBR.map((m, i) => ({ value: i + 1, label: m }))}
            selected={months}
            onToggle={(v) => setMonths(toggle(months, v))}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              <IconX className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ---------- KPI cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={IconLayers} label="Registros (plaza-mes)" value={formatInt(kpis.count)} />
        <Kpi icon={IconCoins} label="Gasto mensual prom." value={formatCompactDOP(kpis.monthlyAvg)} />
        <Kpi icon={IconChartBar} label="Sueldo promedio" value={formatDOP(kpis.avg)} />
        <Kpi icon={IconTrendingUp} label="Sueldo mediano" value={formatDOP(kpis.median)} />
        <Kpi icon={IconMapPin} label="Localidades" value={formatInt(kpis.locs)} />
        <Kpi icon={IconBuilding} label="Cargos distintos" value={formatInt(kpis.cargos)} />
      </div>

      {/* ---------- view tabs ---------- */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-hairline bg-surface p-1">
          <TabBtn active={view === "resumen"} onClick={() => setView("resumen")} icon={IconChartBar}>
            Resumen
          </TabBtn>
          <TabBtn active={view === "tabla"} onClick={() => setView("tabla")} icon={IconLayers}>
            Tabla
          </TabBtn>
        </div>
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">{formatInt(kpis.count)}</span> de{" "}
          {formatInt(data.rows.length)} registros
        </p>
      </div>

      {view === "resumen" ? (
        <div className="space-y-5">
          <Card
            title="Evolución mensual"
            subtitle="Plazas activas y gasto total por mes (pasa el cursor por la serie)"
          >
            <TimeSeries points={series} />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card
              title="Top localidades"
              action={
                <div className="inline-flex rounded-full border border-hairline p-0.5 text-xs">
                  {(
                    [
                      ["total", "Gasto"],
                      ["count", "Plazas"],
                      ["avg", "Promedio"],
                    ] as [LocMetric, string][]
                  ).map(([m, lbl]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLocMetric(m)}
                      className={cn(
                        "rounded-full px-2.5 py-1 transition-colors",
                        locMetric === m ? "bg-brand-600 text-white" : "text-ink-soft hover:text-ink",
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              }
            >
              <BarList
                items={topLocs.map((g) => ({
                  id: g.key,
                  label: data.localidades[g.key],
                  value: locMetric === "total" ? g.total : locMetric === "count" ? g.count : g.avg,
                  sub: `${formatInt(g.count)} plazas`,
                }))}
                format={metricFormat}
                onSelect={(id) => {
                  setLocId(id);
                  setView("tabla");
                }}
                selectedId={locId}
              />
              <p className="mt-3 text-xs text-ink-soft">
                Clic en una localidad para filtrar la tabla.
              </p>
            </Card>

            <Card title="Top cargos por gasto">
              <BarList
                items={topCargos.map((g) => ({
                  id: g.key,
                  label: data.cargos[g.key],
                  value: g.total,
                  sub: `${formatInt(g.count)} · ${formatDOP(g.avg)} prom.`,
                }))}
                format={formatCompactDOP}
              />
            </Card>
          </div>

          <Card
            title="Distribución salarial"
            subtitle={`Sueldo mediano ${formatDOP(kpis.median)} · promedio ${formatDOP(kpis.avg)}`}
          >
            <Histogram bins={histogram} />
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Ordenado por <span className="font-medium text-ink">{sortLabel(sortKey)}</span> (
              {sortDir === "asc" ? "asc" : "desc"})
            </p>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
            >
              <IconDownload className="h-4 w-4" /> Exportar CSV
            </button>
          </div>
          <DataTable
            rows={sorted}
            localidades={data.localidades}
            cargos={data.cargos}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      )}

      <p className="pt-1 text-xs leading-relaxed text-ink-soft">
        Fuente: {data.source}. {formatInt(data.rows.length)} registros (plaza-mes) ·{" "}
        {data.localidades.length} localidades · {data.cargos.length} cargos · 35 meses (Jul 2023–May
        2026). Cada registro es una plaza en un mes; no hay nombres. Notas de calidad: meses
        normalizados (mayúsculas/espacios), 198 registros con sueldo en RD$0, estatus único “EMPLEADO
        FIJO”. Generado el {data.generatedAt}.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function rankBy(stats: GroupStat[], metric: LocMetric, n: number): GroupStat[] {
  const key = (g: GroupStat) =>
    metric === "total" ? g.total : metric === "count" ? g.count : g.avg;
  return stats.sort((a, b) => key(b) - key(a)).slice(0, n);
}

function toggle(set: Set<number>, v: number): Set<number> {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

function sortLabel(k: SortKey): string {
  return { localidad: "localidad", cargo: "cargo", sueldo: "sueldo", periodo: "período" }[k];
}

function Kpi({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-3.5 shadow-soft">
      <div className="flex items-center gap-1.5 text-ink-soft">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-xl font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand-600 text-white shadow-soft" : "text-ink-soft hover:text-ink",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: number; label: string }[];
  selected: Set<number>;
  onToggle: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {options.map((o) => {
        const on = selected.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? "bg-brand-600 text-white"
                : "bg-slate-50 text-ink-soft ring-1 ring-inset ring-hairline hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
