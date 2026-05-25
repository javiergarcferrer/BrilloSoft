"use client";

import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { Building2, Plus, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { teamColor } from "@/lib/colors";
import { recurrenceLabel } from "@/lib/recurrence";
import { clientMonthlyValue, getTeam } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamAvatar } from "@/components/ui/avatar";
import { ClientDetail } from "./client-detail";
import { ClientEditor } from "./client-editor";

export function ClientsView() {
  const hydrated = useHydrated();
  const clients = useStore((s) => s.clients);
  const services = useStore((s) => s.services);
  const teams = useStore((s) => s.teams);

  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Client | null>(null);
  const [editorTarget, setEditorTarget] = useState<Client | "new" | null>(null);

  const today = startOfDay(new Date());
  const nextServiceDate = (clientId: string): string | null => {
    const dates = services
      .filter(
        (s) => s.clientId === clientId && !isBefore(parseISO(s.date), today),
      )
      .map((s) => s.date)
      .sort();
    return dates[0] ?? null;
  };

  const activeCount = clients.filter((c) => c.active).length;
  const mrr = clients
    .filter((c) => c.active)
    .reduce((s, c) => s + clientMonthlyValue(c), 0);

  const filtered = useMemo(() => {
    if (filter === "active") return clients.filter((c) => c.active);
    if (filter === "paused") return clients.filter((c) => !c.active);
    return clients;
  }, [clients, filter]);

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Client",
      sortValue: (c) => c.name.toLowerCase(),
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-900">{c.name}</div>
          <div className="text-xs text-slate-400">
            {c.contactName ?? c.address ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "recurrence",
      header: "Schedule",
      hideOnMobile: true,
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Repeat className="size-3.5 text-violet-400" />
          {recurrenceLabel(c.recurrence)}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      hideOnMobile: true,
      render: (c) => {
        const team = getTeam(teams, c.serviceTemplate.preferredTeamId);
        return (
          <div className="flex items-center gap-2">
            <TeamAvatar team={team} size="sm" />
            <span className="text-sm text-slate-600">
              {team?.name ?? "Unassigned"}
            </span>
          </div>
        );
      },
    },
    {
      key: "next",
      header: "Next service",
      hideOnMobile: true,
      sortValue: (c) => nextServiceDate(c.id) ?? "9999",
      render: (c) => {
        const d = nextServiceDate(c.id);
        return (
          <span className="text-sm text-slate-600">
            {d ? format(parseISO(d), "MMM d") : "—"}
          </span>
        );
      },
    },
    {
      key: "value",
      header: "Monthly",
      align: "right",
      sortValue: (c) => clientMonthlyValue(c),
      render: (c) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatCurrency(clientMonthlyValue(c))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      sortValue: (c) => (c.active ? 0 : 1),
      render: (c) => (
        <Badge
          className={
            c.active
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
              : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-400/20"
          }
        >
          <span
            className={`size-1.5 rounded-full ${c.active ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          {c.active ? "Active" : "Paused"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Recurring accounts and the schedules that feed the calendar."
        actions={
          <Button onClick={() => setEditorTarget("new")}>
            <Plus className="size-4" />
            New client
          </Button>
        }
      />

      {hydrated && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Active clients</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{activeCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">
              Recurring revenue
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatCurrency(mrr)}
              <span className="text-xs font-medium text-slate-400">/mo</span>
            </p>
          </Card>
          <Card className="col-span-2 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500">Total clients</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {clients.length}
            </p>
          </Card>
        </div>
      )}

      {!hydrated ? (
        <Skeleton className="h-80 w-full" />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Accept a recurring quote, or add a client manually to start scheduling."
          action={
            <Button onClick={() => setEditorTarget("new")}>
              <Plus className="size-4" />
              New client
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(c) => c.id}
          onRowClick={(c) => setDetail(c)}
          initialSort={{ key: "value", dir: "desc" }}
          rowAccent={(c) => {
            const team = getTeam(teams, c.serviceTemplate.preferredTeamId);
            return team ? teamColor(team.colorKey).hex : undefined;
          }}
          searchText={(c) => `${c.name} ${c.contactName ?? ""} ${c.address ?? ""}`}
          searchPlaceholder="Search clients…"
          filters={
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: clients.length },
                {
                  value: "active",
                  label: "Active",
                  hex: "#10b981",
                  count: activeCount,
                },
                {
                  value: "paused",
                  label: "Paused",
                  hex: "#94a3b8",
                  count: clients.length - activeCount,
                },
              ]}
            />
          }
        />
      )}

      <ClientDetail
        client={detail}
        onClose={() => setDetail(null)}
        onEdit={(c) => {
          setDetail(null);
          setEditorTarget(c);
        }}
      />
      <ClientEditor
        target={editorTarget}
        onClose={() => setEditorTarget(null)}
      />
    </div>
  );
}
