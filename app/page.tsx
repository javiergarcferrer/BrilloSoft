import Link from "next/link";
import { Suspense, cache } from "react";
import { dgcpFetch, type Proceso } from "@/lib/dgcp";
import {
  SIL_PAGE_SIZE,
  VENTANA_ALERTA_DIAS,
  diffDias,
  getCountIniciativas,
  legislaturaVigente,
  muestrearIniciativas,
  resumirIniciativas,
  type Legislatura,
} from "@/lib/congreso";
import { getCensoSenado } from "@/lib/senado";
import { getDeuda } from "@/lib/deuda";
import { etiquetaCorte, getResumenFiscal } from "@/lib/fiscal";
import { formatCompactDOP, formatInt } from "@/lib/nomina";
import { getResumenNomina } from "@/lib/nomina-server";
import { diasHasta, formatMagnitud, formatMonto, formatPesos } from "@/lib/format";
import { SECCIONES } from "@/lib/secciones";
import { Esqueleto, EsqueletoLineas } from "@/components/esqueleto";
import {
  IconArrowRight,
  IconChartBar,
  IconClock,
  IconCoins,
  IconLayers,
  IconSearch,
  IconTrendingUp,
} from "@/components/icons";

export const revalidate = 1800;

/** Páginas del SIL que alimentan el panorama (10 iniciativas por página). */
const PAGINAS_CONGRESO = 10;

/**
 * La fecha ISO de hace N días, para acotar una consulta al origen.
 *
 * No confundir con `hace()` de `lib/format.ts`, que hace lo contrario: recibe
 * una fecha y devuelve «hace 4 meses» para que lo lea una persona. Este toma
 * un número de días y devuelve `2026-08-05` para que lo lea la DGCP. Se
 * llamaba igual que aquella y la tapaba dentro de este archivo.
 */
function fechaHaceDias(dias: number): string {
  const d = new Date(Date.now() - dias * 86400000);
  return d.toISOString().slice(0, 10);
}

/**
 * Los procesos de los últimos 30 días alimentan dos piezas —el dominio de
 * compras y el panel de cierres— que ahora se renderizan por separado:
 * `cache` garantiza una sola lectura por render, pase lo que pase con la
 * memorización de `fetch`.
 */
const procesosRecientes = cache(() =>
  dgcpFetch<Proceso>("/procesos", { startdate: fechaHaceDias(30), limit: 1000 }, 1800).catch(
    () => null,
  ),
);

