"use client";

import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
  hex?: string;
  count?: number;
}

export function FilterChips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ChipOption[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
            )}
          >
            {o.hex && (
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: o.hex }}
              />
            )}
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-100 text-slate-400",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
