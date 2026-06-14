"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Gavel,
  Layers,
  Percent,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORIAS,
  INSTITUCIONES,
  LICITACIONES,
} from "@/lib/licitaciones/data";
import {
  estadoMeta,
  formatMonto,
  formatMontoCompacto,
  getCategoria,
  getInstitucion,
} from "@/lib/licitaciones/utils";
import type { Estado } from "@/lib/licitaciones/types";

const toDop = (l: (typeof LICITACIONES)[number]) =>
  l.moneda === "USD" ? l.montoEstimado * 60 : l.montoEstimado;

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function AnalyticsCharts() {
  const data = useMemo(() => {
    const total = LICITACIONES.length;
    const valorTotal = LICITACIONES.reduce((s, l) => s + toDop(l), 0);
    const adjudicadas = LICITACIONES.filter((l) => l.adjudicacion);
    const valorAdjudicado = adjudicadas.reduce(
      (s, l) => s + (l.adjudicacion ? l.adjudicacion.monto * (l.moneda === "USD" ? 60 : 1) : 0),
      0,
    );

    const byInst = INSTITUCIONES.map((i) => ({
      label: i.sigla,
      nombre: i.nombre,
      value: LICITACIONES.filter((l) => l.institucionId === i.id).reduce(
        (s, l) => s + toDop(l),
        0,
      ),
    }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const byCat = CATEGORIAS.map((c) => ({
      label: c.nombre,
      value: LICITACIONES.filter((l) => l.categoriaId === c.id).length,
    }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    const estados: Estado[] = ["abierta", "por_cerrar", "cerrada", "adjudicada"];
    const byEstado = estados.map((e) => ({
      estado: e,
      value: LICITACIONES.filter((l) => l.estado === e).length,
    }));

    // Publications per month (last 8 months window present in data)
    const monthMap = new Map<string, number>();
    for (const l of LICITACIONES) {
      const d = new Date(l.publicada);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
    const byMes = [...monthMap.entries()]
      .map(([key, value]) => {
        const [y, m] = key.split("-").map(Number);
        return { y, m, value, label: `${MESES[m]} ${String(y).slice(2)}` };
      })
      .sort((a, b) => a.y - b.y || a.m - b.m);

    const topAdj = [...adjudicadas].sort(
      (a, b) => (b.adjudicacion?.monto ?? 0) - (a.adjudicacion?.monto ?? 0),
    );

    return {
      total,
      valorTotal,
      adjudicadas,
      valorAdjudicado,
      byInst,
      byCat,
      byEstado,
      byMes,
      topAdj,
    };
  }, []);

  const kpis = [
    { label: "Procesos analizados", value: `${data.total}`, icon: Layers },
    { label: "Valor total publicado", value: formatMontoCompacto(data.valorTotal), icon: TrendingUp },
    { label: "Adjudicaciones", value: `${data.adjudicadas.length}`, icon: Gavel },
    {
      label: "Tasa de adjudicación",
      value: `${Math.round((data.adjudicadas.length / data.total) * 100)}%`,
      icon: Percent,
    },
  ];

  const maxInst = Math.max(...data.byInst.map((x) => x.value));
  const maxCat = Math.max(...data.byCat.map((x) => x.value));
  const maxMes = Math.max(...data.byMes.map((x) => x.value));
  const totalEstado = data.byEstado.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-hairline">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <k.icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {k.value}
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monto por institución */}
        <Panel title="Valor publicado por institución" icon={Building2}>
          <div className="space-y-3.5">
            {data.byInst.map((row, i) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink" title={row.nombre}>
                    {row.label}
                  </span>
                  <span className="tabular-nums text-ink-soft">
                    {formatMontoCompacto(row.value)}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-soft">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(row.value / maxInst) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Procesos por categoría */}
        <Panel title="Procesos por categoría" icon={Layers}>
          <div className="space-y-3.5">
            {data.byCat.map((row, i) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-3 font-medium text-ink">{row.label}</span>
                  <span className="tabular-nums text-ink-soft">{row.value}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-soft">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(row.value / maxCat) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-brand-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Distribución por estado */}
        <Panel title="Distribución por estado" icon={Percent}>
          <div className="flex h-3.5 overflow-hidden rounded-full">
            {data.byEstado.map((row) => (
              <motion.div
                key={row.estado}
                initial={{ width: 0 }}
                whileInView={{ width: `${(row.value / totalEstado) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={cn(estadoMeta(row.estado).dot)}
                title={`${estadoMeta(row.estado).label}: ${row.value}`}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {data.byEstado.map((row) => (
              <div key={row.estado} className="flex items-center gap-2 text-sm">
                <span className={cn("h-2.5 w-2.5 rounded-full", estadoMeta(row.estado).dot)} />
                <span className="text-ink-soft">{estadoMeta(row.estado).label}</span>
                <span className="ml-auto font-semibold tabular-nums text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Publicaciones por mes */}
        <Panel title="Publicaciones por mes" icon={TrendingUp}>
          <div className="flex h-44 items-end gap-2">
            {data.byMes.map((row, i) => (
              <div key={`${row.y}-${row.m}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(row.value / maxMes) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-accent-400"
                    title={`${row.value} procesos`}
                  />
                </div>
                <span className="text-[11px] font-medium text-ink-soft">{row.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Ranking de adjudicaciones */}
      <Panel title="Mayores adjudicaciones" icon={Gavel}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink-soft">
              <tr className="border-b border-hairline">
                <th className="py-2 pr-4 font-semibold">Proveedor</th>
                <th className="hidden py-2 pr-4 font-semibold sm:table-cell">Institución</th>
                <th className="hidden py-2 pr-4 font-semibold md:table-cell">Categoría</th>
                <th className="py-2 text-right font-semibold">Monto adjudicado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.topAdj.map((l) => {
                const inst = getInstitucion(l.institucionId);
                const cat = getCategoria(l.categoriaId);
                return (
                  <tr key={l.id}>
                    <td className="py-3 pr-4">
                      <span className="block font-medium text-ink">
                        {l.adjudicacion?.proveedor}
                      </span>
                      <span className="text-xs text-ink-soft">RNC {l.adjudicacion?.rnc}</span>
                    </td>
                    <td className="hidden py-3 pr-4 text-ink-soft sm:table-cell">{inst?.sigla}</td>
                    <td className="hidden py-3 pr-4 text-ink-soft md:table-cell">{cat?.nombre}</td>
                    <td className="py-3 text-right font-semibold text-ink">
                      {formatMonto(l.adjudicacion!.monto, l.moneda)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon className="h-4 w-4 text-brand-600" />
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}
