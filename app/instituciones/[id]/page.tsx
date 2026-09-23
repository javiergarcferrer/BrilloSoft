import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getComprasDeInstitucion,
  hrefInstitucion,
  institucionDeSlug,
  institucionesDelCapitulo,
  type Institucion,
  type SenalesDeCompra,
} from "@/lib/instituciones";
import { etiquetaCorte, getInstitucionFiscal } from "@/lib/fiscal";
import { getNominaDeInstitucion } from "@/lib/nomina-server";
import { normasDeInstitucion, RUTA_POR_TIPO } from "@/lib/normativa";
import { listPacc } from "@/lib/dgcp";
import { desdeMayusculas } from "@/lib/congreso";
import { formatFecha, formatMonto, formatPesos } from "@/lib/format";
import { formatDOP, formatInt } from "@/lib/nomina";
import { Ruta } from "@/components/ruta";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EsqueletoFilas } from "@/components/esqueleto";
import { EstadoVacio } from "@/components/estado-vacio";
import { IconExternal } from "@/components/icons";
import AccionesFicha from "@/components/acciones-ficha";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = institucionDeSlug((await params).id);
  if (!i) return { title: "Institución no encontrada" };
  return {
    title: i.nombre,
    description: `Qué compra, cuánto gasta, a quién le paga y qué decreta el Estado sobre ${i.nombre}: presupuesto, contratos, nómina y normativa en una sola página.`,
  };
}

/**
 * Ficha de institución: presupuesto, compras, nómina y normativa de un mismo
 * organismo, que en el Estado viven en cuatro catálogos que no se hablan.
 *
 * El presupuesto y la nómina salen de instantáneas locales y llegan con la
 * página; las compras y el plan anual consultan la DGCP en vivo y caen cada
 * una en su hueco al contestar, para que una API lenta no retenga lo demás.
 */
