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
  periodLabel,
  SALARY_BUCKETS,
  type GroupStat,
  type NominaData,
  type Row,
} from "@/lib/nomina";
import { BarList, Histogram } from "./charts";
import { DataTable, type SortDir, type SortKey } from "./data-table";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type View = "resumen" | "tabla";
type Metric = "total" | "count" | "avg";
type IconType = React.ComponentType<{ className?: string }>;

export function Explorer() {
  const [data, setData] = useState<NominaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNomina().then(setData).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-hairline bg-surface p-6 text-sm text-ink-soft">
        {error}
      </p>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-6 text-sm text-ink-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
        Cargando la nómina consolidada…
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
  const [instId, setInstId] = useState<number | null>(null);
  const [salMin, setSalMin] = useState<string>("");
  const [salMax, setSalMax] = useState<string>("");

  // ---- raw-table sort
  const [sortKey, setSortKey] = useState<SortKey>("sueldo");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ---- ranking metric for instituciones/áreas
  const [metric, setMetric] = useState<Metric>("total");

  const { areaNorm, cargoNorm, instNorm } = useMemo(
    () => ({
      areaNorm: data.areas.map(norm),
      cargoNorm: data.cargos.map(norm),
      instNorm: data.instituciones.map((i) => norm(`${i.codigo} ${i.nombre}`)),
    }),
    [data],
  );

  // search → matching dictionary indices
  const { areaMatch, cargoMatch, instMatch } = useMemo(() => {
    if (!query) return { areaMatch: null, cargoMatch: null, instMatch: null };
    const q = norm(query);
    return {
      areaMatch: areaNorm.map((s) => s.includes(q)),
      cargoMatch: cargoNorm.map((s) => s.includes(q)),
      instMatch: instNorm.map((s) => s.includes(q)),
    };
  }, [query, areaNorm, cargoNorm, instNorm]);

  const min = salMin ? Number(salMin) : null;
  const max = salMax ? Number(salMax) : null;

  // ---- core filter
  const filtered = useMemo(() => {
    const out: Row[] = [];
    for (const r of data.rows) {
      if (instId != null && r[COL.INST] !== instId) continue;
      const s = r[COL.SUELDO];
      if (min != null && s < min) continue;
      if (max != null && s > max) continue;
      if (
        areaMatch &&
        !(areaMatch[r[COL.AREA]] || cargoMatch![r[COL.CARGO]] || instMatch![r[COL.INST]])
      ) {
        continue;
      }
      out.push(r);
    }
    return out;
  }, [data.rows, instId, min, max, areaMatch, cargoMatch, instMatch]);

  // ---- KPIs
  const kpis = useMemo(() => {
    let total = 0;
    const instSet = new Set<number>();
    const cargoSet = new Set<number>();
    const salaries: number[] = [];
    for (const r of filtered) {
      total += r[COL.SUELDO];
      salaries.push(r[COL.SUELDO]);
      instSet.add(r[COL.INST]);
      cargoSet.add(r[COL.CARGO]);
    }
    const count = filtered.length;
    return {
      count,
      total,
      avg: count ? total / count : 0,
      median: median(salaries),
      insts: instSet.size,
      cargos: cargoSet.size,
    };
  }, [filtered]);

  // ---- rankings + distribution
  const topInsts = useMemo(
    () => rankBy(aggregateBy(filtered, COL.INST), metric, 11),
    [filtered, metric],
  );
  const topAreas = useMemo(
    () => rankBy(aggregateBy(filtered, COL.AREA), "total", 12),
    [filtered],
  );
  const topCargos = useMemo(
    () => rankBy(aggregateBy(filtered, COL.CARGO), "total", 12),
    [filtered],
  );

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
      institucion: (a, b) =>
        data.instituciones[a[COL.INST]].codigo.localeCompare(
          data.instituciones[b[COL.INST]].codigo,
          "es",
        ) * dir,
      area: (a, b) =>
        data.areas[a[COL.AREA]].localeCompare(data.areas[b[COL.AREA]], "es") * dir,
      cargo: (a, b) =>
        data.cargos[a[COL.CARGO]].localeCompare(data.cargos[b[COL.CARGO]], "es") * dir,
    };
    arr.sort(cmp[sortKey]);
    return arr;
  }, [filtered, sortKey, sortDir, data]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "sueldo" ? "desc" : "asc");
    }
  };

  const exportCsv = () => {
    const head = "Institución,Área,Cargo,Sueldo,Período\n";
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const body = sorted
      .map((r) => {
        const inst = data.instituciones[r[COL.INST]];
        return [
          esc(inst.nombre),
          esc(data.areas[r[COL.AREA]]),
          esc(data.cargos[r[COL.CARGO]]),
          r[COL.SUELDO],
          `${data.monthNames[inst.mes - 1]} ${inst.anio}`,
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([head + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nomina-filtrada.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = !!query || instId != null || !!salMin || !!salMax;
  const reset = () => {
    setQueryInput("");
    setInstId(null);
    setSalMin("");
    setSalMax("");
  };

  const metricFormat = metric === "total" ? formatCompactDOP : formatInt;
  const instSel = instId != null ? data.instituciones[instId] : null;

  return (
    <div className="space-y-5">
      {/* ---------- filter bar ---------- */}
      <div className="rounded-lg border border-hairline bg-surface p-4  sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Buscar por institución, área o cargo…"
              className="h-11 w-full rounded-full border border-hairline bg-canvas pl-10 pr-9 text-sm outline-none focus:border-brand-400"
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
            value={instId ?? ""}
            onChange={(e) => setInstId(e.target.value === "" ? null : Number(e.target.value))}
            className="h-11 rounded-full border border-hairline bg-canvas px-4 text-sm outline-none focus:border-brand-400 lg:max-w-xs"
          >
            <option value="">Todas las instituciones ({data.instituciones.length})</option>
            {data.instituciones.map((o, i) => (
              <option key={o.codigo} value={i}>
                {o.nombre}
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
              className="h-11 w-28 rounded-full border border-hairline bg-canvas px-4 text-sm outline-none focus:border-brand-400"
            />
            <span className="text-ink-soft">–</span>
            <input
              type="number"
              inputMode="numeric"
              value={salMax}
              onChange={(e) => setSalMax(e.target.value)}
              placeholder="máx."
              className="h-11 w-24 rounded-full border border-hairline bg-canvas px-4 text-sm outline-none focus:border-brand-400"
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 lg:self-auto"
            >
              <IconX className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>

        {instSel && (
          <p className="mt-3 text-xs text-ink-soft">
            <span className="font-semibold text-ink">{instSel.nombre}</span> · foto de{" "}
            {data.monthNames[instSel.mes - 1]} {instSel.anio} ·{" "}
            {formatInt(instSel.plazas)} plazas
          </p>
        )}
      </div>

      {/* ---------- KPI cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={IconLayers} label="Plazas" value={formatInt(kpis.count)} />
        <Kpi icon={IconCoins} label="Masa salarial mensual" value={formatCompactDOP(kpis.total)} />
        <Kpi icon={IconChartBar} label="Sueldo promedio" value={formatDOP(kpis.avg)} />
        <Kpi icon={IconTrendingUp} label="Sueldo mediano" value={formatDOP(kpis.median)} />
        <Kpi icon={IconBuilding} label="Instituciones" value={formatInt(kpis.insts)} />
        <Kpi icon={IconMapPin} label="Cargos distintos" value={formatInt(kpis.cargos)} />
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
          {formatInt(data.rows.length)} plazas
        </p>
      </div>

      {view === "resumen" ? (
        <div className="space-y-5">
          <Card
            title="Instituciones"
            subtitle="Cada institución aporta su último mes publicado (clic para filtrar)"
            action={
              <div className="inline-flex rounded-full border border-hairline p-0.5 text-xs">
                {(
                  [
                    ["total", "Masa"],
                    ["count", "Plazas"],
                    ["avg", "Promedio"],
                  ] as [Metric, string][]
                ).map(([m, lbl]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetric(m)}
                    className={cn(
                      "rounded-full px-2.5 py-1 transition-colors",
                      metric === m ? "bg-brand-600 text-white" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            }
          >
            <BarList
              items={topInsts.map((g) => {
                const inst = data.instituciones[g.key];
                return {
                  id: g.key,
                  label: inst.nombre,
                  value: metric === "total" ? g.total : metric === "count" ? g.count : g.avg,
                  sub: `${formatInt(g.count)} plazas · ${periodLabel(inst.anio, inst.mes)}`,
                };
              })}
              format={metricFormat}
              onSelect={(id) => setInstId(id === instId ? null : id)}
              selectedId={instId}
            />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Top áreas por gasto">
              <BarList
                items={topAreas.map((g) => ({
                  id: g.key,
                  label: data.areas[g.key],
                  value: g.total,
                  sub: `${formatInt(g.count)} plazas`,
                }))}
                format={formatCompactDOP}
              />
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
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white  transition-colors hover:bg-brand-700"
            >
              <IconDownload className="h-4 w-4" /> Exportar CSV
            </button>
          </div>
          <DataTable
            rows={sorted}
            instituciones={data.instituciones}
            areas={data.areas}
            cargos={data.cargos}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      )}

      <p className="pt-1 text-xs leading-relaxed text-ink-soft">
        Foto transversal: el último mes publicado por cada una de las{" "}
        {data.instituciones.length} instituciones cubiertas ({formatInt(data.rows.length)}{" "}
        plazas). Cada fila es una plaza con su sueldo bruto; no hay nombres ni datos
        personales. La cobertura es la que cada institución publica en formato
        procesable — <span className="font-medium text-ink">no es todo el Estado</span>;
        el detalle completo con nombres vive en el{" "}
        <a
          href="https://transparencia.gob.do/2025/12/17/nomina/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-700 hover:underline"
        >
          tablero oficial del Portal Único de Transparencia
        </a>
        . Generado el {data.generatedAt}; fuentes y método en{" "}
        <code className="rounded bg-canvas px-1 py-0.5 font-mono">scripts/build-nomina.py</code>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function rankBy(stats: GroupStat[], metric: Metric, n: number): GroupStat[] {
  const key = (g: GroupStat) =>
    metric === "total" ? g.total : metric === "count" ? g.count : g.avg;
  return stats.sort((a, b) => key(b) - key(a)).slice(0, n);
}

function sortLabel(k: SortKey): string {
  return { institucion: "institución", area: "área", cargo: "cargo", sueldo: "sueldo" }[k];
}

function Kpi({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3.5 ">
      <div className="flex items-center gap-1.5 text-ink-soft">
        <Icon className="h-3.5 w-3.5" />
        <span className="rotulo">{label}</span>
      </div>
      <p className="font-mono mt-1.5 font-display text-xl text-ink tabular-nums">{value}</p>
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
    <section className="rounded-lg border border-hairline bg-surface p-4  sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink">{title}</h2>
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
        active ? "bg-brand-600 text-white " : "text-ink-soft hover:text-ink",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