/*
  Cada pieza del panorama espera solo a su fuente. Antes un único
  `Promise.all` retenía la página entera hasta que respondía la más lenta
  —diez páginas del SIL, o la DGCP en un mal momento—; ahora el hero y la
  estructura llegan de inmediato y cada tarjeta o panel cae en su hueco
  cuando su origen contesta. Con `revalidate` la página sigue sirviéndose
  cacheada; el streaming cuenta en la primera generación y en cada
  regeneración, que es donde el lector esperaba.
*/
export default function Panorama() {
  const legislatura = legislaturaVigente();
  const diasCierre = legislatura ? diffDias(new Date(), legislatura.cierre) : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg bg-ink text-canvas">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div className="relative p-6 sm:p-9">
          <div className="rotulo inline-flex items-center gap-2 text-canvas/70">
            <span
              aria-hidden
              className="mt-[0.45em] h-1.5 w-1.5 shrink-0 self-start rounded-full bg-sello-400"
            />
            República Dominicana · fuentes oficiales leídas en vivo
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] sm:text-5xl">
            ¿Qué compra, qué legisla y a quién le paga el Estado?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-canvas/70 sm:text-base">
            Fuentes oficiales leídas en vivo y puestas en un mismo lugar: compras
            públicas, Congreso Nacional, normativa del Ejecutivo, nómina estatal y
            deuda pública. Sin intermediarios y sin copiar los datos a ningún lado
            — y con un piloto de voto ciudadano sobre lo que se legisla.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/licitaciones"
              className="inline-flex items-center gap-2 rounded-lg bg-canvas px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface active:scale-95"
            >
              <IconSearch className="h-4 w-4" />
              Buscar licitaciones
            </Link>
            <Link
              href="/congreso"
              className="inline-flex items-center gap-2 rounded-lg border border-canvas/20 bg-canvas/10 px-5 py-2.5 text-sm font-semibold text-canvas ring-1 ring-inset ring-canvas/20 transition-colors hover:bg-canvas/15 active:scale-95"
            >
              <IconLayers className="h-4 w-4" />
              Explorar el Congreso
            </Link>
          </div>
        </div>
      </section>

      {/* Dominios: cada tarjeta espera solo a su fuente */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<DominioEsqueleto seccion="licitaciones" Icon={IconCoins} />}>
          <DominioCompras />
        </Suspense>
        <Suspense fallback={<DominioEsqueleto seccion="finanzas" Icon={IconTrendingUp} />}>
          <DominioFinanzas />
        </Suspense>
        <Suspense fallback={<DominioEsqueleto seccion="congreso" Icon={IconLayers} />}>
          <DominioCongreso diasCierre={diasCierre} />
        </Suspense>
        <Suspense fallback={<DominioEsqueleto seccion="nomina" Icon={IconChartBar} />}>
          <DominioNomina />
        </Suspense>
      </section>

      {/* Indicadores macro del Estado */}
      <Suspense fallback={<Esqueleto className="h-44" />}>
        <SeccionDeuda />
      </Suspense>

      {/* Señales que exigen atención */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Suspense
          fallback={
            <PanelEsqueleto
              titulo="Cierran esta semana"
              href="/licitaciones?orden=cierre"
              Icon={IconClock}
            />
          }
        >
          <PanelCierran />
        </Suspense>
        <Suspense
          fallback={
            <PanelEsqueleto
              titulo="Se archivan al cerrar la legislatura"
              href="/congreso/perencion"
              Icon={IconClock}
            />
          }
        >
          <PanelPerencion legislatura={legislatura} diasCierre={diasCierre} />
        </Suspense>
      </section>

      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Herramienta independiente y no oficial. Los datos se muestran tal como los
        publican sus fuentes y se leen en vivo, sin base de datos intermedia. Las
        cifras del Congreso marcadas “de {PAGINAS_CONGRESO * SIL_PAGE_SIZE}” salen
        de una muestra acotada, no del corpus completo —{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          ver el estado y los límites de cada fuente
        </Link>
        .
      </p>
    </div>
  );
}

/* ------------------------------------------------------- piezas asíncronas */

