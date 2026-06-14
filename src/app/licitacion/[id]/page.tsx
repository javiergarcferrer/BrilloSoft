import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  Gavel,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LICITACIONES } from "@/lib/licitaciones/data";
import {
  diasRestantes,
  formatFecha,
  formatFechaLarga,
  formatMonto,
  getCategoria,
  getInstitucion,
  getLicitacion,
  nivelAfinidad,
  puntuacionAfinidad,
  textoDiasRestantes,
} from "@/lib/licitaciones/utils";
import { EstadoBadge } from "@/components/licita/badges";
import { CategoryIcon } from "@/components/licita/category-icon";
import { ScoreRing } from "@/components/licita/score-ring";
import { TenderActions } from "@/components/licita/tender-actions";
import { TenderCard } from "@/components/licita/tender-card";

export function generateStaticParams() {
  return LICITACIONES.map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lic = getLicitacion(decodeURIComponent(id));
  if (!lic) return { title: "Licitación no encontrada" };
  return {
    title: lic.titulo,
    description: lic.descripcion.slice(0, 160),
  };
}

export default async function LicitacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lic = getLicitacion(decodeURIComponent(id));
  if (!lic) notFound();

  const inst = getInstitucion(lic.institucionId);
  const cat = getCategoria(lic.categoriaId);
  const score = puntuacionAfinidad(lic);
  const nivel = nivelAfinidad(score);
  const dias = diasRestantes(lic.cierre);
  const activo = lic.estado === "abierta" || lic.estado === "por_cerrar";

  const similares = LICITACIONES.filter(
    (l) => l.categoriaId === lic.categoriaId && l.id !== lic.id,
  ).slice(0, 3);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-6 sm:px-8">
          <Link
            href="/buscar"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a explorar
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              <CategoryIcon name={cat?.icon ?? "Sparkles"} className="h-3.5 w-3.5" />
              {cat?.nombre}
            </span>
            <EstadoBadge estado={lic.estado} live />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-inset ring-hairline">
              {lic.procedimiento}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
            {lic.titulo}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {inst?.nombre}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {lic.provincia}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <ScrollText className="h-4 w-4" />
              {lic.id}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Award banner */}
        {lic.adjudicacion && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-awarded-soft p-5 ring-1 ring-inset ring-awarded/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-awarded/10 text-awarded">
                <Gavel className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-awarded">
                  Proceso adjudicado
                </p>
                <p className="text-sm font-medium text-ink">
                  {lic.adjudicacion.proveedor}{" "}
                  <span className="text-ink-soft">· RNC {lic.adjudicacion.rnc}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-ink">
                {formatMonto(lic.adjudicacion.monto, lic.moneda)}
              </p>
              <p className="text-xs text-ink-soft">
                Adjudicado el {formatFecha(lic.adjudicacion.fecha)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Resumen del proceso
              </h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{lic.descripcion}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Cronograma
              </h2>
              <ol className="mt-4 space-y-0">
                {lic.cronograma.map((etapa, i) => {
                  const last = i === lic.cronograma.length - 1;
                  return (
                    <li key={etapa.etapa} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-canvas",
                            etapa.estado === "completado" && "bg-open text-white",
                            etapa.estado === "actual" && "bg-brand-600 text-white",
                            etapa.estado === "pendiente" && "bg-surface-soft text-ink-soft ring-canvas",
                          )}
                        >
                          {etapa.estado === "completado" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                etapa.estado === "actual" ? "bg-white" : "bg-ink-soft/40",
                              )}
                            />
                          )}
                        </span>
                        {!last && (
                          <span
                            className={cn(
                              "w-0.5 flex-1",
                              etapa.estado === "completado" ? "bg-open/40" : "bg-hairline",
                            )}
                          />
                        )}
                      </div>
                      <div className={cn("pb-6", last && "pb-0")}>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            etapa.estado === "actual" ? "text-brand-700" : "text-ink",
                          )}
                        >
                          {etapa.etapa}
                          {etapa.estado === "actual" && (
                            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                              en curso
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm capitalize text-ink-soft">
                          {formatFechaLarga(etapa.fecha)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Documentos del pliego
              </h2>
              <div className="mt-4 divide-y divide-hairline overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-hairline">
                {lic.documentos.map((d) => (
                  <button
                    key={d.nombre}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-soft"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {d.nombre}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {d.tipo} · {d.tamano}
                      </span>
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-ink-soft" />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Unidad de compras
              </h2>
              <div className="mt-4 rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-hairline">
                <p className="text-sm font-medium text-ink">{lic.contacto.nombre}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
                  <a
                    href={`mailto:${lic.contacto.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-brand-700"
                  >
                    <Mail className="h-4 w-4" />
                    {lic.contacto.email}
                  </a>
                  <a
                    href={`tel:${lic.contacto.telefono}`}
                    className="inline-flex items-center gap-1.5 hover:text-brand-700"
                  >
                    <Phone className="h-4 w-4" />
                    {lic.contacto.telefono}
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Key facts */}
            <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-hairline">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
                Monto estimado
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
                {formatMonto(lic.montoEstimado, lic.moneda)}
              </p>
              {activo && (
                <div
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                    dias <= 3
                      ? "bg-closed-soft text-closed"
                      : dias <= 7
                        ? "bg-soon-soft text-soon"
                        : "bg-open-soft text-open",
                  )}
                >
                  <CalendarClock className="h-4 w-4" />
                  {textoDiasRestantes(lic.cierre)}
                </div>
              )}

              <dl className="mt-5 space-y-3 border-t border-hairline pt-5 text-sm">
                <Fact icon={CalendarDays} label="Cierre de ofertas" value={formatFecha(lic.cierre)} />
                <Fact icon={CalendarDays} label="Apertura" value={formatFecha(lic.apertura)} />
                <Fact icon={CircleDollarSign} label="Publicada" value={formatFecha(lic.publicada)} />
                <Fact icon={ShieldCheck} label="Garantía de seriedad" value={lic.garantia > 0 ? `${lic.garantia}% de la oferta` : "No requerida"} />
                {lic.oferentes != null && (
                  <Fact icon={Users} label="Oferentes registrados" value={`${lic.oferentes}`} />
                )}
              </dl>
            </div>

            {/* Affinity */}
            <div className="rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center gap-4">
                <ScoreRing score={score} size={64} stroke={6} />
                <div>
                  <p className={cn("text-sm font-semibold", nivel.color)}>{nivel.label}</p>
                  <p className="text-xs text-ink-soft">
                    Afinidad con tu perfil de capacidad
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Calculada a partir de la categoría, la ubicación, el rango de monto
                y la urgencia del proceso frente a tu perfil.
              </p>
            </div>

            <TenderActions id={lic.id} />
          </aside>
        </div>

        {/* Related */}
        {similares.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Procesos similares
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similares.map((l) => (
                <TenderCard key={l.id} lic={l} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-2 text-ink-soft">
        <Icon className="h-4 w-4" />
        {label}
      </dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
