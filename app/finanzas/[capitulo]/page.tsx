import { notFound } from "next/navigation";
import { etiquetaCorte, getFiscal, getInstitucionFiscal } from "@/lib/fiscal";
import { formatMonto, formatPesos } from "@/lib/format";

import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Ruta } from "@/components/ruta";

export async function generateStaticParams() {
  const fiscal = await getFiscal();
  return (fiscal?.instituciones ?? []).map((i) => ({ capitulo: i.codigo }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ capitulo: string }>;
}) {
  const { capitulo } = await params;
  const datos = await getInstitucionFiscal(capitulo);
  if (!datos) return { title: `Capítulo ${capitulo}` };
  return {
    title: `${datos.institucion.nombreLegible} — ejecución presupuestaria`,
    description: `Presupuesto vigente, comprometido, devengado y pagado de ${datos.institucion.nombreLegible} en ${datos.fiscal.anio}.`,
  };
}

function pct(v: number | null): string {
  return v === null ? "—" : `${(v * 100).toFixed(1)} %`;
}

export default async function InstitucionFiscalPage({
  params,
}: {
  params: Promise<{ capitulo: string }>;
}) {
  const { capitulo } = await params;
  if (!/^\d{4}$/.test(capitulo)) notFound();

  const datos = await getInstitucionFiscal(capitulo);
  if (!datos) notFound();
  const { institucion: i, fiscal } = datos;

  const meses = i.meses.filter((m) => m.mes <= fiscal.mesCorte);
  const maxMes = Math.max(1, ...meses.map((m) => Math.max(m.devengado, m.pagado)));
  const maxUnidad = Math.max(1, ...i.unidades.map((u) => u.devengado));
  const modificaciones = i.vigente - i.inicial;
  const pendientePago = i.devengado - i.pagado;

  return (
    <div className="space-y-5">
      <Ruta seccion="finanzas" actual={`Capítulo ${i.codigo}`} />

      <Card as="section" className="p-5 sm:p-6">
        <div className="rotulo text-ink-soft">
          Capítulo {i.codigo} · {i.seccionNombre}
        </div>
        <h1 className="mt-1 font-display text-2xl leading-tight sm:text-3xl">
          {i.nombreLegible}
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Ejecución de {fiscal.anio}, con corte a {etiquetaCorte(fiscal.mesCorte, fiscal.anio)}.
        </p>

        {/*
          «RD$ 330.0 mil millones» no cabe en una casilla de media pantalla: a
          390 px se partía en tres líneas —«RD$ 330.0» / «mil» / «millones»— y
          las cuatro casillas quedaban desiguales. A 16 px y con `text-balance`
          la magnitud cae en dos líneas parejas y la unidad no se despega del
          número. La unidad viaja con la cifra por decisión de `formatPesos`:
          «MM» se lee *millones* en RD y se equivocaría por mil.
        */}
        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { etiqueta: "Presupuesto vigente", valor: formatPesos(i.vigente) },
            { etiqueta: "Devengado", valor: formatPesos(i.devengado), tinta: true },
            { etiqueta: "Pagado", valor: formatPesos(i.pagado) },
            { etiqueta: "Ejecutado", valor: pct(i.ejecucion) },
          ].map((k) => (
            <div
              key={k.etiqueta}
              className={`rounded-lg px-4 py-3 ${k.tinta ? "bg-ink text-canvas" : "bg-canvas"}`}
            >
              <dt className={`text-xs ${k.tinta ? "text-canvas/70" : "text-ink-soft"}`}>
                {k.etiqueta}
              </dt>
              <dd className="mt-0.5 text-balance font-mono text-base font-bold leading-tight tabular-nums sm:text-lg">
                {k.valor}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Abrió el año con {formatMonto(i.inicial, "DOP")} y su presupuesto
          vigente es de {formatMonto(i.vigente, "DOP")}:{" "}
          {Math.abs(modificaciones) < 1 ? (
            <>no ha tenido modificaciones.</>
          ) : (
            <>
              {modificaciones > 0 ? "le añadieron " : "le recortaron "}
              <span className="font-medium text-ink">
                {formatMonto(Math.abs(modificaciones), "DOP")}
              </span>{" "}
              durante el año.
            </>
          )}
          {pendientePago > 0 && (
            <>
              {" "}
              Entre lo devengado y lo pagado hay{" "}
              <span className="font-medium text-ink">
                {formatMonto(pendientePago, "DOP")}
              </span>{" "}
              de diferencia: gasto ya causado que aún no ha salido de caja.
            </>
          )}
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card as="section" className="p-5 sm:p-6 lg:col-span-3">
          <CardTitle>Mes a mes</CardTitle>
          {/*
            En escritorio la leyenda podía ser telegráfica porque el cursor
            revela el detalle de cada barra; en un teléfono no hay puntero, así
            que la leyenda es lo único que explica el tramo interior y tiene
            que decirlo entero.
          */}
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Cada barra es lo devengado del mes, medido contra el mes mayor. El
            tramo oscuro de dentro es cuánto de eso ya salió de caja.
          </p>
          {meses.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Esta institución no registra ejecución mensual en {fiscal.anio}.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm">
              {meses.map((m) => (
                <li key={m.mes}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono font-medium tabular-nums">
                      {etiquetaCorte(m.mes, fiscal.anio).split(" de ")[0]}
                    </span>
                    <span className="shrink-0 text-xs text-ink-soft">
                      {formatPesos(m.devengado)}
                    </span>
                  </div>
                  {/*
                    Dos medidas en una barra: el ancho es lo devengado sobre el
                    mes mayor, y el tramo oscuro de dentro es cuánto de eso ya
                    salió de caja. La etiqueta accesible dice las dos, porque el
                    tramo interior no se puede leer con un lector de pantalla.
                  */}
                  <Progress
                    value={Math.max(1, (m.devengado / maxMes) * 100)}
                    aria-label={`${etiquetaCorte(m.mes, fiscal.anio)}: devengado ${formatPesos(m.devengado)}, pagado ${formatPesos(m.pagado)}`}
                    className="mt-1 h-3 sm:h-2.5"
                    indicadorClassName="relative bg-v-finanzas"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 rounded-sm bg-ink/35"
                      style={{
                        width: `${
                          m.devengado > 0
                            ? Math.min(100, (m.pagado / Math.max(m.devengado, 1)) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </Progress>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="p-5 sm:p-6 lg:col-span-2">
          <CardTitle>Quién ejecuta dentro</CardTitle>
          <p className="mt-1 text-xs text-ink-soft">
            Unidades ejecutoras con más gasto devengado.
          </p>
          {i.unidades.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              El registro no desglosa unidades ejecutoras para esta institución.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm">
              {i.unidades.map((u) => (
                <li key={u.nombre}>
                  {/*
                    Los nombres de unidad ejecutora vienen en mayúsculas y son
                    largos: con una sola línea a 390 px todos quedaban en
                    «INSTITUTO NACIONAL DE…» y la lista no distinguía una de
                    otra. Dos líneas alcanzan para leerlos.
                  */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 leading-snug">{u.nombre}</span>
                    <span className="shrink-0 text-xs leading-5 text-ink-soft">
                      {formatPesos(u.devengado)}
                    </span>
                  </div>
                  <Progress
                    value={Math.max(2, (u.devengado / maxUnidad) * 100)}
                    aria-label={`${u.nombre}: ${formatPesos(u.devengado)}`}
                    indicadorClassName="bg-v-finanzas"
                    className="mt-1"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs leading-relaxed text-ink-soft">
        Fuente: API de datos abiertos del SIGEF (Ministerio de Hacienda), sección{" "}
        <span className="font-mono">{i.seccion}</span>, capítulo{" "}
        <span className="font-mono">{i.codigo}</span>. El presupuesto vigente se
        calcula como la suma de la apertura del año y sus modificaciones
        mensuales, que es como lo publica el origen.
      </p>
    </div>
  );
}
