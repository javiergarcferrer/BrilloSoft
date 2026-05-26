"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  SERVICE_STATUS_META,
  SERVICE_STATUS_ORDER,
  teamColor,
} from "@/lib/colors";
import { useStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { toastSuccess } from "@/components/ui/toast";
import { NewServiceDrawer } from "@/components/services/new-service-drawer";
import { ServiceDrawer } from "@/components/services/service-drawer";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";

type ViewMode = "month" | "week" | "day";

export function CalendarView() {
  const hydrated = useHydrated();
  const services = useStore((s) => s.services);
  const teams = useStore((s) => s.teams);
  const moveService = useStore((s) => s.moveService);

  const [view, setView] = useState<ViewMode>("month");
  const [current, setCurrent] = useState<Date>(() => new Date());
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const teamHexById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) map.set(t.id, teamColor(t.colorKey).hex);
    return map;
  }, [teams]);
  const teamHexFor = (s: Service) =>
    s.teamId ? teamHexById.get(s.teamId) : undefined;

  const filtered = useMemo(
    () =>
      services.filter((s) => {
        if (teamFilter === "unassigned" && s.teamId) return false;
        if (
          teamFilter !== "all" &&
          teamFilter !== "unassigned" &&
          s.teamId !== teamFilter
        )
          return false;
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        return true;
      }),
    [services, teamFilter, statusFilter],
  );

  const unassigned = useMemo(
    () =>
      services
        .filter((s) => s.status === "unassigned")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [services],
  );

  const periodLabel = (() => {
    if (view === "month") return format(current, "MMMM yyyy", { locale: es });
    if (view === "day") return format(current, "EEEE, MMM d", { locale: es });
    const ws = startOfWeek(current, { weekStartsOn: 1 });
    const we = endOfWeek(current, { weekStartsOn: 1 });
    return isSameMonth(ws, we)
      ? `${format(ws, "MMM d", { locale: es })} – ${format(we, "d", { locale: es })}`
      : `${format(ws, "MMM d", { locale: es })} – ${format(we, "MMM d", { locale: es })}`;
  })();

  const step = (dir: number) => {
    if (view === "month") setCurrent((c) => addMonths(c, dir));
    else if (view === "week") setCurrent((c) => addWeeks(c, dir));
    else setCurrent((c) => addDays(c, dir));
  };

  const openNew = (date?: string) => {
    setNewDate(date);
    setNewOpen(true);
  };
  const handleMove = (id: string, date: string) => {
    moveService(id, date);
    toastSuccess("Reprogramado", format(parseISO(date), "EEE, MMM d", { locale: es }));
  };
  const openDay = (date: string) => {
    setCurrent(parseISO(date));
    setView("day");
  };

  const teamOptions = [
    { value: "all", label: "Todos los equipos" },
    ...teams.map((t) => ({
      value: t.id,
      label: t.name,
      hex: teamColor(t.colorKey).hex,
    })),
    { value: "unassigned", label: "Sin asignar", hex: "#f59e0b" },
  ];
  const statusOptions = [
    { value: "all", label: "Todos" },
    ...SERVICE_STATUS_ORDER.map((s) => ({
      value: s,
      label: SERVICE_STATUS_META[s].label,
      hex: SERVICE_STATUS_META[s].hex,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Calendario"
        description="Organiza los equipos en servicios puntuales y recurrentes."
        actions={
          <>
            <Link
              href="/teams"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Equipos</span>
            </Link>
            <Button onClick={() => openNew(format(current, "yyyy-MM-dd"))}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo servicio</span>
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200">
            <button
              onClick={() => step(-1)}
              className="rounded-l-xl p-2 text-slate-500 transition-colors hover:bg-slate-50"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setCurrent(new Date())}
              className="border-x border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Hoy
            </button>
            <button
              onClick={() => step(1)}
              className="rounded-r-xl p-2 text-slate-500 transition-colors hover:bg-slate-50"
              aria-label="Siguiente"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            {periodLabel}
          </h2>
        </div>
        <Segmented<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: "month", label: "Mes" },
            { value: "week", label: "Semana" },
            { value: "day", label: "Día" },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 overflow-x-auto">
        <FilterChips
          value={teamFilter}
          onChange={setTeamFilter}
          options={teamOptions}
        />
        <FilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
      </div>

      {/* Unassigned worklist */}
      {hydrated && unassigned.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="size-2 rounded-full bg-amber-500" />
            <p className="text-sm font-semibold text-amber-900">
              Necesitan equipo · {unassigned.length}
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {unassigned.map((s) => (
              <button
                key={s.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", s.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => setSelectedId(s.id)}
                className="flex w-48 shrink-0 cursor-grab flex-col gap-0.5 rounded-xl border border-amber-200 bg-white p-2.5 text-left transition-shadow hover:shadow-sm active:cursor-grabbing"
              >
                <span className="truncate text-sm font-semibold text-slate-900">
                  {s.clientName}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {s.title}
                </span>
                <span className="mt-1 text-xs font-medium text-amber-700">
                  {format(parseISO(s.date), "EEE, MMM d", { locale: es })} · {s.startTime}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calendar surface */}
      {!hydrated ? (
        <Skeleton className="h-[32rem] w-full" />
      ) : view === "month" ? (
        <MonthView
          current={current}
          services={filtered}
          teamHexFor={teamHexFor}
          onSelect={setSelectedId}
          onAddOn={openNew}
          onMove={handleMove}
          onOpenDay={openDay}
        />
      ) : view === "week" ? (
        <WeekView
          current={current}
          services={filtered}
          teamHexFor={teamHexFor}
          onSelect={setSelectedId}
          onAddOn={openNew}
          onMove={handleMove}
        />
      ) : (
        <DayView
          current={current}
          services={filtered}
          onSelect={setSelectedId}
          onAddOn={openNew}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs text-slate-500">
        {SERVICE_STATUS_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: SERVICE_STATUS_META[s].hex }}
            />
            {SERVICE_STATUS_META[s].label}
          </span>
        ))}
        <span className="text-slate-300">·</span>
        <span>Barra izquierda = color del equipo</span>
      </div>

      <ServiceDrawer
        serviceId={selectedId}
        onClose={() => setSelectedId(null)}
      />
      <NewServiceDrawer
        open={newOpen}
        defaultDate={newDate}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}
