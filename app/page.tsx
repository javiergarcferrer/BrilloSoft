import Link from "next/link";
import { dgcpFetch, type Proceso } from "@/lib/dgcp";
import {
  VENTANA_ALERTA_DIAS,
  diffDias,
  getCountIniciativas,
  legislaturaVigente,
  muestrearIniciativas,
  resumirIniciativas,
} from "@/lib/congreso";
import { formatCompactDOP, formatInt } from "@/lib/nomina";
import { getResumenNomina } from "@/lib/nomina-server";
import { formatMonto, diasHasta } from "@/lib/format";
import {
  IconArrowRight,
  IconChartBar,
  IconClock,
  IconCoins,
  IconLayers,
  IconSearch,
  IconSparkles,
} from "@/components/icons";

export const revalidate = 1800;

/** Páginas del SIL que alimentan el panorama (10 iniciativas por página). */
const PAGINAS_CONGRESO = 10;

function hace(dias: number): string {
  const d = new Date(Date.now() - dias * 86400000);
  return d.toISOString().slice(0, 10);
}

export default async function Panorama() {
  const [compras, censoCongreso, muestraCongreso, nomina] = await Promise.all([
    dgcpFetch<Proceso>("/procesos", { startdate: hace(30), limit: 1000 }, 1800).catch(
      () => null,
    ),
    getCountIniciativas(),
    muestrearIniciativas(PAGINAS_CONGRESO),
    getResumenNomina(),
  ]);

  /* --- compras públicas --- */
  const procesos = compras?.payload.content ?? [];
  const abiertos = procesos.filter((p) => p.estado_proceso === "Proceso publicado");
  const montoAbierto = abiertos.reduce((s, p) => s + (p.monto_estimado || 0), 0);
  const cierranPronto = abiertos
    .map((p) => ({ p, dias: diasHasta(p.fecha_fin_recepcion_ofertas) }))
    .filter((x) => x.dias !== null && x.dias >= 0 && x.dias <= 7)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  /* --- congreso --- */
  const resumen = resumirIniciativas(muestraCongreso.iniciativas);
  const legislatura = legislaturaVigente();
  const diasCierre = legislatura ? diffDias(new Date(), legislatura.cierre) : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative p-6 sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15">
            <IconSparkles className="h-3.5 w-3.5" />
            Inteligencia sobre el Estado dominicano
          </div>

          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Qué compra, qué legisla y a quién paga el Estado
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Tres fuentes oficiales, leídas en vivo y puestas en un mismo lugar:
            compras públicas de la DGCP, iniciativas del Congreso Nacional y la
            nómina pública. Sin intermediarios y sin copiar los datos a ningún lado.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/licitaciones"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 active:scale-95"
            >
              <IconSearch className="h-4 w-4" />
              Buscar licitaciones
            </Link>
            <Link
              href="/congreso"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/15 active:scale-95"
            >
              <IconLayers className="h-4 w-4" />
              Explorar el Congreso
            </Link>
          </div>
        </div>
      </section>

      {/* Dominios */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Dominio
          titulo="Compras públicas"
          fuente="DGCP · datos abiertos"
          href="/licitaciones"
          cta="Buscar procesos"
          Icon={IconCoins}
          disponible={compras !== null}
          cifras={
            compras
              ? [
                  {
                    etiqueta: "Abiertos para ofertar",
                    valor: formatInt(abiertos.length),
                    destacar: true,
                  },
                  {
                    etiqueta: "Monto en juego",
                    valor: formatMonto(montoAbierto, "DOP"),
                  },
                  {
                    etiqueta: "Publicados (30 días)",
                    valor: formatInt(procesos.length),
                  },
                ]
              : []
          }
        />

        <Dominio
          titulo="Congreso Nacional"
          fuente="SIL · Cámara de Diputados"
          href="/congreso"
          cta="Ver iniciativas"
          Icon={IconLayers}
          disponible={censoCongreso !== null}
          cifras={
            censoCongreso !== null
              ? [
                  {
                    etiqueta: "Iniciativas en el registro",
                    valor: formatInt(censoCongreso),
                    destacar: true,
                  },
                  ...(diasCierre !== null
                    ? [
                        {
                          etiqueta: "Días de legislatura",
                          valor: `${diasCierre}`,
                        },
                      ]
                    : []),
                  {
                    etiqueta: `Vigentes (de ${muestraCongreso.muestra})`,
                    valor: formatInt(resumen.vivas),
                  },
                ]
              : []
          }
        />

        <Dominio
          titulo="Nómina estatal"
          fuente="Empleados fijos · 2023–2026"
          href="/nomina"
          cta="Explorar la nómina"
          Icon={IconChartBar}
          disponible={nomina !== null}
          cifras={
            nomina
              ? [
                  {
                    etiqueta: `Plazas · ${nomina.ultimoPeriodo}`,
                    valor: formatInt(nomina.plazas),
                    destacar: true,
                  },
                  {
                    etiqueta: "Gasto mensual",
                    valor: formatCompactDOP(nomina.gastoMensual),
                  },
                  {
                    etiqueta: "Registros históricos",
                    valor: formatInt(nomina.registros),
                  },
                ]
              : []
          }
        />
      </section>

      {/* Señales que exigen atención */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel
          titulo="Cierran esta semana"
          nota={`${cierranPronto.length}`}
          href="/licitaciones?preset=cierran"
          Icon={IconClock}
        >
          {cierranPronto.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {cierranPronto.slice(0, 5).map(({ p, dias }) => (
                <li key={p.codigo_proceso}>
                  <Link
                    href={`/procesos/${encodeURIComponent(p.codigo_proceso)}`}
                    className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-canvas/60"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      {dias === 0 ? "hoy" : `${dias} d`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm text-ink">
                        {p.titulo}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {p.unidad_compra}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio texto="Ningún proceso abierto cierra en los próximos 7 días." />
          )}
        </Panel>

        <Panel
          titulo="Por perimir en el Congreso"
          nota={`${resumen.enRiesgo.length}`}
          href="/congreso/perencion"
          Icon={IconClock}
        >
          {resumen.enRiesgo.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {resumen.enRiesgo.slice(0, 5).map((ini) => (
                <li key={ini.id}>
                  <Link
                    href={`/congreso/${ini.id}`}
                    className="block px-5 py-3 transition-colors hover:bg-canvas/60"
                  >
                    <span className="line-clamp-2 block text-sm text-ink">
                      {ini.titulo}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs tabular-nums text-ink-soft">
                      {ini.numero?.completo ?? `#${ini.id}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio
              texto={
                legislatura && diasCierre !== null
                  ? `La legislatura cierra en ${diasCierre} días; la alerta se activa a ${VENTANA_ALERTA_DIAS}.`
                  : "Sin legislatura ordinaria en curso."
              }
            />
          )}
        </Panel>
      </section>

      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Herramienta independiente y no oficial. Los datos se muestran tal como los
        publican sus fuentes y se leen en vivo, sin base de datos intermedia. Las
        cifras del Congreso marcadas “de {muestraCongreso.muestra}” salen de una
        muestra acotada, no del corpus completo —{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          ver el estado y los límites de cada fuente
        </Link>
        .
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- piezas */

type Cifra = { etiqueta: string; valor: string; destacar?: boolean };

function Dominio({
  titulo,
  fuente,
  href,
  cta,
  Icon,
  cifras,
  disponible,
}: {
  titulo: string;
  fuente: string;
  href: string;
  cta: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  cifras: Cifra[];
  disponible: boolean;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">{titulo}</h2>
          <p className="mt-0.5 text-xs text-ink-soft">{fuente}</p>
        </div>
      </div>

      {disponible ? (
        <dl className="mt-4 flex-1 space-y-2.5">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="flex items-baseline justify-between gap-3">
              <dt className="text-xs text-ink-soft">{c.etiqueta}</dt>
              <dd
                className={
                  c.destacar
                    ? "text-lg font-bold tabular-nums tracking-tight text-ink"
                    : "text-sm font-semibold tabular-nums text-ink"
                }
              >
                {c.valor}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
          La fuente no respondió. Los datos vuelven solos cuando el origen se
          restablece.
        </p>
      )}

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-600"
      >
        {cta}
        <IconArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function Panel({
  titulo,
  nota,
  href,
  Icon,
  children,
}: {
  titulo: string;
  nota: string;
  href: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-ink-soft" />
          {titulo}
        </h2>
        <Link
          href={href}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Ver todas
        </Link>
      </div>
      {children}
      <span className="sr-only">{nota}</span>
    </section>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="px-5 py-10 text-center text-xs leading-relaxed text-ink-soft">
      {texto}
    </p>
  );
}
