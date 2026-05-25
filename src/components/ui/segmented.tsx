"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: "sm" | "md";
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl bg-slate-100 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-lg font-medium transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${layoutId}`}
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
