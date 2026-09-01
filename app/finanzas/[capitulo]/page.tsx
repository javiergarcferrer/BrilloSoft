import Link from "next/link";
import { notFound } from "next/navigation";
import { etiquetaCorte, getFiscal, getInstitucionFiscal } from "@/lib/fiscal";
import { formatMonto, formatPesos } from "@/lib/format";

import { IconArrowLeft } from "@/components/icons";

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
      <Link
        href="/finanzas"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver a la ejecución
      </Link>

      <section className="rounded-lg bg-surface p-6 border border-hairline">
        <div className="rotulo text-ink-soft">
          Capítulo {i.codigo} · {i.seccionNombre}
        </div>
        <h1 className="mt-1 font-display text-2xl leading-tight sm:text-3xl">
          {i.nombreLegible}
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Ejecución de {fiscal.anio}, con corte a {etiquetaCorte(fiscal.mesCorte, fiscal.anio)}.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-canvas px-4 py-3">
            <dt className="text-xs text-ink-soft">Presupuesto vigente</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums">
              {formatPesos(i.vigente)}
            </dd>
          </div>
          <div className="rounded-lg bg-ink px-4 py-3 text-canvas">
            <dt className="text-xs text-canvas/70">Devengado</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums">
              {formatPesos(i.devengado)}
            </dd>
          </div>
          <div className="rounded-lg bg-canvas px-4 py-3">
            <dt className="text-xs text-ink-soft">Pagado</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums">
              {formatPesos(i.pagado)}
            </dd>
          </div>
          <div className="rounded-lg bg-canvas px-4 py-3">
            <dt className="text-xs text-ink-soft">Ejecutado</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums">
              {pct(i.ejecucion)}
            </dd>
          </div>
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
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-lg bg-surface p-6 border border-hairline lg:col-span-3">
          <h2 className="font-semibold">Mes a mes</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Barra llena: devengado. Línea interior: pagado.
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
                  <div className="mt-1 h-2.5 rounded-full bg-hairline">
                    <div
                      className="bar-grow relative h-2.5 rounded-full bg-v-finanzas"
                      style={{
                        width: `${Math.max(1, (m.devengado / maxMes) * 100)}%`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 rounded-full bg-ink/25"
                        style={{
                          width: `${
                            m.devengado > 0
                              ? Math.min(100, (m.pagado / Math.max(m.devengado, 1)) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg bg-surface p-6 border border-hairline lg:col-span-2">
          <h2 className="font-semibold">Quién ejecuta dentro</h2>
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
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="line-clamp-1">{u.nombre}</span>
                    <span className="shrink-0 text-xs text-ink-soft">
                      {formatPesos(u.devengado)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-hairline">
                    <div
                      className="bar-grow h-2 rounded-full bg-v-finanzas"
                      style={{
                        width: `${Math.max(2, (u.devengado / maxUnidad) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
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