export default async function InstitucionPage({ params }: Props) {
  const i = institucionDeSlug((await params).id);
  if (!i) notFound();

  const [fiscal, nomina, normas] = await Promise.all([
    i.capitulo ? getInstitucionFiscal(i.capitulo) : null,
    i.nomina ? getNominaDeInstitucion(i.nomina) : null,
    normasDeInstitucion(i.consultoria),
  ]);
  const hermanas = i.capitulo ? institucionesDelCapitulo(i.capitulo).filter((h) => h.id !== i.id) : [];

  return (
    <div className="space-y-5">
      <Ruta raiz={{ href: "/instituciones", label: "Instituciones" }} actual={i.acronimo || i.nombre} />

      <Card as="section" className="p-5 sm:p-6">
        <div className="rotulo text-ink-soft">
          {[i.tipo, i.acronimo].filter(Boolean).join(" · ")}
        </div>
        <h1 className="mt-1 font-display text-2xl leading-tight sm:text-3xl">{i.nombre}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Lo que el Estado publica sobre esta institución en cuatro sitios distintos,
          reunido aquí: su presupuesto, lo que compra y a quién, su nómina y lo que
          el Ejecutivo decreta sobre ella.
        </p>
        <AccionesFicha
          className="mt-3"
          tipo="institucion"
          id={String(i.id)}
          titulo={i.nombre}
          href={hrefInstitucion(i)}
          feed={`/api/feed?uc=${i.id}`}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant={i.capitulo ? "firma" : "neutro"}>
            {i.capitulo ? `Presupuesto · capítulo ${i.capitulo}` : "Sin capítulo presupuestario"}
          </Badge>
          <Badge variant="firma">Compras · DGCP {i.id}</Badge>
          {i.nomina && <Badge variant="firma">Nómina publicada</Badge>}
          {normas.docs.length > 0 && <Badge variant="firma">Normativa</Badge>}
        </div>
      </Card>

      {fiscal ? (
        <Presupuesto datos={fiscal} institucion={i} hermanas={hermanas} />
      ) : (
        <EstadoVacio rotulo="Presupuesto" titulo="Sin presupuesto propio en el SIGEF">
          La DGCP no adscribe esta unidad de compra a un capítulo del Presupuesto
          General del Estado —pasa con ayuntamientos, empresas públicas y órganos
          con presupuesto aparte—, así que su gasto no aparece en la instantánea
          del SIGEF.
        </EstadoVacio>
      )}

      <Suspense fallback={<Cargando titulo="Compras" texto="Consultando sus contratos en la DGCP…" />}>
        <Compras institucion={i} />
      </Suspense>

      {nomina && (
        <Card as="section" className="p-5 sm:p-6">
          <CardTitle>Nómina</CardTitle>
          <p className="mt-1 text-xs text-ink-soft">
            Foto de {nomina.periodo}: el último mes que la institución publicó en
            formato procesable. Sin nombres: cargo y sueldo bruto.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <Cifra etiqueta="Plazas" valor={formatInt(nomina.plazas)} />
            <Cifra etiqueta="Masa salarial del mes" valor={formatPesos(nomina.masa)} />
            <Cifra etiqueta="Sueldo mediano" valor={formatDOP(nomina.mediana)} />
          </dl>
          <ul className="mt-4 divide-y divide-hairline text-sm">
            {nomina.cargos.map((c) => (
              <li key={c.cargo} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">{desdeMayusculas(c.cargo)}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-ink-soft">
                  {formatInt(c.plazas)} · {formatDOP(c.mediana)}
                </span>
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-4">
            <Link href={`/nomina?inst=${encodeURIComponent(nomina.codigo)}`}>Explorar su nómina</Link>
          </Button>
        </Card>
      )}

      <Card as="section" className="p-5 sm:p-6">
        <CardTitle>Lo que decreta el Ejecutivo</CardTitle>
        {normas.docs.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            La Consultoría Jurídica no etiqueta con esta institución ninguna norma
            de los últimos cuatro años.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-ink-soft">
              {formatInt(normas.docs.length)} normas que la Consultoría Jurídica
              etiqueta con esta institución, de las más recientes a las más antiguas.
            </p>
            <ul className="mt-3 divide-y divide-hairline">
              {normas.docs.slice(0, 10).map((d) => {
                const ruta = RUTA_POR_TIPO[d.tipo];
                const href = ruta ? `/normativa/${ruta}/${d.numero}` : d.url;
                return (
                  <li key={`${d.tipo}-${d.numero}`} className="py-2.5">
                    {href && (
                      <Link href={href} className="group block">
                        <span className="font-mono text-xs font-semibold tabular-nums text-brand-700">
                          {d.tipo} {d.numero}
                        </span>
                        {d.fechaIso && (
                          <span className="ml-2 text-xs text-ink-soft">{formatFecha(d.fechaIso)}</span>
                        )}
                        <span className="mt-0.5 block text-sm leading-snug text-ink group-hover:text-brand-700">
                          {desdeMayusculas(d.titulo)}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <Suspense fallback={<Cargando titulo="Plan anual de compras" texto="Consultando su PACC…" />}>
        <Planes institucion={i} />
      </Suspense>

      <p className="text-xs leading-relaxed text-ink-soft">
        Fuentes: DGCP (unidad de compra {i.id}), SIGEF
        {i.capitulo ? ` (capítulo ${i.capitulo})` : ""}, nóminas de transparencia y
        Consultoría Jurídica. El cruce entre catálogos lo declara la propia DGCP
        (capítulo de cada unidad de compra); nómina y normativa se emparejan por
        nombre y se publican en{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          el estado de las fuentes
        </Link>
        .
      </p>
    </div>
  );
}

function Cifra({ etiqueta, valor, tinta }: { etiqueta: string; valor: string; tinta?: boolean }) {
  return (
    <div className={`rounded-lg px-4 py-3 ${tinta ? "bg-ink text-canvas" : "bg-canvas"}`}>
      <dt className={`text-xs ${tinta ? "text-canvas/70" : "text-ink-soft"}`}>{etiqueta}</dt>
      <dd className="mt-0.5 text-balance font-mono text-base font-bold leading-tight tabular-nums sm:text-lg">
        {valor}
      </dd>
    </div>
  );
}

function Cargando({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Card as="section" className="p-5 sm:p-6" role="status" aria-busy="true">
      <CardTitle>{titulo}</CardTitle>
      <p className="mt-1 text-xs text-ink-soft">{texto}</p>
      <EsqueletoFilas n={4} className="mt-3" />
    </Card>
  );
}

function Presupuesto({
  datos,
  institucion,
  hermanas,
}: {
  datos: NonNullable<Awaited<ReturnType<typeof getInstitucionFiscal>>>;
  institucion: Institucion;
  hermanas: Institucion[];
}) {
  const { institucion: c, fiscal } = datos;
  const ejecutado = c.ejecucion ?? 0;
  const cambio = c.vigente - c.inicial;
  return (
    <Card as="section" className="p-5 sm:p-6">
      <CardTitle>Presupuesto {fiscal.anio}</CardTitle>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        {hermanas.length > 0 ? (
          <>
            Es el presupuesto del capítulo{" "}
            <span className="font-medium text-ink">{c.nombreLegible}</span>, que
            agrupa a {institucion.acronimo || "esta institución"} y a{" "}
            {hermanas.length === 1 ? "otra unidad de compra" : `otras ${hermanas.length} unidades de compra`}.
          </>
        ) : (
          <>Capítulo {c.codigo} del Presupuesto General del Estado.</>
        )}{" "}
        Con corte a {etiquetaCorte(fiscal.mesCorte, fiscal.anio)}.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra etiqueta="Vigente" valor={formatPesos(c.vigente)} />
        <Cifra etiqueta="Devengado" valor={formatPesos(c.devengado)} tinta />
        <Cifra etiqueta="Pagado" valor={formatPesos(c.pagado)} />
        <Cifra etiqueta="Ejecutado" valor={c.ejecucion === null ? "—" : `${(ejecutado * 100).toFixed(1)} %`} />
      </dl>
      <Progress
        value={Math.min(100, ejecutado * 100)}
        aria-label={`Ejecutado ${(ejecutado * 100).toFixed(1)} % del presupuesto vigente`}
        className="mt-4"
        indicadorClassName="bg-v-finanzas"
      />
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        {Math.abs(cambio) < 1
          ? "Su presupuesto no se ha modificado en el año."
          : `En el año le ${cambio > 0 ? "añadieron" : "recortaron"} ${formatMonto(Math.abs(cambio), "DOP")}.`}{" "}
        {c.devengado - c.pagado > 0 &&
          `Debe ${formatMonto(c.devengado - c.pagado, "DOP")} ya causados que aún no ha pagado.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href={`/finanzas/${c.codigo}`}>Ver su ejecución mes a mes</Link>
        </Button>
      </div>
      {hermanas.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-brand-700">
            Las otras unidades de compra del capítulo
          </summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {hermanas.map((h) => (
              <li key={h.id}>
                <Link href={hrefInstitucion(h)} className="text-sm text-ink hover:text-brand-700">
                  {h.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

async function Compras({ institucion: i }: { institucion: Institucion }) {
  const compras = await getComprasDeInstitucion(i.id);
  if (!compras) {
    return (
      <EstadoVacio
        variante="caida"
        rotulo="Compras"
        titulo="La DGCP no respondió"
        accion={
          <Button asChild variant="secondary">
            <Link href={`/licitaciones?uc=${i.id}`}>Buscar sus procesos</Link>
          </Button>
        }
      >
        La API de datos abiertos de Contrataciones Públicas no contestó. No es que
        no compre: es que no pudimos mirar. Vuelve a intentarlo en unos minutos.
      </EstadoVacio>
    );
  }
  const maxProv = Math.max(1, ...compras.proveedores.map((p) => p.monto));

  return (
    <Card as="section" className="p-5 sm:p-6">
      <CardTitle>Compras</CardTitle>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        {formatInt(compras.totalContratos)} contratos en todo el registro de la DGCP.
        {compras.leidos > 0 &&
          ` Las cifras de abajo salen de los ${formatInt(compras.leidos)} más recientes${
            compras.desde ? `, del ${formatFecha(compras.desde)} al ${formatFecha(compras.hasta ?? undefined)}` : ""
          }.`}
      </p>

      {compras.proveedores.length > 0 && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Cifra etiqueta="Contratado en pesos" valor={formatPesos(compras.montoDop)} tinta />
            <Cifra
              etiqueta="Se lleva el primer proveedor"
              valor={compras.concentracion === null ? "—" : `${(compras.concentracion * 100).toFixed(1)} %`}
            />
          </dl>
          <h3 className="mt-5 text-sm font-semibold">A quién le compra</h3>
          <ul className="mt-2 space-y-2.5 text-sm">
            {compras.proveedores.map((p) => (
              <li key={p.rpe || p.nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  {p.rpe ? (
                    <Link href={`/proveedores/${p.rpe}`} className="min-w-0 truncate hover:text-brand-700">
                      {p.nombre}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate">{p.nombre}</span>
                  )}
                  <span className="shrink-0 font-mono text-xs tabular-nums text-ink-soft">
                    {formatPesos(p.monto)} · {formatInt(p.n)}
                  </span>
                </div>
                <Progress
                  value={Math.max(2, (p.monto / maxProv) * 100)}
                  aria-label={`${p.nombre}: ${formatPesos(p.monto)} en ${p.n} contratos`}
                  className="mt-1"
                  indicadorClassName="bg-v-compras"
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {compras.senales && <Senales s={compras.senales} />}

      {compras.recientes.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold">Últimas adjudicaciones</h3>
          <ul className="mt-2 divide-y divide-hairline">
            {compras.recientes.map((c) => (
              <li key={c.codigo_contrato} className="py-2.5 text-sm">
                <Link href={`/procesos/${c.codigo_proceso}`} className="group block">
                  <span className="line-clamp-2 leading-snug group-hover:text-brand-700">
                    {c.descripcion || c.codigo_proceso}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {c.razon_social} · {formatMonto(c.valor_contratado, c.divisa)} ·{" "}
                    {formatFecha(c.fecha_adjudicacion)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href={`/licitaciones?uc=${i.id}`}>Todos sus procesos</Link>
        </Button>
      </div>
    </Card>
  );
}

/** Las señales dichas como frases, con su proporción. */
function Senales({ s }: { s: SenalesDeCompra }) {
  if (s.procesos === 0) {
    return (
      <p className="mt-5 text-sm text-ink-soft">
        No publicó procesos de compra en los últimos doce meses.
      </p>
    );
  }
  const pct = (n: number) => `${Math.round((n / s.procesos) * 100)} %`;
  const filas = [
    { n: s.excepcion, texto: "por excepción, sin concurso abierto" },
    { n: s.emergencia, texto: "declarados de emergencia o urgencia" },
    { n: s.proveedorUnico, texto: "a un proveedor único o exclusivo" },
    { n: s.noPlaneada, texto: "fuera de su plan anual de compras" },
    { n: s.desiertos, texto: "declarados desiertos" },
  ];
  return (
    <>
      <h3 className="mt-5 text-sm font-semibold">Cómo compra</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        De sus {formatInt(s.procesos)} procesos publicados en los últimos doce meses
        {s.truncado ? " (se leyeron los primeros 1.000)" : ""}
        {s.abiertos > 0 ? `, ${formatInt(s.abiertos)} siguen abiertos` : ""}. La ley
        permite cada una de estas vías; lo que se mira es cuánto pesan.
      </p>
      <ul className="mt-2 space-y-2 text-sm">
        {filas.map((f) => (
          <li key={f.texto}>
            <div className="flex items-baseline justify-between gap-2">
              <span>
                <span className="font-mono font-semibold tabular-nums">{formatInt(f.n)}</span> {f.texto}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-ink-soft">{pct(f.n)}</span>
            </div>
            <Progress
              value={(f.n / s.procesos) * 100}
              aria-label={`${f.n} procesos ${f.texto}, ${pct(f.n)}`}
              className="mt-1"
              indicadorClassName="bg-alerta-500"
            />
          </li>
        ))}
      </ul>
    </>
  );
}

async function Planes({ institucion: i }: { institucion: Institucion }) {
  const planes = await listPacc({ unidad_compra: i.id, limit: 50 });
  const porAnio = new Map<number, (typeof planes)[number]>();
  for (const p of planes) {
    const actual = porAnio.get(p.periodo);
    if (!actual || Number(p.version) > Number(actual.version)) porAnio.set(p.periodo, p);
  }
  const lista = [...porAnio.values()].sort((a, b) => b.periodo - a.periodo).slice(0, 4);
  return (
    <Card as="section" className="p-5 sm:p-6">
      <CardTitle>Plan anual de compras</CardTitle>
      {lista.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          La DGCP no registra planes anuales (PACC) publicados por esta unidad.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Lo que dijo que iba a comprar cada año. Cada revisión sube la versión:
            un plan con muchas versiones es un plan que se movió mucho.
          </p>
          <ul className="mt-3 divide-y divide-hairline">
            {lista.map((p) => (
              <li key={p.uid} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="font-mono font-semibold tabular-nums">{p.periodo}</span>
                  <span className="ml-2 text-xs text-ink-soft">
                    versión {p.version}
                    {p.fechaPublicacion ? ` · ${formatFecha(p.fechaPublicacion)}` : ""}
                  </span>
                </span>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-brand-700 hover:underline sm:min-h-0"
                  >
                    Abrir
                    <IconExternal className="h-3.5 w-3.5" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
