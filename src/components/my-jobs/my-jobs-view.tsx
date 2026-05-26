"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Camera,
  Check,
  ClipboardList,
  Clock,
  MapPin,
  PenLine,
  Play,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { usePermissions } from "@/hooks/use-permissions";
import { SERVICE_STATUS_META } from "@/lib/colors";
import { getTeam } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/field";
import { toastSuccess } from "@/components/ui/toast";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

export function MyJobsView() {
  const hydrated = useHydrated();
  const { user } = usePermissions();
  const services = useStore((s) => s.services);
  const teams = useStore((s) => s.teams);
  const setStatus = useStore((s) => s.setServiceStatus);
  const updateService = useStore((s) => s.updateService);

  const [tab, setTab] = useState("today");

  const teamId = user?.teamId;
  const team = getTeam(teams, teamId);

  const mine = useMemo(
    () => services.filter((s) => (teamId ? s.teamId === teamId : !!s.teamId)),
    [services, teamId],
  );

  const today = todayStr();
  const filtered = useMemo(() => {
    const list = mine.filter((s) => {
      if (tab === "today") return s.date === today;
      if (tab === "upcoming")
        return s.date > today && s.status !== "cancelled";
      if (tab === "done") return s.status === "completed";
      return true;
    });
    return list.sort((a, b) =>
      (a.date + a.startTime).localeCompare(b.date + b.startTime),
    );
  }, [mine, tab, today]);

  const counts = {
    today: mine.filter((s) => s.date === today).length,
    upcoming: mine.filter((s) => s.date > today && s.status !== "cancelled")
      .length,
    done: mine.filter((s) => s.status === "completed").length,
  };

  return (
    <div>
      <PageHeader
        title="Mis trabajos"
        description={
          team
            ? `Servicios asignados a ${team.name}.`
            : "Servicios asignados a tu equipo."
        }
      />

      {!hydrated ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <FilterChips
              value={tab}
              onChange={setTab}
              options={[
                { value: "today", label: "Hoy", count: counts.today },
                { value: "upcoming", label: "Próximos", count: counts.upcoming },
                { value: "done", label: "Completados", count: counts.done },
                { value: "all", label: "Todos", count: mine.length },
              ]}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nada por aquí"
              description="No tienes servicios en esta vista."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <JobCard
                  key={s.id}
                  service={s}
                  onStart={() => {
                    setStatus(s.id, "in_progress");
                    toastSuccess("Servicio iniciado", s.clientName);
                  }}
                  onComplete={() => {
                    setStatus(s.id, "completed");
                    toastSuccess(
                      "Servicio completado",
                      "Enviado a contabilidad para registro.",
                    );
                  }}
                  onObservations={(notes) =>
                    updateService(s.id, { notes })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({
  service,
  onStart,
  onComplete,
  onObservations,
}: {
  service: Service;
  onStart: () => void;
  onComplete: () => void;
  onObservations: (notes: string) => void;
}) {
  const meta = SERVICE_STATUS_META[service.status];
  const [notes, setNotes] = useState(service.notes ?? "");
  const done = service.status === "completed";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {service.clientName}
            </h3>
            <StatusBadge meta={meta} pulse={service.status === "in_progress"} />
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {service.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {format(parseISO(service.date), "EEE d 'de' MMM", { locale: es })} ·{" "}
              {service.startTime}
            </span>
            {service.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {service.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Evidence (coming soon) */}
        <div className="grid grid-cols-2 gap-2">
          <EvidenceSlot label="Foto antes" />
          <EvidenceSlot label="Foto después" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Observaciones
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onObservations(notes)}
            placeholder="Detalles del servicio, incidencias, materiales usados…"
            className="min-h-16"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-400"
          >
            <PenLine className="size-4" />
            Firma del cliente · Próximamente
          </button>
          <div className="flex-1" />
          {!done && service.status !== "in_progress" && (
            <Button size="sm" variant="outline" onClick={onStart}>
              <Play className="size-4" />
              Iniciar
            </Button>
          )}
          {!done && (
            <Button size="sm" onClick={onComplete}>
              <Check className="size-4" />
              Completar
            </Button>
          )}
          {done && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Check className="size-4" />
              Confirmado
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function EvidenceSlot({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-4 text-slate-400">
      <Camera className="size-5" />
      <span className="text-[11px] font-medium">{label}</span>
      <span className="text-[10px]">Próximamente</span>
    </div>
  );
}
