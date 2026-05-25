"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClass = "bg-brand-50 text-brand-600",
  delta,
  footer,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconClass?: string;
  delta?: { value: string; positive?: boolean };
  footer?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-shadow hover:shadow-[var(--shadow-pop)]",
        highlight && "ring-2 ring-amber-300/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              delta.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600",
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          {value}
        </motion.p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>
      {footer && <div className="mt-3 text-xs text-slate-400">{footer}</div>}
    </Card>
  );
}
