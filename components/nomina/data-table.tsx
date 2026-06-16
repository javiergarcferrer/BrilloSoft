"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { COL, formatDOP, formatInt, MONTH_ABBR, type Row } from "@/lib/nomina";

export type SortKey = "localidad" | "cargo" | "sueldo" | "periodo";
export type SortDir = "asc" | "desc";

const ROW_H = 40;
const VIEWPORT_H = 600;
const OVERSCAN = 12;

const GRID =
  "grid grid-cols-[3.5rem_minmax(0,2.2fr)_minmax(0,3fr)_7.5rem_5.5rem] gap-x-3";

export function DataTable({
  rows,
  localidades,
  cargos,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: Row[];
  localidades: string[];
  cargos: string[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const total = rows.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(total, Math.ceil((scrollTop + VIEWPORT_H) / ROW_H) + OVERSCAN);
  const visible = rows.slice(start, end);

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <div
        className={cn(
          GRID,
          "border-b border-hairline bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-soft",
        )}
      >
        <span className="text-right tabular-nums">#</span>
        <HeaderCell label="Localidad" col="localidad" {...{ sortKey, sortDir, onSort }} />
        <HeaderCell label="Cargo" col="cargo" {...{ sortKey, sortDir, onSort }} />
        <HeaderCell label="Sueldo" col="sueldo" align="right" {...{ sortKey, sortDir, onSort }} />
        <HeaderCell label="Período" col="periodo" align="right" {...{ sortKey, sortDir, onSort }} />
      </div>

      {total === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-ink-soft">
          No hay registros que coincidan con los filtros.
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{ height: VIEWPORT_H }}
          className="overflow-auto"
        >
          <div style={{ height: total * ROW_H, position: "relative" }}>
            <div style={{ transform: `translateY(${start * ROW_H}px)` }}>
              {visible.map((r, i) => {
                const idx = start + i;
                return (
                  <div
                    key={idx}
                    className={cn(
                      GRID,
                      "items-center px-4 text-sm",
                      idx % 2 ? "bg-surface" : "bg-slate-50/50",
                      "hover:bg-emerald-50",
                    )}
                    style={{ height: ROW_H }}
                  >
                    <span className="text-right tabular-nums text-xs text-ink-soft">
                      {formatInt(idx + 1)}
                    </span>
                    <span className="truncate text-ink" title={localidades[r[COL.LOC]]}>
                      {localidades[r[COL.LOC]]}
                    </span>
                    <span className="truncate text-ink-soft" title={cargos[r[COL.CARGO]]}>
                      {cargos[r[COL.CARGO]]}
                    </span>
                    <span className="text-right font-mono tabular-nums text-ink">
                      {formatDOP(r[COL.SUELDO])}
                    </span>
                    <span className="text-right tabular-nums text-ink-soft">
                      {MONTH_ABBR[r[COL.MES] - 1]} {r[COL.ANIO]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderCell({
  label,
  col,
  align = "left",
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  align?: "left" | "right";
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const activeSort = sortKey === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        "flex items-center gap-1 transition-colors hover:text-brand-700",
        align === "right" && "justify-end",
        activeSort && "text-brand-700",
      )}
    >
      {label}
      <SortGlyph active={activeSort} dir={sortDir} />
    </button>
  );
}

function SortGlyph({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {!active ? (
        <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
      ) : dir === "asc" ? (
        <path d="M6 14l6-6 6 6" />
      ) : (
        <path d="M6 10l6 6 6-6" />
      )}
    </svg>
  );
}
