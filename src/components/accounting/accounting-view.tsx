"use client";

import { format, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  BadgeCheck,
  Banknote,
  Check,
  CheckCheck,
  Clock,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  ACCOUNTING_STATUS_META,
  SERVICE_TYPE_META,
  teamColor,
} from "@/lib/colors";
import { getTeam, serviceAmount } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { formatCurrency, lineTotal } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { TeamAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { toastSuccess } from "@/components/ui/toast";

export function AccountingView() {
  const hydrated = useHydrated();
  const services = useStore((s) => s.services);
  const teams = useStore((s) => s.teams);
  const markDigitized = useStore((s) => s.markDigitized);
  const markAll = useStore((s) => s.markAllPendingDigitized);

  const [filter, setFilter] = useState("pending");
  const [detail, setDetail] = useState<Service | null>(null);

  const movements = useMemo(
    () =>
      services.filter(
        (s) =>
          s.accountingStatus === "pending" ||
          s.accountingStatus === "digitized",
      ),
    [services],
  );

  const pending = movements.filter((s) => s.accountingStatus === "pending");
  const pendingValue = pending.reduce((s, x) => s + serviceAmount(x), 0);

  const monthStart = startOfMonth(new Date());
  const digitizedThisMonth = movements.filter(
    (s) =>
      s.accountingStatus === "digitized" &&
      s.digitizedAt &&
      parseISO(s.digitizedAt) >= monthStart,
  );
  const digitizedValue = digitizedThisMonth.reduce(
    (s, x) => s + serviceAmount(x),
    0,
  );
  const revenueMonth = movements
    .filter((s) => parseISO(s.date) >= monthStart)
    .reduce((s, x) => s + serviceAmount(x), 0);

  const filtered = useMemo(() => {
    if (filter === "all") return movements;
    return movements.filter((s) => s.accountingStatus === filter);
  }, [movements, filter]);

  const columns: Column<Service>[] = [
    {
      key: "date",
      header: "Fecha del servicio",
      sortValue: (s) => s.date,
      render: (s) => (
        <div>
          <div className="font-medium text-slate-800">
            {format(parseISO(s.date), "MMM d, yyyy", { locale: es })}
          </div>
          {s.completedAt && (
            <div className="text-xs text-slate-400">
              completado {format(parseISO(s.completedAt), "MMM d, HH:mm", { locale: es })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      sortValue: (s) => s.clientName.toLowerCase(),
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800">{s.clientName}</span>
          <Badge className={SERVICE_TYPE_META[s.type].badge}>
            {SERVICE_TYPE_META[s.type].label}
          </Badge>
        </div>
      ),
    },
    {
      key: "team",
      header: "Equipo",
      hideOnMobile: true,
      render: (s) => {
        const team = getTeam(teams, s.teamId);
        return (
          <div className="flex items-center gap-2">
            <TeamAvatar team={team} size="sm" />
            <span className="text-sm text-slate-600">
              {team?.name ?? "—"}
            </span>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Monto",
      align: "right",
      sortValue: (s) => serviceAmount(s),
      render: (s) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatCurrency(serviceAmount(s))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Registro",
      align: "center",
      sortValue: (s) => (s.accountingStatus === "pending" ? 0 : 1),
      render: (s) =>
        s.accountingStatus === "pending" ? (
          <Button
            variant="subtle"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              markDigitized(s.id);
              toastSuccess("Registrado", `${s.clientName} · ${formatCurrency(serviceAmount(s))}`);
            }}
          >
            <Check className="size-4" />
            Registrar
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <BadgeCheck className="size-4" />
            Registrado
          </span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contabilidad"
        description="Servicios ejecutados y los movimientos por registrar en tu sistema contable."
        actions={
          pending.length > 0 ? (
            <Button onClick={() => { markAll(); toastSuccess("Todo al día", `${pending.length} movimientos registrados.`); }}>
              <CheckCheck className="size-4" />
              Registrar todo
            </Button>
          ) : undefined
        }
      />

      {hydrated && pending.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-amber-900">
                {pending.length} servicio{pending.length > 1 ? "s" : ""} por
                registrar
              </p>
              <p className="text-sm text-amber-700">
                {formatCurrency(pendingValue)} listos para registrar en el
                sistema contable.
              </p>
            </div>
          </div>
        </div>
      )}

      {hydrated && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Por registrar"
            value={formatCurrency(pendingValue)}
            icon={Clock}
            iconClass="bg-amber-50 text-amber-600"
            footer={`${pending.length} movimientos`}
            highlight={pending.length > 0}
          />
          <StatCard
            label="Registrado este mes"
            value={formatCurrency(digitizedValue)}
            icon={BadgeCheck}
            iconClass="bg-emerald-50 text-emerald-600"
            footer={`${digitizedThisMonth.length} movimientos`}
          />
          <StatCard
            label="Ingresos del mes"
            value={formatCurrency(revenueMonth)}
            icon={Wallet}
            iconClass="bg-brand-50 text-brand-600"
            footer="Servicios completados"
          />
        </div>
      )}

      {!hydrated ? (
        <Skeleton className="h-80 w-full" />
      ) : movements.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Nada por registrar aún"
          description="Cuando un coordinador completa un servicio, aparece aquí para registrarlo."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(s) => s.id}
          onRowClick={(s) => setDetail(s)}
          initialSort={{ key: "date", dir: "desc" }}
          rowAccent={(s) => {
            const team = getTeam(teams, s.teamId);
            return team ? teamColor(team.colorKey).hex : undefined;
          }}
          searchText={(s) => s.clientName}
          searchPlaceholder="Buscar por cliente…"
          filters={
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "Todos", count: movements.length },
                {
                  value: "pending",
                  label: "Por registrar",
                  hex: "#f59e0b",
                  count: pending.length,
                },
                {
                  value: "digitized",
                  label: "Registrado",
                  hex: "#10b981",
                  count: movements.length - pending.length,
                },
              ]}
            />
          }
        />
      )}

      <MovementDetail
        service={detail}
        teamName={getTeam(teams, detail?.teamId)?.name}
        onClose={() => setDetail(null)}
        onDigitize={() => {
          if (detail) {
            markDigitized(detail.id);
            toastSuccess("Registrado", `${detail.clientName} registrado.`);
            setDetail(null);
          }
        }}
      />
    </div>
  );
}

