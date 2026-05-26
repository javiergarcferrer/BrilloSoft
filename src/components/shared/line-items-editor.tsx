"use client";

import { Plus, Trash2 } from "lucide-react";
import type { LineItem } from "@/lib/types";
import { cn, formatCurrency, lineTotal, uid } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/field";

export function LineItemsEditor({
  lines,
  onChange,
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
}) {
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const remove = (id: string) => onChange(lines.filter((l) => l.id !== id));
  const add = () =>
    onChange([
      ...lines,
      { id: uid("li"), description: "", quantity: 1, unitPrice: 0 },
    ]);

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[1fr_4.5rem_6.5rem_6rem_2rem] items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span>Descripción</span>
        <span className="text-center">Cant.</span>
        <span className="text-right">Precio unit.</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      {lines.map((l) => (
        <div
          key={l.id}
          className="relative rounded-xl border border-slate-200 p-3 sm:grid sm:grid-cols-[1fr_4.5rem_6.5rem_6rem_2rem] sm:items-center sm:gap-2 sm:border-0 sm:p-0"
        >
          <Input
            placeholder="Descripción del servicio"
            value={l.description}
            onChange={(e) => update(l.id, { description: e.target.value })}
          />
          <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-0 sm:contents">
            <label className="sm:contents">
              <span className="mb-1 block text-[11px] text-slate-400 sm:hidden">
                Cant.
              </span>
              <Input
                type="number"
                min={0}
                step="0.5"
                className="text-center"
                value={l.quantity}
                onChange={(e) =>
                  update(l.id, { quantity: Number(e.target.value) })
                }
              />
            </label>
            <label className="sm:contents">
              <span className="mb-1 block text-[11px] text-slate-400 sm:hidden">
                Precio unit.
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="text-right"
                value={l.unitPrice}
                onChange={(e) =>
                  update(l.id, { unitPrice: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 sm:mt-0 sm:justify-end sm:border-0 sm:pt-0">
            <span className="text-[11px] text-slate-400 sm:hidden">Total</span>
            <span className="text-sm font-semibold tabular-nums text-slate-800">
              {formatCurrency(lineTotal(l))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => remove(l.id)}
            className={cn(
              "absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 sm:static sm:justify-self-center",
            )}
            aria-label="Eliminar línea"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <Button variant="outline" size="sm" type="button" onClick={add}>
        <Plus className="size-4" />
        Agregar línea
      </Button>
    </div>
  );
}