async function DominioCompras() {
  const compras = await procesosRecientes();
  const procesos = compras?.payload.content ?? [];
  const abiertos = procesos.filter((p) => p.estado_proceso === "Proceso publicado");
  const montoAbierto = abiertos.reduce((s, p) => s + (p.monto_estimado || 0), 0);

  return (
    <Dominio
      titulo={hue.licitaciones.nombre}
      fuente={hue.licitaciones.descriptor}
      chip={hue.licitaciones.hue.chip}
      href="/licitaciones"
      cta="Buscar procesos"
      Icon={IconCoins}
      disponible={compras !== null}
      cifras={
        compras
          ? [
              {
                etiqueta: "Abiertos ahora mismo",
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
  );
}

async function DominioFinanzas() {
  const fiscal = await getResumenFiscal();
  return (
    <Dominio
      titulo={hue.finanzas.nombre}
      fuente={hue.finanzas.descriptor}
      chip={hue.finanzas.hue.chip}
      href="/finanzas"
      cta="Ver la ejecución"
      Icon={IconTrendingUp}
      disponible={fiscal !== null}
      cifras={
        fiscal
          ? [
              {
                etiqueta: `Devengado en ${fiscal.anio}`,
                valor: formatPesos(fiscal.devengado),
                destacar: true,
              },
              {
                etiqueta: "De su presupuesto vigente",
                valor:
                  fiscal.ejecucion === null
                    ? "—"
                    : `${(fiscal.ejecucion * 100).toFixed(1)} %`,
              },
              {
                etiqueta: "Corte",
                valor: etiquetaCorte(fiscal.mesCorte, fiscal.anio),
              },
            ]
          : []
      }
    />
  );
}

async function DominioCongreso({ diasCierre }: { diasCierre: number | null }) {
  const [censoCongreso, censoSenado] = await Promise.all([
    getCountIniciativas(),
    getCensoSenado(),
  ]);

  return (
    <Dominio
      titulo={hue.congreso.nombre}
      fuente={hue.congreso.descriptor}
      chip={hue.congreso.hue.chip}
      href="/congreso"
      cta="Ver iniciativas"
      Icon={IconLayers}
      disponible={censoCongreso !== null || censoSenado !== null}
      cifras={[
        ...(censoCongreso !== null
          ? [
              {
                etiqueta: "Iniciativas en Diputados",
                valor: formatInt(censoCongreso),
                destacar: true,
              },
            ]
          : []),
        ...(censoSenado !== null
          ? [
              {
                etiqueta: "Expedientes en el Senado",
                valor: formatInt(censoSenado),
              },
            ]
          : []),
        ...(diasCierre !== null
          ? [{ etiqueta: "Cierra la legislatura en", valor: `${diasCierre} días` }]
          : []),
      ]}
    />
  );
}

async function DominioNomina() {
  const nomina = await getResumenNomina();
  return (
    <Dominio
      titulo={hue.nomina.nombre}
      fuente={hue.nomina.descriptor}
      chip={hue.nomina.hue.chip}
      href="/nomina"
      cta="Explorar la nómina"
      Icon={IconChartBar}
      disponible={nomina !== null}
      cifras={
        nomina
          ? [
              {
                etiqueta: "Empleados públicos contados",
                valor: formatInt(nomina.plazas),
                destacar: true,
              },
              {
                etiqueta: "Masa salarial mensual",
                valor: formatCompactDOP(nomina.gastoMensual),
              },
              {
                etiqueta: "Instituciones cubiertas",
                valor: formatInt(nomina.instituciones),
              },
            ]
          : []
      }
    />
  );
}

async function SeccionDeuda() {
  const deuda = await getDeuda();
  if (!deuda) return null;

  return (
    <section className="rounded-lg border border-hairline bg-surface p-5 ">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
            <IconTrendingUp className="h-4 w-4 text-ink-soft" />
            Deuda pública
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Sector Público No Financiero · saldo a {deuda.periodo}
          </p>
        </div>
        <a
          href="https://www.creditopublico.gob.do/inicio/estadisticas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Crédito Público ↗
        </a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <IndicadorDeuda
          etiqueta="Deuda total"
          valor={formatMagnitud(deuda.saldoTotal)}
          destacar
        />
        <IndicadorDeuda etiqueta="Externa" valor={formatMagnitud(deuda.saldoExterna)} />
        <IndicadorDeuda etiqueta="Interna" valor={formatMagnitud(deuda.saldoInterna)} />
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Fuente: Dirección General de Crédito Público del Ministerio de Hacienda.
        {deuda.desdeInstantanea && (
          <>
            {" "}
            Instantánea verificada del {deuda.generadoEn}: el servidor del origen
            no acepta lecturas desde la nube.
          </>
        )}
      </p>
    </section>
  );
}

async function PanelCierran() {
  const compras = await procesosRecientes();
  const procesos = compras?.payload.content ?? [];
  const cierranPronto = procesos
    .filter((p) => p.estado_proceso === "Proceso publicado")
    .map((p) => ({ p, dias: diasHasta(p.fecha_fin_recepcion_ofertas) }))
    .filter((x) => x.dias !== null && x.dias >= 0 && x.dias <= 7)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  return (
    <Panel
      titulo="Cierran esta semana"
      nota={`${cierranPronto.length}`}
      href="/licitaciones?orden=cierre"
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
                <span className="mt-0.5 shrink-0 rounded-md bg-alerta-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-alerta-600 ring-1 ring-inset ring-alerta-600/20">
                  {dias === 0 ? "hoy" : `${dias} d`}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm text-ink">{p.titulo}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-soft">
                    {p.unidad_compra}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : compras === null ? (
        <Vacio texto="La DGCP no respondió. Los datos vuelven solos cuando el origen se restablece." />
      ) : (
        <Vacio texto="Ningún proceso abierto cierra en los próximos 7 días." />
      )}
    </Panel>
  );
}

async function PanelPerencion({
  legislatura,
  diasCierre,
}: {
  legislatura: Legislatura | null;
  diasCierre: number | null;
}) {
  const muestra = await muestrearIniciativas(PAGINAS_CONGRESO);
  const resumen = resumirIniciativas(muestra.iniciativas);

  return (
    <Panel
      titulo="Se archivan al cerrar la legislatura"
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
                <span className="line-clamp-2 block text-sm text-ink">{ini.titulo}</span>
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
  );
}

/* ------------------------------------------------------------- piezas */

type Cifra = { etiqueta: string; valor: string; destacar?: boolean };
type Icono = (p: { className?: string }) => React.ReactElement;

/** Matices por vertical, indexados desde la fuente única de la IA. */
const hue = Object.fromEntries(SECCIONES.map((s) => [s.id, s])) as Record<
  (typeof SECCIONES)[number]["id"],
  (typeof SECCIONES)[number]
>;

function Dominio({
  titulo,
  fuente,
  chip,
  href,
  cta,
  Icon,
  cifras,
  disponible,
}: {
  titulo: string;
  fuente: string;
  chip: string;
  href: string;
  cta: string;
  Icon: Icono;
  cifras: Cifra[];
  disponible: boolean;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-hairline bg-surface p-5 ">
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="font-sans text-base font-semibold tracking-tight text-ink">{titulo}</h2>
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
                    ? "font-mono text-lg font-semibold tabular-nums tracking-tight text-ink"
                    : "font-mono text-sm font-semibold tabular-nums text-ink"
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

/** La tarjeta de un dominio con su cabecera real y las cifras aún en blanco. */
function DominioEsqueleto({
  seccion,
  Icon,
}: {
  seccion: keyof typeof hue;
  Icon: Icono;
}) {
  const s = hue[seccion];
  return (
    <article
      aria-busy="true"
      className="flex flex-col rounded-lg border border-hairline bg-surface p-5 "
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${s.hue.chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="font-sans text-base font-semibold tracking-tight text-ink">{s.nombre}</h2>
          <p className="mt-0.5 text-xs text-ink-soft">{s.descriptor}</p>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="shimmer h-3 w-28 rounded-md bg-hairline/70" />
          <div className="shimmer h-5 w-16 rounded-md bg-hairline/70" />
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="shimmer h-3 w-24 rounded-md bg-hairline/70" />
          <div className="shimmer h-3.5 w-20 rounded-md bg-hairline/70" />
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="shimmer h-3 w-32 rounded-md bg-hairline/70" />
          <div className="shimmer h-3.5 w-12 rounded-md bg-hairline/70" />
        </div>
      </div>
      <span className="mt-5 text-sm text-ink-soft">Consultando la fuente…</span>
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
  Icon: Icono;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface ">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
        <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-ink-soft" />
          {titulo}
        </h2>
        <Link href={href} className="text-xs font-medium text-brand-700 hover:underline">
          Ver todas
        </Link>
      </div>
      {children}
      <span className="sr-only">{nota}</span>
    </section>
  );
}

function PanelEsqueleto({ titulo, href, Icon }: { titulo: string; href: string; Icon: Icono }) {
  return (
    <div aria-busy="true">
      <Panel titulo={titulo} nota="" href={href} Icon={Icon}>
        <div className="space-y-4 px-5 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <EsqueletoLineas key={i} n={2} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="px-5 py-10 text-center text-xs leading-relaxed text-ink-soft">{texto}</p>
  );
}

function IndicadorDeuda({
  etiqueta,
  valor,
  destacar,
}: {
  etiqueta: string;
  valor: string;
  destacar?: boolean;
}) {
  return (
    <div className="rounded-lg bg-canvas/60 px-4 py-3 border border-hairline">
      <div className="text-xs text-ink-soft">{etiqueta}</div>
      {/*
        Las tres cifras son comparables entre sí, así que las tres van en mono
        tabular: lo único que distingue a la destacada es el tamaño. Con una
        en mono y dos en sans, los dígitos no alinean y el ojo lee dos de
        ellas como texto.
      */}
      <div
        className={
          destacar
            ? "mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-tight text-ink"
            : "mt-0.5 font-mono text-base font-semibold tabular-nums text-ink"
        }
      >
        {valor}
      </div>
    </div>
  );
}