function MovementDetail({
  service,
  teamName,
  onClose,
  onDigitize,
}: {
  service: Service | null;
  teamName?: string;
  onClose: () => void;
  onDigitize: () => void;
}) {
  if (!service) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;
  const meta = ACCOUNTING_STATUS_META[service.accountingStatus];

  return (
    <Drawer
      open={!!service}
      onClose={onClose}
      eyebrow="Movimiento"
      title={service.clientName}
      subtitle={`${format(parseISO(service.date), "EEEE, MMM d, yyyy", { locale: es })} · ${teamName ?? "Sin asignar"}`}
      widthClass="sm:w-[32rem]"
      footer={
        service.accountingStatus === "pending" ? (
          <Button className="w-full" onClick={onDigitize}>
            <Check className="size-4" />
            Marcar como registrado
          </Button>
        ) : (
          <div className="text-center text-sm text-slate-400">
            Registrado
            {service.digitizedAt
              ? ` el ${format(parseISO(service.digitizedAt), "MMM d, yyyy", { locale: es })}`
              : ""}
          </div>
        )
      }
    >
      <div className="space-y-5">
        <Badge className={meta.badge}>
          <span className={`size-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </Badge>

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

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-500">
            Total (incl. ITBIS {service.taxRate}%)
          </span>
          <span className="text-lg font-bold text-slate-900">
            {formatCurrency(serviceAmount(service))}
          </span>
        </div>
      </div>
    </Drawer>
  );
}
