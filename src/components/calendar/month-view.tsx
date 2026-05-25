"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useState } from "react";
import { SERVICE_STATUS_META } from "@/lib/colors";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ServiceChip } from "./service-chip";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({
  current,
  services,
  teamHexFor,
  onSelect,
  onAddOn,
  onMove,
  onOpenDay,
}: {
  current: Date;
  services: Service[];
  teamHexFor: (s: Service) => string | undefined;
  onSelect: (id: string) => void;
  onAddOn: (date: string) => void;
  onMove: (id: string, date: string) => void;
  onOpenDay: (date: string) => void;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  const gridStart = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDate = new Map<string, Service[]>();
  for (const s of services) {
    const arr = byDate.get(s.date) ?? [];
    arr.push(s);
    byDate.set(s.date, arr);
  }
  for (const arr of byDate.values())
    arr.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayServices = byDate.get(dateStr) ?? [];
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          const isDragOver = dragOver === dateStr;
          return (
            <div
              key={dateStr}
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
                "min-h-[4.75rem] cursor-pointer border-b border-r border-slate-100 p-1 transition-colors sm:min-h-[7rem] sm:p-1.5",
                !inMonth && "bg-slate-50/40",
                isDragOver && "bg-brand-50 ring-2 ring-inset ring-brand-400",
              )}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    today
                      ? "bg-brand-600 font-bold text-white"
                      : inMonth
                        ? "text-slate-700"
                        : "text-slate-300",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayServices.length > 0 && (
                  <span className="hidden text-[10px] font-medium text-slate-400 sm:inline">
                    {dayServices.length}
                  </span>
                )}
              </div>

              {/* Desktop: chips */}
              <div className="hidden flex-col gap-1 sm:flex">
                {dayServices.slice(0, 3).map((s) => (
                  <ServiceChip
                    key={s.id}
                    service={s}
                    teamHex={teamHexFor(s)}
                    onClick={() => onSelect(s.id)}
                  />
                ))}
                {dayServices.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDay(dateStr);
                    }}
                    className="rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                  >
                    +{dayServices.length - 3} more
                  </button>
                )}
              </div>

              {/* Mobile: status dots */}
              {dayServices.length > 0 && (
                <div
                  className="flex flex-wrap gap-1 sm:hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDay(dateStr);
                  }}
                >
                  {dayServices.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: SERVICE_STATUS_META[s.status].hex,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
