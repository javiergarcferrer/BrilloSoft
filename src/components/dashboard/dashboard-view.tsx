"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  FileText,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  QUOTE_STATUS_META,
  SERVICE_STATUS_META,
  teamColor,
} from "@/lib/colors";
import { dashboardMetrics } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { clamp, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";

export function DashboardView() {
  const hydrated = useHydrated();
  const services = useStore((s) => s.services);
  const quotes = useStore((s) => s.quotes);
  const clients = useStore((s) => s.clients);
  const teams = useStore((s) => s.teams);

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Panel" description="Cargando tu resumen…" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const m = dashboardMetrics(services, quotes, clients, teams);
  const statusData = m.servicesByStatus.filter((d) => d.count > 0);
  const maxLoad = Math.max(1, ...m.teamLoad.map((t) => t.hours));

  return (
    <div>
      <PageHeader
        title="Panel"
        description={`Resumen de operaciones · ${format(new Date(), "EEEE, MMMM d", { locale: es })}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(m.revenueMTD)}
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          footer={`${m.completedMTD} servicios completados`}
        />
        <StatCard
          label="Clientes activos"
          value={m.activeClients}
          icon={Building2}
          iconClass="bg-violet-50 text-violet-600"
          footer={`${formatCurrency(m.mrr)}/mes recurrente`}
        />
        <StatCard
          label="Pipeline abierto"
          value={formatCurrency(m.pipelineValue)}
          icon={FileText}
          iconClass="bg-blue-50 text-blue-600"
          footer="Borradores + enviadas"
        />
        <StatCard
          label="Por registrar"
          value={formatCurrency(m.pendingDigitValue)}
          icon={Wallet}
          iconClass="bg-amber-50 text-amber-600"
          footer={`${m.pendingDigitCount} por registrar`}
          highlight={m.pendingDigitCount > 0}
        />
      </div>

      {/* Attention strip */}
      {(m.unassignedCount > 0 || m.pendingDigitCount > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {m.unassignedCount > 0 && (
            <AttentionCard
              tone="amber"
              icon={CircleAlert}
              title={`${m.unassignedCount} trabajo${m.unassignedCount > 1 ? "s" : ""} sin asignar`}
              description="Los trabajos sin equipo necesitan programarse."
              href="/calendar"
              cta="Asignar en calendario"
            />
          )}
          {m.pendingDigitCount > 0 && (
            <AttentionCard
              tone="brand"
              icon={Wallet}
              title={`${m.pendingDigitCount} movimiento${m.pendingDigitCount > 1 ? "s" : ""} por registrar`}
              description={`${formatCurrency(m.pendingDigitValue)} a la espera de contabilidad.`}
              href="/accounting"
              cta="Ir a contabilidad"
            />
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de ingresos</CardTitle>
            <span className="text-xs text-slate-400">Últimos 6 meses</span>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={m.revenueTrend}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(v) => formatCompactCurrency(Number(v))}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Ingresos"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "var(--shadow-pop)",
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Services by status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de servicios</CardTitle>
            <span className="text-xs text-slate-400">Este mes</span>
          </CardHeader>
          <CardBody>
            {statusData.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                Sin servicios este mes.
              </p>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {statusData.map((d) => (
                          <Cell
                            key={d.status}
                            fill={SERVICE_STATUS_META[d.status].hex}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, _n, p) => [
                          v,
                          SERVICE_STATUS_META[
                            (p?.payload as { status: keyof typeof SERVICE_STATUS_META })
                              .status
                          ].label,
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          fontSize: 13,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {statusData.map((d) => {
                    const meta = SERVICE_STATUS_META[d.status];
                    return (
                      <div
                        key={d.status}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 text-slate-600">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: meta.hex }}
                          />
                          {meta.label}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {d.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Team load (resource flow) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Carga de trabajo</CardTitle>
            <span className="text-xs text-slate-400">Próximos 7 días</span>
          </CardHeader>
          <CardBody className="space-y-4">
            {m.teamLoad.map((t) => {
              const color = teamColor(t.colorKey);
              return (
                <div key={t.teamId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      {t.name}
                    </span>
                    <span className="text-slate-500">
                      {t.hours.toFixed(1)}h · {t.jobs} trabajos
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${clamp((t.hours / maxLoad) * 100, t.hours > 0 ? 6 : 0, 100)}%`,
                        backgroundColor: color.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {m.teamLoad.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                Sin equipos activos.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Quote pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Embudo de cotizaciones</CardTitle>
            <Link
              href="/quotes"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todo
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {m.quoteFunnel.map((q) => {
              const meta = QUOTE_STATUS_META[q.status];
              return (
                <div
                  key={q.status}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: meta.hex }}
                    />
                    {meta.label}
                    <span className="text-xs text-slate-400">({q.count})</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatCompactCurrency(q.value)}
                  </span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function AttentionCard({
  tone,
  icon: Icon,
  title,
  description,
  href,
  cta,
}: {
  tone: "amber" | "brand";
  icon: typeof CircleAlert;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : "border-brand-200 bg-brand-50";
  const iconClasses =
    tone === "amber"
      ? "bg-amber-100 text-amber-600"
      : "bg-brand-100 text-brand-600";
  const linkClasses =
    tone === "amber"
      ? "text-amber-700 hover:text-amber-800"
      : "text-brand-700 hover:text-brand-800";
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${toneClasses}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClasses}`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold ${linkClasses}`}
      >
        {cta}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
