"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
      <Card className="p-6 text-sm text-ink-soft">{error}</Card>
    );
  }
  if (!data) {
    // La silueta del explorador —barra de filtros y seis indicadores— en
    // lugar de un rótulo suelto: el contenido cae en su sitio sin mover nada.
    return (
      <div role="status" aria-busy="true" className="space-y-5">
        <span className="sr-only">Cargando la nómina consolidada…</span>
        {/*
          Las alturas son las del contenido real a cada ancho: hasta `lg` la
          barra de filtros apila tres controles de 44 px (188 px) y solo en una
          sola fila mide 76; cada indicador crece cuando su rótulo se parte en
          dos líneas, que es lo normal a 390 px. Con las alturas de escritorio
          la página daba un tirón de media pantalla al llegar el JSON.
        */}
        <Skeleton className="h-[188px] rounded-lg border border-hairline bg-surface lg:h-20" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-[123px] rounded-lg border border-hairline bg-surface lg:h-28"
            />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-11 w-56 rounded-lg bg-hairline/70" />
          <Skeleton className="h-4 w-40 bg-hairline/70" />
        </div>
        <Skeleton className="h-[845px] rounded-lg border border-hairline bg-surface lg:h-[36rem]" />
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

  // Los controles responden al toque; el barrido de miles de filas va detrás,
  // en una prioridad menor, y el teclado nunca se queda esperando al filtro.
  const instFiltro = useDeferredValue(instId);
  const salMinFiltro = useDeferredValue(salMin);
  const salMaxFiltro = useDeferredValue(salMax);
  const min = salMinFiltro ? Number(salMinFiltro) : null;
  const max = salMaxFiltro ? Number(salMaxFiltro) : null;

  // ---- core filter
  const filtered = useMemo(() => {
    const out: Row[] = [];
    for (const r of data.rows) {
      if (instFiltro != null && r[COL.INST] !== instFiltro) continue;
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
  }, [data.rows, instFiltro, min, max, areaMatch, cargoMatch, instMatch]);

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
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar por institución, área o cargo</span>
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Buscar por institución, área o cargo…"
              className="bg-canvas pl-10 pr-9"
            />
            {queryInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setQueryInput("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-ink-soft"
              >
                <IconX className="h-4 w-4" />
                <span className="sr-only">Limpiar búsqueda</span>
              </Button>
            )}
          </label>

          <Select
            value={instId === null ? "todas" : String(instId)}
            onValueChange={(v) => setInstId(v === "todas" ? null : Number(v))}
          >
            <SelectTrigger
              aria-label="Filtrar por institución"
              className="bg-canvas lg:max-w-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">
                Todas las instituciones ({data.instituciones.length})
              </SelectItem>
              {data.instituciones.map((o, i) => (
                <SelectItem key={o.codigo} value={String(i)} ayuda={o.codigo}>
                  {o.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/*
            En teléfono los dos campos de sueldo reparten el ancho entero: con
            anchos fijos de 28 y 24 dejaban un tercio de la fila en blanco y
            parecían un resto de la versión de escritorio. Desde `lg`, donde la
            barra vuelve a ser una sola fila, recuperan su medida corta.
          */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              value={salMin}
              onChange={(e) => setSalMin(e.target.value)}
              placeholder="Sueldo mín."
              aria-label="Sueldo mínimo"
              className="w-full bg-canvas lg:w-28"
            />
            <span aria-hidden className="shrink-0 text-ink-soft">
              –
            </span>
            <Input
              type="number"
              inputMode="numeric"
              value={salMax}
              onChange={(e) => setSalMax(e.target.value)}
              placeholder="máx."
              aria-label="Sueldo máximo"
              className="w-full bg-canvas lg:w-24"
            />
          </div>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={reset}
              className="self-start text-brand-700 lg:self-auto"
            >
              <IconX className="h-4 w-4" /> Limpiar
            </Button>
          )}
        </div>

        {instSel && (
          <p className="mt-3 text-xs text-ink-soft">
            <span className="font-semibold text-ink">{instSel.nombre}</span> · foto de{" "}
            {data.monthNames[instSel.mes - 1]} {instSel.anio} ·{" "}
            {formatInt(instSel.plazas)} plazas
          </p>
        )}
      </Card>

      {/* ---------- KPI cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi
          icon={IconLayers}
          label="Plazas"
          value={formatInt(kpis.count)}
          base={`de ${formatInt(data.rows.length)} en la foto`}
        />
        <Kpi
          icon={IconCoins}
          label="Masa salarial mensual"
          value={formatCompactDOP(kpis.total)}
          base="último mes publicado por cada institución"
        />
        <Kpi icon={IconChartBar} label="Sueldo promedio" value={formatDOP(kpis.avg)} base="bruto mensual" />
        <Kpi icon={IconTrendingUp} label="Sueldo mediano" value={formatDOP(kpis.median)} base="bruto mensual" />
        <Kpi
          icon={IconBuilding}
          label="Instituciones"
          value={formatInt(kpis.insts)}
          base="con nómina publicada y legible"
        />
        <Kpi icon={IconMapPin} label="Cargos distintos" value={formatInt(kpis.cargos)} />
      </div>

      {/* ---------- vistas ---------- */}
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        {/*
          A 390 px las dos pestañas y el conteo no caben en una fila: el conteo
          se partía en dos renglones pegado al borde de la última pestaña. Con
          `flex-wrap` baja entero a su propia línea y las pestañas quedan
          intactas.
        */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <TabsList className="w-auto">
            <TabsTrigger value="resumen">
              <IconChartBar className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="tabla">
              <IconLayers className="h-4 w-4" />
              Tabla
            </TabsTrigger>
          </TabsList>
          {/*
            El conteo cambia sin navegar —cada tecla del buscador lo mueve—, así
            que vive en una región cortés: quien no ve la pantalla se entera de
            que su filtro recortó a 412 plazas.
          */}
          <p aria-live="polite" className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{formatInt(kpis.count)}</span> de{" "}
            {formatInt(data.rows.length)} plazas
          </p>
        </div>

        <TabsContent value="resumen" className="space-y-5">
          <Panel
            title="Instituciones"
            subtitle="Cada institución aporta su último mes publicado (clic para filtrar)"
            action={
              <ToggleGroup
                type="single"
                value={metric}
                onValueChange={(v) => v && setMetric(v as Metric)}
                aria-label="Qué se mide en el ranking"
                className="p-0.5"
              >
                {(
                  [
                    ["total", "Masa"],
                    ["count", "Plazas"],
                    ["avg", "Promedio"],
                  ] as [Metric, string][]
                ).map(([m, lbl]) => (
                  /*
                    El control segmentado se queda en los 36 px de la primitiva
                    en escritorio, pero en teléfono es el único modo de cambiar
                    lo que mide el ranking: sube a 44 px, que es el objetivo
                    táctil, y ensancha el relleno para acompañarlo.
                  */
                  <ToggleGroupItem
                    key={m}
                    value={m}
                    className="min-h-11 px-3 text-xs sm:min-h-9 sm:px-2.5"
                  >
                    {lbl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
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
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Top áreas por gasto">
              <BarList
                items={topAreas.map((g) => ({
                  id: g.key,
                  label: data.areas[g.key],
                  value: g.total,
                  sub: `${formatInt(g.count)} plazas`,
                }))}
                format={formatCompactDOP}
              />
            </Panel>

            <Panel title="Top cargos por gasto">
              <BarList
                items={topCargos.map((g) => ({
                  id: g.key,
                  label: data.cargos[g.key],
                  value: g.total,
                  sub: `${formatInt(g.count)} · ${formatDOP(g.avg)} prom.`,
                }))}
                format={formatCompactDOP}
              />
            </Panel>
          </div>

          <Panel
            title="Distribución salarial"
            subtitle={`Sueldo mediano ${formatDOP(kpis.median)} · promedio ${formatDOP(kpis.avg)}`}
          >
            <Histogram bins={histogram} />
          </Panel>
        </TabsContent>

        <TabsContent value="tabla" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Ordenado por <span className="font-medium text-ink">{sortLabel(sortKey)}</span> (
              {sortDir === "asc" ? "asc" : "desc"})
            </p>
            <Button type="button" onClick={exportCsv}>
              <IconDownload className="h-4 w-4" /> Exportar CSV
            </Button>
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
        </TabsContent>
      </Tabs>

      {/* La declaración de cobertura es lectura, no metadato: 13 px en teléfono. */}
      <p className="pt-1 text-[13px] leading-relaxed text-ink-soft sm:text-xs">
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

/**
 * Un KPI de nómina con **su base debajo de la cifra**.
 *
 * «Masa salarial mensual» es la suma del último mes publicado por cada
 * institución: meses distintos sumados en un solo peso. Esa advertencia vivía
 * al final de la página, después de dos rejillas de gráficos, y nadie asocia
 * una nota al pie con un número que leyó tres pantallas antes.
 */
function Kpi({
  icon: Icon,
  label,
  value,
  base,
}: {
  icon: IconType;
  label: string;
  value: string;
  base?: string;
}) {
  return (
    <Card className="p-3.5">
      {/*
        El icono se alinea con la primera línea del rótulo, no con su centro:
        a 390 px «MASA SALARIAL MENSUAL» ocupa dos líneas y el icono centrado
        quedaba flotando entre las dos.
      */}
      <div className="flex items-start gap-1.5 text-ink-soft">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="rotulo">{label}</span>
      </div>
      <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-ink">{value}</p>
      {/* La base de la cifra no es adorno: a 11 px no se lee en un teléfono. */}
      {base && <p className="mt-1 text-xs leading-snug text-ink-soft">{base}</p>}
    </Card>
  );
}

/**
 * Un panel del explorador: cabecera con título, subtítulo y su control a la
 * derecha. Es `Card` de `components/ui` con el título en serif, que es lo que
 * la identidad reserva a un titular de sección grande — un título de panel de
 * 14 px iría en sans.
 */
function Panel({
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
    <Card>
      <CardHeader className="items-start px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <CardTitle className="font-display text-lg">{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-5">{children}</CardContent>
    </Card>
  );
}
