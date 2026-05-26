"use client";

import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarPlus,
  Mail,
  MapPin,
  Pause,
  Pencil,
  Phone,
  Play,
  Repeat,
  User,
} from "lucide-react";
import { SERVICE_STATUS_META, teamColor } from "@/lib/colors";
import { recurrenceLabel } from "@/lib/recurrence";
import { clientMonthlyValue, getTeam } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TotalsSummary } from "@/components/shared/totals-summary";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { toastSuccess } from "@/components/ui/toast";

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-600">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

export function ClientDetail({
  client,
  onClose,
  onEdit,
}: {
  client: Client | null;
  onClose: () => void;
  onEdit: (c: Client) => void;
}) {
  const services = useStore((s) => s.services);
  const teams = useStore((s) => s.teams);
  const generate = useStore((s) => s.generateServicesForClient);
  const toggleActive = useStore((s) => s.toggleClientActive);

  if (!client) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const today = startOfDay(new Date());
  const upcoming = services
    .filter(
      (s) => s.clientId === client.id && !isBefore(parseISO(s.date), today),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <Drawer
      open={!!client}
      onClose={onClose}
      eyebrow="Client"
      title={client.name}
      subtitle={recurrenceLabel(client.recurrence)}
      widthClass="sm:w-[34rem]"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toggleActive(client.id);
              toastSuccess(
                client.active ? "Client paused" : "Client resumed",
                client.name,
              );
            }}
          >
            {client.active ? (
              <>
                <Pause className="size-4" /> Pause
              </>
            ) : (
              <>
                <Play className="size-4" /> Resume
              </>
            )}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onEdit(client)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            onClick={() => {
              const ids = generate(client.id, 4);
              toastSuccess(
                "Services generated",
                `${ids.length} new jobs added to the calendar.`,
              );
            }}
          >
            <CalendarPlus className="size-4" />
            Generate next 4
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-medium text-slate-500">Monthly value</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(clientMonthlyValue(client))}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-medium text-slate-500">Status</p>
            <p
              className={`mt-1 text-xl font-bold ${
                client.active ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {client.active ? "Active" : "Paused"}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          {client.contactName && (
            <InfoRow icon={User}>{client.contactName}</InfoRow>
          )}
          {client.phone && <InfoRow icon={Phone}>{client.phone}</InfoRow>}
          {client.email && <InfoRow icon={Mail}>{client.email}</InfoRow>}
          {client.address && <InfoRow icon={MapPin}>{client.address}</InfoRow>}
          <InfoRow icon={Repeat}>{recurrenceLabel(client.recurrence)}</InfoRow>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Upcoming services
          </h4>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
              No upcoming services scheduled. Use “Generate next 4”.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => {
                const team = getTeam(teams, s.teamId);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-1 rounded-full"
                        style={{ backgroundColor: team ? teamColor(team.colorKey).hex : "#cbd5e1" }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {format(parseISO(s.date), "EEE, MMM d")}
                        </p>
                        <p className="text-xs text-slate-400">
                          {s.startTime} · {team?.name ?? "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge meta={SERVICE_STATUS_META[s.status]} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Service template
          </h4>
          <TotalsSummary
            lines={client.serviceTemplate.lines}
            taxRate={client.taxRate}
          />
        </div>
      </div>
    </Drawer>
  );
}
