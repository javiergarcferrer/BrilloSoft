"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { inputBase } from "./field";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
}

type SortDir = "asc" | "desc";

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  initialSort,
  searchText,
  searchPlaceholder,
  filters,
  emptyState,
  rowAccent,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: SortDir };
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  emptyState?: React.ReactNode;
  /** optional left color bar per row (e.g. team color hex) */
  rowAccent?: (row: T) => string | undefined;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | undefined>(initialSort?.key);
  const [sortDir, setSortDir] = useState<SortDir>(initialSort?.dir ?? "asc");

  const filtered = useMemo(() => {
    if (!searchText || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, columns, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const hasToolbar = Boolean(searchText) || Boolean(filters);

  return (
    <div className="flex flex-col">
      {hasToolbar && (
        <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          {searchText ? (
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? "Search…"}
                className={cn(inputBase, "h-10 pl-9")}
              />
            </div>
          ) : (
            <span />
          )}
          {filters && (
            <div className="flex flex-wrap items-center gap-2">{filters}</div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.headerClassName,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-slate-800",
                          col.align === "right" && "flex-row-reverse",
                          active && "text-slate-900",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 text-slate-300" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const accent = rowAccent?.(row);
              return (
                <tr
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group border-b border-slate-50 transition-colors last:border-0",
                    onRowClick && "cursor-pointer hover:bg-brand-50/40",
                  )}
                >
                  {columns.map((col, ci) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-slate-700",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.className,
                      )}
                    >
                      {ci === 0 && accent ? (
                        <span className="flex items-center gap-2.5">
                          <span
                            className="h-7 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: accent }}
                          />
                          <span className="min-w-0">{col.render(row)}</span>
                        </span>
                      ) : (
                        col.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-8">
            {emptyState ?? (
              <p className="text-center text-sm text-slate-400">
                No results found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
