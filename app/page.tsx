import type { Metadata } from "next";
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
import { diasHasta, formatFecha, formatMagnitud, formatMonto, formatPesos } from "@/lib/format";
import { SECCIONES } from "@/lib/secciones";
import { INSTITUCIONES, hrefInstitucion } from "@/lib/instituciones";
import { consultarNormativa } from "@/lib/normativa";
import { desdeMayusculas } from "@/lib/congreso";
import { cn } from "@/lib/cn";
import { Esqueleto } from "@/components/esqueleto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowRight,
  IconChartBar,
  IconClock,
  IconCoins,
  IconLayers,
  IconSearch,
  IconTrendingUp,
} from "@/components/icons";
import { MarcaEstado } from "@/components/marca-estado";
import { Portada } from "@/components/portada";
import { SeccionBolsillo } from "@/components/fuentes-nuevas/indicadores-bolsillo";
import { AlertasTiempo } from "@/components/fuentes-nuevas/alertas-tiempo";
import { SiniestralidadVial } from "@/components/fuentes-nuevas/siniestralidad-vial";
import { DiaElectrico } from "@/components/fuentes-nuevas/dia-electrico";
import { IndicadoresMacro } from "@/components/fuentes-nuevas/indicadores-macro";
import { ComercioExterior } from "@/components/fuentes-nuevas/comercio-exterior";
import { InflacionTurismo } from "@/components/fuentes-nuevas/inflacion-turismo";
import { IndicadoresBanca } from "@/components/fuentes-nuevas/indicadores-banca";
import { EstadisticasJudiciales } from "@/components/fuentes-nuevas/estadisticas-judiciales";
import { enlace } from "@/lib/grafo";

export const revalidate = 1800;

export const metadata: Metadata = { alternates: { canonical: "/" } };

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
      <Portada
        principal
        rotulo="República Dominicana · fuentes oficiales leídas en vivo"
        titulo="¿Qué compra, qué legisla y a quién le paga el Estado?"
        descripcion={
          <p className="sm:text-base">
            Fuentes oficiales leídas en vivo y puestas en un mismo lugar: compras
            públicas, Congreso Nacional, normativa del Ejecutivo, nómina estatal y
            deuda pública. Sin intermediarios y sin copiar los datos a ningún lado
            — y con un piloto de voto ciudadano sobre lo que se legisla.
          </p>
        }
      >
        {/*
          Una sola caja para toda la plataforma: quien llega con una pregunta
          concreta —«MINERD», «Ley 47-20», un RNC— no tiene que saber antes en
          qué vertical vive. Es un formulario GET a /buscar: funciona sin
          JavaScript y la búsqueda queda en la URL.
        */}
        <form action="/buscar" method="get" role="search" className="mb-4 flex max-w-xl gap-2">
          <label htmlFor="buscar-portada" className="sr-only">
            Buscar en toda la plataforma
          </label>
          <Input
            id="buscar-portada"
            name="q"
            type="search"
            enterKeyHint="search"
            placeholder="Una institución, una ley, un RNC, un tema…"
            className="border-canvas/25 bg-canvas text-ink"
          />
          <Button type="submit" size="lg" className="shrink-0 bg-canvas text-ink hover:bg-surface">
            <IconSearch className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Buscar</span>
          </Button>
        </form>
        <div className="flex flex-wrap gap-2.5">
          {/*
            Sobre la banda de tinta la llamada principal se invierte: papel
            sobre tinta. El `hover` sube a `surface` —la hoja—, que es un paso
            real de la escala y no el mismo relleno repetido.
          */}
          <Button asChild size="lg" className="bg-canvas text-ink hover:bg-surface">
            <Link href="/licitaciones">
              <IconSearch className="h-4 w-4" />
              Buscar licitaciones
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="tinta"
            className="border border-canvas/20 bg-canvas/10 text-canvas hover:bg-canvas/20"
          >
            <Link href="/congreso">
              <IconLayers className="h-4 w-4" />
              Explorar el Congreso
            </Link>
          </Button>
        </div>
      </Portada>

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

      {/* Las puertas que no son un dominio con cifras: la institución, lo que
          decreta el Ejecutivo y el voto ciudadano. */}
      <section className="grid gap-4 lg:grid-cols-3">
        <PuertaInstituciones />
        <Suspense fallback={<Esqueleto className="h-[220px]" />}>
          <PuertaNormativa />
        </Suspense>
        <PuertaDemocracia />
      </section>

      {/*
        Indicadores macro del Estado. La silueta lleva dos alturas: en teléfono
        la tarjeta apila sus tres casillas y mide más que en la fila de tres de
        escritorio.
      */}
      <Suspense fallback={<Esqueleto className="h-[404px] sm:h-[200px]" />}>
        <SeccionDeuda />
      </Suspense>

      {/* Lo que el Estado fija y se paga de bolsillo: combustibles y dólar. */}
      <SeccionBolsillo />

      {/* La economía: remesas, reservas y tasa activa (BCRD); lo que entra y sale por Aduanas. */}
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Economía y comercio exterior">
        <Suspense fallback={<Esqueleto className="h-[780px] sm:h-[420px]" />}>
          <IndicadoresMacro />
        </Suspense>
        <Suspense fallback={<Esqueleto className="h-[780px] sm:h-[420px]" />}>
          <ComercioExterior />
        </Suspense>
      </section>

      {/* Precios y turismo: las dos series del BCRD que solo vienen en .xls viejo (instantánea). */}
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Precios, turismo y banca">
        <Suspense fallback={<Esqueleto className="h-[640px] sm:h-[460px]" />}>
          <InflacionTurismo />
        </Suspense>
        <Suspense fallback={<Esqueleto className="h-[520px] sm:h-[420px]" />}>
          <IndicadoresBanca />
        </Suspense>
      </section>

      {/* La carga de los tribunales ordinarios, del boletín mensual del Poder Judicial (instantánea). */}
      <Suspense fallback={<Esqueleto className="h-[640px] sm:h-[460px]" />}>
        <EstadisticasJudiciales />
      </Suspense>

      {/* Lo que el Estado avisa y registra de la calle: la luz, el tiempo y las vías. */}
      <section className="grid gap-4 lg:grid-cols-3" aria-label="Luz, tiempo y vías">
        <Suspense fallback={<Esqueleto className="h-[280px]" />}>
          <DiaElectrico />
        </Suspense>
        <Suspense fallback={<Esqueleto className="h-[220px]" />}>
          <AlertasTiempo />
        </Suspense>
        <Suspense fallback={<Esqueleto className="h-[300px]" />}>
          <SiniestralidadVial />
        </Suspense>
      </section>

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

      {/* El pie del panorama declara los límites: a 12 px en un teléfono nadie lo lee. */}
      <p className="px-1 text-[13px] leading-relaxed text-ink-soft sm:text-xs">
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

