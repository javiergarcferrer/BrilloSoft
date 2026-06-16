"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDOP, formatInt } from "@/lib/nomina";

export type SeriesPoint = {
  key: number;
  label: string;
  count: number;
  total: number;
};

/**
 * Monthly time series: bars = headcount (plazas), line = gasto total.
 * Hovering a month updates the readout above the chart and a vertical guide.
 */
export function TimeSeries({ points }: { points: SeriesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 880;
  const H = 300;
  const pad = { t: 16, r: 16, b: 34, l: 16 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const n = points.length;
  const maxCount = Math.max(1, ...points.map((p) => p.count));
  const maxTotal = Math.max(1, ...points.map((p) => p.total));

  const step = n > 0 ? plotW / n : plotW;
  const barW = Math.max(2, step * 0.62);

  const x = (i: number) => pad.l + step * i + step / 2;
  const yCount = (v: number) => pad.t + plotH - (v / maxCount) * plotH;
  const yTotal = (v: number) => pad.t + plotH - (v / maxTotal) * plotH;

  const active = hover != null ? points[hover] : points[n - 1];

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yTotal(p.total).toFixed(1)}`)
    .join(" ");

  const labelEvery = Math.ceil(n / 12);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-4 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-300" /> Plazas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-gold-500" /> Gasto total
          </span>
        </div>
        {active && (
          <div className="text-right text-sm">
            <span className="font-semibold text-ink">{active.label}</span>
            <span className="text-ink-soft">
              {" · "}
              {formatInt(active.count)} plazas{" · "}
              <span className="font-medium text-brand-700">
                {formatDOP(active.total)}
              </span>
            </span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Serie mensual de plazas y gasto total"
      >
        {/* baseline */}
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={pad.t + plotH}
          y2={pad.t + plotH}
          stroke="var(--color-hairline)"
        />
        {points.map((p, i) => {
          const isActive = (hover ?? n - 1) === i;
          return (
            <g key={p.key}>
              {/* headcount bar */}
              <rect
                x={x(i) - barW / 2}
                y={yCount(p.count)}
                width={barW}
                height={pad.t + plotH - yCount(p.count)}
                rx={2}
                className={cn(
                  "transition-colors",
                  isActive ? "fill-brand-500" : "fill-brand-200",
                )}
              />
              {/* x label */}
              {i % labelEvery === 0 && (
                <text
                  x={x(i)}
                  y={H - 12}
                  textAnchor="middle"
                  className="fill-ink-soft"
                  fontSize={11}
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {/* total payroll line */}
        <path d={linePath} fill="none" stroke="var(--color-gold-500)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle
            key={p.key}
            cx={x(i)}
            cy={yTotal(p.total)}
            r={(hover ?? n - 1) === i ? 4 : 2.5}
            className="fill-gold-500"
          />
        ))}

        {/* hover guide + capture rects */}
        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.t}
            y2={pad.t + plotH}
            stroke="var(--color-brand-400)"
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )}
        {points.map((p, i) => (
          <rect
            key={p.key}
            x={pad.l + step * i}
            y={pad.t}
            width={step}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <title>
              {p.label}: {formatInt(p.count)} plazas · {formatDOP(p.total)}
            </title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

export type BarItem = {
  id: number;
  label: string;
  value: number;
  sub?: string;
};

/** Horizontal ranked bars (top localidades / cargos). Rows are clickable. */
export function BarList({
  items,
  format = formatInt,
  onSelect,
  selectedId,
}: {
  items: BarItem[];
  format?: (n: number) => string;
  onSelect?: (id: number) => void;
  selectedId?: number | null;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-1.5">
      {items.map((it) => {
        const pct = (it.value / max) * 100;
        const selected = selectedId === it.id;
        const Tag = onSelect ? "button" : "div";
        return (
          <li key={it.id}>
            <Tag
              {...(onSelect
                ? { type: "button" as const, onClick: () => onSelect(it.id) }
                : {})}
              className={cn(
                "group relative block w-full overflow-hidden rounded-lg px-3 py-2 text-left",
                onSelect && "cursor-pointer hover:ring-1 hover:ring-brand-300",
                selected ? "ring-1 ring-brand-500" : "",
              )}
              title={it.label}
            >
              <span
                className="absolute inset-y-0 left-0 bg-brand-100/80 transition-[width]"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
              <span className="relative flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {it.label}
                  {it.sub && (
                    <span className="ml-2 text-xs text-ink-soft">{it.sub}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-sm font-medium text-brand-800">
                  {format(it.value)}
                </span>
              </span>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}

/** Vertical histogram for the salary distribution. */
export function Histogram({
  bins,
}: {
  bins: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <div className="flex h-48 items-end gap-2">
      {bins.map((b) => {
        const pct = (b.count / max) * 100;
        return (
          <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-brand-400 transition-[height] hover:bg-brand-500"
                style={{ height: `${Math.max(pct, 1)}%` }}
                title={`${b.label}: ${formatInt(b.count)} plazas`}
              />
            </div>
            <div className="mt-1.5 text-center text-[11px] leading-tight text-ink-soft">
              {b.label}
            </div>
            <div className="text-[11px] font-medium text-ink">
              {formatCompactCount(b.count)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCompactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
