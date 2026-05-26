"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Ban,
  Check,
  CheckCheck,
  MapPin,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { SERVICE_STATUS_META, SERVICE_TYPE_META } from "@/lib/colors";
import { getTeam, serviceAmount } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { ServiceStatus } from "@/lib/types";
import { formatCurrency, lineTotal } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Select } from "@/components/ui/field";
import { toastInfo, toastSuccess } from "@/components/ui/toast";

export function ServiceDrawer({
  serviceId,
  onClose,
}: {
  serviceId: string | null;
  onClose: () => void;
}) {
  const service = useStore((s) =>
    serviceId ? s.services.find((x) => x.id === serviceId) : undefined,
  );
  const teams = useStore((s) => s.teams);
  const assignTeam = useStore((s) => s.assignTeam);
  const setStatus = useStore((s) => s.setServiceStatus);
  const moveService = useStore((s) => s.moveService);
  const updateService = useStore((s) => s.updateService);
  const deleteService = useStore((s) => s.deleteService);

  const open = !!service;

  if (!service) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const team = getTeam(teams, service.teamId);
  const statusMeta = SERVICE_STATUS_META[service.status];

  const transition = (status: ServiceStatus, msg: string, desc?: string) => {
    setStatus(service.id, status);
    toastSuccess(msg, desc);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={`${SERVICE_TYPE_META[service.type].label} · ${format(parseISO(service.date), "EEE, MMM d", { locale: es })}`}
      title={service.title}
      subtitle={service.clientName}
      widthClass="sm:w-[34rem]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              deleteService(service.id);
              toastInfo("Servicio eliminado", service.title);
              onClose();
            }}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <StatusBadge
            meta={statusMeta}
            pulse={service.status === "in_progress"}
          />
          <span className="text-lg font-bold text-slate-900">
            {formatCurrency(serviceAmount(service))}
          </span>
        </div>

        {/* contextual quick actions */}
        <div className="flex flex-wrap gap-2">
          {(service.status === "scheduled" ||
            service.status === "unassigned") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                transition("in_progress", "Servicio iniciado", service.title)
              }
            >
              <Play className="size-4" />
              Iniciar
            </Button>
          )}
          {service.status !== "completed" && service.status !== "cancelled" && (
            <Button
              size="sm"
              onClick={() =>
                transition(
                  "completed",
                  "Servicio completado",
                  "Enviado a contabilidad para registro.",
                )
              }
            >
              <Check className="size-4" />
              Completar
            </Button>
          )}
          {service.status === "completed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                transition("scheduled", "Reabierto", service.title)
              }
            >
              <RotateCcw className="size-4" />
              Reabrir
            </Button>
          )}
          {service.status !== "cancelled" &&
            service.status !== "completed" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  transition("cancelled", "Servicio cancelado", service.title)
                }
              >
                <Ban className="size-4" />
                Cancelar
              </Button>
            )}
          {service.status === "cancelled" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                transition(
                  service.teamId ? "scheduled" : "unassigned",
                  "Restaurado",
                  service.title,
                )
              }
            >
              <RotateCcw className="size-4" />
              Restaurar
            </Button>
          )}
        </div>

        {service.accountingStatus !== "not_applicable" && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
            <CheckCheck className="size-4 text-slate-400" />
            Contabilidad:{" "}
            <span className="font-medium text-slate-700">
              {service.accountingStatus === "pending"
                ? "por registrar"
                : "registrado"}
            </span>
          </div>
        )}

        <Field label="Equipo asignado">
          <Select
            value={service.teamId ?? ""}
            onChange={(e) => {
              const v = e.target.value || undefined;
              assignTeam(service.id, v);
              const t = teams.find((x) => x.id === v);
              toastSuccess(
                t ? `Asignado a ${t.name}` : "Sin asignar",
                service.title,
              );
            }}
          >
            <option value="">Sin asignar</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Fecha">
            <Input
              type="date"
              value={service.date}
              onChange={(e) => moveService(service.id, e.target.value)}
            />
          </Field>
          <Field label="Hora de inicio">
            <Input
              type="time"
              value={service.startTime}
              onChange={(e) =>
                moveService(service.id, service.date, e.target.value)
              }
            />
          </Field>
          <Field label="Duración (min)">
            <Input
              type="number"
              min={15}
              step="15"
              value={service.durationMin}
              onChange={(e) =>
                updateService(service.id, {
                  durationMin: Number(e.target.value),
                })
              }
            />
          </Field>
        </div>

        {service.address && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <MapPin className="size-4 text-slate-400" />
            {service.address}
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Conceptos
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            {service.lines.map((l, i) => (
              <div
                key={l.id}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                  i > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <span className="min-w-0 truncate text-slate-700">
                  {l.description}
                  <span className="ml-1.5 text-xs text-slate-400">
                    {l.quantity} × {formatCurrency(l.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-slate-800">
                  {formatCurrency(lineTotal(l))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {team && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-slate-500">Cuadrilla:</span>
            {team.members.map((m) => (
              <Badge key={m} className="bg-slate-100 text-slate-600">
                {m}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