/* ---------------------------------------------------------------- puertas */

/** Seis ministerios que casi todo el mundo busca, como atajo a su ficha. */
function PuertaInstituciones() {
  const atajos = ["MINERD", "MISPAS", "MOPC", "MIREX", "MIDE", "MIP"]
    .map((siglas) => INSTITUCIONES.find((i) => i.acronimo === siglas))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));
  return (
    <Card as="article" className="flex flex-col p-5">
      <CardTitle className="text-base tracking-tight">Instituciones</CardTitle>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        Cada ministerio, dirección, hospital y ayuntamiento en una página: su
        presupuesto, lo que compra y a quién, su nómina y lo que se decreta sobre él.
      </p>
      {/*
        Seis siglas de 16 px de alto con cuatro de aire eran seis objetivos que
        el pulgar no acierta. Cada atajo es un mando de la talla de la casa
        —44 px en el teléfono, 40 desde `sm`— y lleva el nombre entero en el
        `title` y en lo que lee un lector de pantalla.
      */}
      <ul className="mt-3 flex flex-1 flex-wrap content-start gap-2">
        {atajos.map((i) => (
          <li key={i.id}>
            <Button asChild variant="outline" className="px-3 font-mono text-xs tracking-wide text-brand-700">
              <Link href={hrefInstitucion(i)} title={i.nombre} aria-label={`${i.nombre} (${i.acronimo})`}>
                {i.acronimo}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <Button asChild variant="link" className="mt-3 justify-start gap-1.5 px-0 font-semibold">
        <Link href="/instituciones">
          Todas las instituciones
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}

/** Los decretos más recientes, del año en curso. */
async function PuertaNormativa() {
  const { docs, origen } = await consultarNormativa("3", new Date().getFullYear());
  const recientes = docs.slice(0, 3);
  return (
    <Card as="article" className="flex flex-col p-5">
      <CardTitle className="text-base tracking-tight">Lo último que decretó el Ejecutivo</CardTitle>
      {origen === null ? (
        <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
          La Consultoría Jurídica no respondió. Los decretos vuelven solos cuando el
          origen se restablece.
        </p>
      ) : recientes.length === 0 ? (
        <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
          Todavía no hay decretos publicados este año.
        </p>
      ) : (
        <ul className="mt-2 flex-1 divide-y divide-hairline">
          {recientes.map((d) => (
            <li key={d.numero} className="py-2">
              <Link href={enlace.norma("decreto", d.numero) ?? "/normativa"} className="group block">
                <span className="font-mono text-xs font-semibold tabular-nums text-brand-700">
                  Decreto {d.numero}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-ink group-hover:text-brand-700">
                  {desdeMayusculas(d.titulo)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {origen && origen !== "vivo" && (
        <p className="mt-1 text-xs text-ink-soft">Instantánea del {formatFecha(origen)}.</p>
      )}
      <Button asChild variant="link" className="mt-3 justify-start gap-1.5 px-0 font-semibold">
        <Link href="/normativa">
          Toda la normativa
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}

function PuertaDemocracia() {
  return (
    <Card as="article" className="flex flex-col p-5">
      <CardTitle className="text-base tracking-tight">Tu voto sobre lo que se legisla</CardTitle>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
        Un piloto de voto ciudadano: lee una iniciativa del Congreso y di si estás
        a favor o en contra. Una cédula, un voto por iniciativa; después de votar
        ves cuántos opinaron como tú.
      </p>
      <Button asChild variant="link" className="mt-3 justify-start gap-1.5 px-0 font-semibold">
        <Link href="/congreso">
          Elegir una iniciativa para votar
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
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
    <Card as="section" className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4 text-ink-soft" />
            Deuda pública
          </CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">
            Sector Público No Financiero · saldo a {deuda.periodo}
          </p>
        </div>
        {/*
          El enlace al origen medía 100 × 16 px: en un teléfono eso no se
          acierta. Toma la altura de la primitiva y los márgenes negativos
          devuelven el bloque a su sitio, así que el objetivo crece sin que el
          diseño se mueva.
        */}
        <Button asChild variant="link" className="-my-2 -mr-2 px-2 text-xs">
          <a
            href="https://www.creditopublico.gob.do/inicio/estadisticas"
            target="_blank"
            rel="noopener noreferrer"
          >
            Crédito Público ↗
          </a>
        </Button>
      </div>
      {/*
        A 390 px las tres casillas en fila de tres partían «US$ 61.5 mil
        millones» en cuatro líneas y la última se recortaba contra el filete:
        la cifra más grande de la página quedaba ilegible. En teléfono las tres
        se apilan y cada una pone su etiqueta a la izquierda y su cifra a la
        derecha —la fila completa da los 326 px que el monto necesita—; desde
        `sm`, donde caben, vuelven a la fila de tres con la etiqueta encima.
      */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-4">
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
    </Card>
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
                href={enlace.proceso(p.codigo_proceso)}
                className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-canvas/60"
              >
                <Badge
                  forma="etiqueta"
                  variant="alerta"
                  className="mt-0.5 font-mono tabular-nums ring-1 ring-inset ring-alerta-600/20"
                >
                  {dias === 0 ? "hoy" : `${dias} d`}
                </Badge>
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
        <Vacio
          caida
          texto="La DGCP no respondió. Los datos vuelven solos cuando el origen se restablece."
        />
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
                href={enlace.iniciativa(ini.id)}
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
    <Card as="article" className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <CardTitle className="text-base tracking-tight">{titulo}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">{fuente}</p>
        </div>
      </div>

      {disponible ? (
        <dl className="mt-4 flex-1 space-y-2.5">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="flex items-baseline justify-between gap-3">
              {/*
                En teléfono la tarjeta ocupa el ancho entero y la etiqueta
                puede respirar a 13 px; desde `sm` la rejilla la estrecha a un
                cuarto de pantalla y vuelve a 12 px para no partirse.
              */}
              <dt className="text-[13px] leading-snug text-ink-soft sm:text-xs">
                {c.etiqueta}
              </dt>
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
        /*
          Una fuente caída no se puede leer como un dato: la marca en ocre dice
          en una palabra que no pudimos mirar —no que no haya nada— y el párrafo
          añade lo que sigue en pie. La acción útil es la misma de abajo: entrar
          a la vertical, que conserva lo que sí cargó.
        */
        <div className="mt-4 flex-1">
          <MarcaEstado tono="aviso">Sin respuesta</MarcaEstado>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            La fuente no respondió. Los datos vuelven solos cuando el origen se
            restablece.
          </p>
        </div>
      )}

      {/*
        La llamada de la tarjeta es el objetivo táctil principal del panorama:
        con `h-auto` medía 20 px de alto. Ahora toma la altura de la primitiva
        —44 px en teléfono, 40 desde `sm`— y `px-0` la mantiene a ras del
        margen de la tarjeta.
      */}
      <Button asChild variant="link" className="mt-3 justify-start gap-1.5 px-0 font-semibold">
        <Link href={href}>
          {cta}
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
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
    <Card as="article" aria-busy="true" className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${s.hue.chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <CardTitle className="text-base tracking-tight">{s.nombre}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">{s.descriptor}</p>
        </div>
      </div>
      {/*
        Las tres filas y la llamada miden aquí exactamente lo que miden llenas
        —28 px la cifra destacada, 20 px las otras dos, 44 px el enlace—, que
        es lo único que evita que la tarjeta dé un salto al llegar el dato.
      */}
      <div className="mt-4 flex-1 space-y-2.5">
        <div className="flex h-7 items-center justify-between gap-3">
          <Skeleton className="h-3 w-28 bg-hairline/70" />
          <Skeleton className="h-5 w-16 bg-hairline/70" />
        </div>
        <div className="flex h-5 items-center justify-between gap-3">
          <Skeleton className="h-3 w-24 bg-hairline/70" />
          <Skeleton className="h-3.5 w-20 bg-hairline/70" />
        </div>
        <div className="flex h-5 items-center justify-between gap-3">
          <Skeleton className="h-3 w-32 bg-hairline/70" />
          <Skeleton className="h-3.5 w-12 bg-hairline/70" />
        </div>
      </div>
      <span className="mt-3 flex h-11 items-center text-sm text-ink-soft sm:h-10">
        Consultando la fuente…
      </span>
    </Card>
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
    <Card as="section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ink-soft" />
          {titulo}
        </CardTitle>
        {/*
          «Se archivan al cerrar la legislatura» no deja sitio para el enlace a
          390 px y la cabecera envuelve: `ml-auto` lo manda igualmente al
          margen derecho en el renglón de abajo, en vez de dejarlo alineado con
          el titular como si fuera un subtítulo.
        */}
        <CardAction className="ml-auto">
          <Button asChild variant="link" className="-my-1.5 -mr-2 px-2 text-xs">
            <Link href={href}>Ver todas</Link>
          </Button>
        </CardAction>
      </CardHeader>
      {children}
      <span className="sr-only">{nota}</span>
    </Card>
  );
}

function PanelEsqueleto({ titulo, href, Icon }: { titulo: string; href: string; Icon: Icono }) {
  return (
    <div aria-busy="true">
      <Panel titulo={titulo} nota="" href={href} Icon={Icon}>
        {/*
          Cinco filas de 82 px con su filete: exactamente las que va a haber y
          exactamente lo que miden llenas —sello, dos líneas de titular y la
          línea de registro—. El bloque de párrafos genérico que había antes
          medía 160 px contra los 410 del contenido, y el panorama entero daba
          un tirón de un cuarto de pantalla al llegar el dato.
        */}
        <ul aria-hidden className="divide-y divide-hairline">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex h-[82px] items-start gap-3 px-5 py-3">
              <Skeleton className="h-[18px] w-11 shrink-0 bg-hairline/70" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-11/12 bg-hairline/70" />
                <Skeleton className="h-3.5 w-2/3 bg-hairline/70" />
                <Skeleton className="h-3 w-1/3 bg-hairline/70" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/**
 * El hueco de un panel. `caida` lo separa de «no hay nada»: con la marca en
 * ocre delante, el lector sabe que no pudimos mirar —no que el Estado no tenga
 * nada que cerrar esta semana—, que es la distinción que manda la ergonomía.
 * El texto sube a 14 px: a 12 px centrados en medio de un panel vacío parecía
 * una nota al pie de algo que no estaba.
 */
function Vacio({ texto, caida = false }: { texto: string; caida?: boolean }) {
  return (
    <div className="px-5 py-8 text-center">
      {caida && <MarcaEstado tono="aviso">Sin respuesta</MarcaEstado>}
      <p className={`text-sm leading-relaxed text-ink-soft ${caida ? "mt-2" : ""}`}>
        {texto}
      </p>
    </div>
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
  /*
    La destacada se queda apilada también en teléfono: «US$ 61.5 mil millones»
    a 18 px necesita los 326 px de la fila entera, y compartiéndola con su
    etiqueta se partía en dos. Externa e interna van a 16 px y sí caben al lado
    de la suya, que es lo que las deja leerse como el desglose de la de arriba.
  */
  return (
    <Card
      className={cn(
        "bg-canvas/60 px-4 py-3",
        destacar ? "block" : "flex items-baseline justify-between gap-3 sm:block",
      )}
    >
      <div className="shrink-0 text-[13px] text-ink-soft sm:text-xs">{etiqueta}</div>
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
            : "font-mono text-base font-semibold tabular-nums text-ink sm:mt-0.5"
        }
      >
        {valor}
      </div>
    </Card>
  );
}
