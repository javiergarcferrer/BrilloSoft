"use client";

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ServiceChip } from "./service-chip";

export function WeekView({
  current,
  services,
  teamHexFor,
  onSelect,
  onAddOn,
  onMove,
}: {
  current: Date;
  services: Service[];
  teamHexFor: (s: Service) => string | undefined;
  onSelect: (id: string) => void;
  onAddOn: (date: string) => void;
  onMove: (id: string, date: string) => void;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const days = eachDayOfInterval({
    start: startOfWeek(current, { weekStartsOn: 1 }),
    end: endOfWeek(current, { weekStartsOn: 1 }),
  });

  const byDate = new Map<string, Service[]>();
  for (const s of services) {
    const arr = byDate.get(s.date) ?? [];
    arr.push(s);
    byDate.set(s.date, arr);
  }
  for (const arr of byDate.values())
    arr.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className="grid min-w-[46rem] grid-cols-7">
        {days.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayServices = byDate.get(dateStr) ?? [];
          const today = isToday(day);
          const isDragOver = dragOver === dateStr;
          return (
            <div
              key={dateStr}
              className={cn("border-slate-100", i < 6 && "border-r")}
            >
              <div
                className={cn(
                  "sticky top-0 z-10 border-b border-slate-100 bg-white px-2 py-2 text-center",
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                    today ? "bg-brand-600 text-white" : "text-slate-700",
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
              <div
                onClick={() => onAddOn(dateStr)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(dateStr);
                }}
                onDragLeave={() =>
                  setDragOver((d) => (d === dateStr ? null : d))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) onMove(id, dateStr);
                  setDragOver(null);
                }}
                className={cn(
                  "group flex min-h-[18rem] cursor-pointer flex-col gap-1 p-1.5 transition-colors",
                  isDragOver && "bg-brand-50 ring-2 ring-inset ring-brand-400",
                )}
              >
                {dayServices.map((s) => (
                  <ServiceChip
                    key={s.id}
                    service={s}
                    teamHex={teamHexFor(s)}
                    onClick={() => onSelect(s.id)}
                  />
                ))}
                <span className="mt-1 hidden items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium text-slate-300 group-hover:flex">
                  <Plus className="size-3" /> Add
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
