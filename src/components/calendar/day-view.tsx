"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarPlus, Clock } from "lucide-react";
import { SERVICE_STATUS_META, teamColor } from "@/lib/colors";
import { getTeam, serviceAmount } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { TeamAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function DayView({
  current,
  services,
  onSelect,
  onAddOn,
}: {
  current: Date;
  services: Service[];
  onSelect: (id: string) => void;
  onAddOn: (date: string) => void;
}) {
  const teams = useStore((s) => s.teams);
  const dateStr = format(current, "yyyy-MM-dd");
  const dayServices = services
    .filter((s) => s.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div>
          <h3 className="font-semibold text-slate-900">
            {format(current, "EEEE", { locale: es })}
          </h3>
          <p className="text-sm text-slate-500">
            {format(current, "MMMM d, yyyy", { locale: es })}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onAddOn(dateStr)}>
          <CalendarPlus className="size-4" />
          Agregar
        </Button>
      </div>

      {dayServices.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Clock}
            title="Sin servicios este día"
            description="Toca “Agregar” para programar un servicio, o arrastra uno aquí desde otro día."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {dayServices.map((s) => {
            const team = getTeam(teams, s.teamId);
            const hex = team ? teamColor(team.colorKey).hex : "#cbd5e1";
            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/40 sm:px-5"
                >
                  <div className="w-14 shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums text-slate-800">
                      {s.startTime}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {Math.round(s.durationMin / 60)}h
                      {s.durationMin % 60 ? ` ${s.durationMin % 60}m` : ""}
                    </div>
                  </div>
                  <span
                    className="h-12 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {s.clientName}
                      </span>
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          SERVICE_STATUS_META[s.status].dot,
                          s.status === "in_progress" && "bs-pulse-dot",
                        )}
                        style={{ color: SERVICE_STATUS_META[s.status].hex }}
                      />
                    </div>
                    <div className="truncate text-sm text-slate-500">
                      {s.title}
                    </div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-3 sm:flex">
                    <StatusBadge meta={SERVICE_STATUS_META[s.status]} />
                    <span className="w-20 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(serviceAmount(s))}
                    </span>
                  </div>
                  <TeamAvatar team={team} size="sm" className="sm:hidden" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
