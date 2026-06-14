import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Gavel,
  Layers,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { CATEGORIAS, INSTITUCIONES, LICITACIONES, PLATFORM } from "@/lib/licitaciones/data";
import {
  diasRestantes,
  formatFecha,
  formatMonto,
  formatMontoCompacto,
  getCategoria,
  getInstitucion,
  ordenar,
} from "@/lib/licitaciones/utils";
import { TenderCard } from "@/components/licita/tender-card";
import { StatCounter } from "@/components/licita/stat-counter";
import { HeroSearch } from "@/components/licita/hero-search";
import { PipelineSummary } from "@/components/licita/pipeline-summary";
import { CategoryIcon } from "@/components/licita/category-icon";

const toDop = (l: { monto: number; moneda: "DOP" | "USD" }) =>
  l.moneda === "USD" ? l.monto * 60 : l.monto;

export default function DashboardPage() {
  const activos = LICITACIONES.filter(
    (l) => l.estado === "abierta" || l.estado === "por_cerrar",
  );
  const montoActivos = activos.reduce(
    (s, l) => s + toDop({ monto: l.montoEstimado, moneda: l.moneda }),
    0,
  );
  const cierranSemana = activos.filter((l) => {
    const d = diasRestantes(l.cierre);
    return d >= 0 && d <= 7;
  });
  const recomendadas = ordenar(activos, "afinidad").slice(0, 6);
  const proximos = [...activos]
    .sort((a, b) => diasRestantes(a.cierre) - diasRestantes(b.cierre))
    .slice(0, 5);
  const adjudicadas = LICITACIONES.filter((l) => l.adjudicacion).slice(0, 4);
  const catCounts = CATEGORIAS.map((c) => ({
    ...c,
    n: activos.filter((l) => l.categoriaId === c.id).length,
  }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);

  const kpis = [
    {
      label: "Procesos activos",
      value: activos.length,
      icon: Layers,
      format: "int" as const,
      hint: "recibiendo ofertas ahora",
    },
    {
      label: "Monto en juego",
      value: montoActivos,
      icon: TrendingUp,
      format: "money" as const,
      hint: "valor estimado activo",
    },
    {
      label: "Cierran esta semana",
      value: cierranSemana.length,
      icon: CalendarClock,
      format: "int" as const,
      hint: "próximos 7 días",
    },
    {
      label: "Instituciones",
      value: INSTITUCIONES.length,
      icon: ShieldCheck,
      format: "int" as const,
      hint: "monitoreadas",
    },
  ];

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 app-grid-dark" />
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur">
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-open text-open">
              <span className="live-dot" />
            </span>
            {PLATFORM.fuente} · datos en vivo
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Toda licitación pública,
            <br />
            <span className="text-gradient bg-gradient-to-r from-accent-300 to-white bg-clip-text text-transparent">
              en un solo lugar inteligente.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Busca, organiza y da seguimiento a las contrataciones del Estado
            dominicano. Afinidad automática, alertas y analítica de
            adjudicaciones — sin perder ningún cierre.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:flex sm:flex-wrap sm:gap-x-12">
            <HeroStat value={`${activos.length}`} label="procesos activos" />
            <HeroStat
              value={formatMontoCompacto(montoActivos)}
              label="valor en juego"
            />
            <HeroStat value={`${cierranSemana.length}`} label="cierran esta semana" />
            <HeroStat value={`${INSTITUCIONES.length}`} label="instituciones" />
          </dl>
        </div>
      </section>

      {/* KPI cards */}
      <section className="mx-auto -mt-10 w-full max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-hairline"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <k.icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                <StatCounter value={k.value} format={k.format} />
              </div>
              <div className="mt-1 text-sm font-medium text-ink">{k.label}</div>
              <div className="text-xs text-ink-soft">{k.hint}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main grid */}
      <section className="mx-auto mt-14 w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recomendadas */}
          <div className="lg:col-span-2">
            <SectionHeading
              title="Recomendadas para ti"
              subtitle="Ordenadas por afinidad con tu perfil de capacidad"
              href="/buscar"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {recomendadas.map((lic) => (
                <TenderCard key={lic.id} lic={lic} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <PipelineSummary />

            <div className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <Bell className="h-4 w-4 text-soon" />
                  Cierres próximos
                </h3>
                <Link
                  href="/buscar?orden=cierre"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  Ver todos
                </Link>
              </div>
              <ul className="mt-4 space-y-1">
                {proximos.map((lic) => {
                  const dias = diasRestantes(lic.cierre);
                  const inst = getInstitucion(lic.institucionId);
                  return (
                    <li key={lic.id}>
                      <Link
                        href={`/licitacion/${encodeURIComponent(lic.id)}`}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-soft"
                      >
                        <span
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-center text-sm font-bold leading-none ${
                            dias <= 3
                              ? "bg-closed-soft text-closed"
                              : "bg-soon-soft text-soon"
                          }`}
                        >
                          {dias}
                          <span className="text-[9px] font-medium">días</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink group-hover:text-brand-700">
                            {lic.titulo}
                          </span>
                          <span className="block truncate text-xs text-ink-soft">
                            {inst?.sigla} · {formatMontoCompacto(lic.montoEstimado, lic.moneda)}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading
          title="Explorar por categoría"
          subtitle="Procesos activos por rubro de compra"
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {catCounts.map((c) => (
            <Link
              key={c.id}
              href={`/buscar?cat=${c.id}`}
              className="group flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-hairline transition-all hover:-translate-y-0.5 hover:shadow-card hover:ring-brand-200"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {c.nombre}
                </span>
                <span className="text-xs text-ink-soft">{c.n} activos</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Adjudicaciones recientes (contract intelligence) */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading
          title="Adjudicaciones recientes"
          subtitle="Inteligencia de mercado: quién ganó, cuánto y dónde"
          href="/analitica"
          hrefLabel="Ver analítica"
        />
        <div className="mt-5 overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-hairline">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-surface-soft text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3 font-semibold">Proceso</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Proveedor adjudicado</th>
                <th className="px-5 py-3 text-right font-semibold">Monto</th>
                <th className="hidden px-5 py-3 text-right font-semibold md:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {adjudicadas.map((lic) => {
                const inst = getInstitucion(lic.institucionId);
                const cat = getCategoria(lic.categoriaId);
                return (
                  <tr key={lic.id} className="transition-colors hover:bg-surface-soft">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/licitacion/${encodeURIComponent(lic.id)}`}
                        className="flex items-center gap-3"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-awarded-soft text-awarded">
                          <Gavel className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-xs truncate font-medium text-ink hover:text-brand-700">
                            {lic.titulo}
                          </span>
                          <span className="text-xs text-ink-soft">
                            {inst?.sigla} · {cat?.nombre}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3.5 text-ink-soft sm:table-cell">
                      {lic.adjudicacion?.proveedor}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-ink">
                      {formatMonto(lic.adjudicacion!.monto, lic.moneda)}
                    </td>
                    <td className="hidden px-5 py-3.5 text-right text-ink-soft md:table-cell">
                      {formatFecha(lic.adjudicacion!.fecha)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto mt-16 w-full max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-12 text-white sm:px-12">
          <div className="absolute inset-0 app-grid-dark opacity-60" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                No vuelvas a perder un cierre.
              </h2>
              <p className="mt-2 text-white/70">
                Crea búsquedas guardadas con alertas y deja que {PLATFORM.name}{" "}
                vigile el Portal Transaccional por ti.
              </p>
            </div>
            <Link
              href="/buscar"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-brand-700 transition-transform hover:scale-[1.02]"
            >
              Comenzar a explorar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="order-2 text-sm text-white/60">{label}</dt>
      <dd className="order-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        {value}
      </dd>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  href,
  hrefLabel = "Ver todo",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
