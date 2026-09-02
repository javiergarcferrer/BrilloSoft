import Link from "next/link";
import type { Metadata } from "next";
import { etiquetaCorte, getFiscal } from "@/lib/fiscal";
import { getDeuda } from "@/lib/deuda";
import { formatMagnitud, formatPesos, hace } from "@/lib/format";
import { formatInt } from "@/lib/nomina";

export const metadata: Metadata = {
  title: "Ejecución del presupuesto",
  description:
    "En qué gasta el Estado dominicano: presupuesto vigente, comprometido, devengado y pagado por institución, mes a mes, según la API de datos abiertos del SIGEF.",
};

/** Porcentaje con una decimal, o guion si no hay contra qué medir. */
function pct(v: number | null): string {
  return v === null ? "—" : `${(v * 100).toFixed(1)} %`;
}

export default async function FinanzasPage() {
  const [fiscal, deuda] = await Promise.all([getFiscal(), getDeuda()]);

  if (!fiscal) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-hairline bg-surface px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          Todavía no hay instantánea de ejecución
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
          Se genera con <span className="font-mono">python3 scripts/build-fiscal.py</span>,
          que consulta la API de datos abiertos del SIGEF.
        </p>
      </div>
    );
  }

  const corte = etiquetaCorte(fiscal.mesCorte, fiscal.anio);
  const maxDevengado = Math.max(1, ...fiscal.instituciones.map((i) => i.devengado));
  const maxMes = Math.max(1, ...fiscal.porMes.map((m) => m.devengado));
  const mesesVisibles = fiscal.porMes.filter((m) => m.mes <= fiscal.mesCorte);

  const kpis = [
    { etiqueta: "Devengado en el año", valor: formatPesos(fiscal.total.devengado), destacar: true },
    { etiqueta: "Presupuesto vigente", valor: formatPesos(fiscal.total.vigente) },
    { etiqueta: "Ejecutado", valor: pct(fiscal.total.ejecucion) },
    { etiqueta: "Instituciones", valor: formatInt(fiscal.instituciones.length) },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg bg-ink text-white">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div className="relative p-6 sm:p-8">
          <div className="rotulo inline-flex items-start gap-2 text-white/70">
            <span
              aria-hidden
              className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-sello-400"
            />
            Ejecución presupuestaria · SIGEF · corte a {corte}
          </div>
          <h1 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl">
            ¿En qué gasta el Estado?
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-white/70">
            El presupuesto no se ejecuta de golpe: se aprueba, se modifica, se
            compromete, se devenga y se paga. Estas son las cifras de cada
            institución en {fiscal.anio}, con el gasto{" "}
            <span className="font-medium text-white">devengado</span> —lo que el
            Estado ya se obligó a pagar— como medida.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map((k) => (
              <div
                key={k.etiqueta}
                className={
                  k.destacar
                    ? "rounded-lg bg-white/10 px-4 py-3"
                    : "rounded-lg bg-white/5 px-4 py-3"
                }
              >
                <dt className="text-xs text-white/60">{k.etiqueta}</dt>
                <dd className="mt-0.5 font-mono text-lg font-bold tabular-nums">
                  {k.valor}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-lg bg-surface p-6 border border-hairline lg:col-span-3">
          <h2 className="font-semibold">Gasto devengado mes a mes</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Todo el Estado, {fiscal.anio}. Cada barra es un mes cerrado.
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {mesesVisibles.map((m) => (
              <li key={m.mes}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono font-medium tabular-nums">
                    {etiquetaCorte(m.mes, fiscal.anio).split(" de ")[0]}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {formatPesos(m.devengado)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-hairline">
                  <div
                    className="bar-grow h-2 rounded-full bg-v-finanzas"
                    style={{ width: `${Math.max(2, (m.devengado / maxMes) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg bg-surface p-6 border border-hairline lg:col-span-2">
          <h2 className="font-semibold">Y lo que debe</h2>
          {deuda ? (
            <>
              <p className="mt-3 font-mono text-2xl font-bold tabular-nums">
                {formatMagnitud(deuda.saldoTotal)}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Saldo de la deuda del Sector Público No Financiero · {deuda.periodo}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                  <dt className="text-ink-soft">Externa</dt>
                  <dd className="font-mono tabular-nums">
                    {formatMagnitud(deuda.saldoExterna)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                  <dt className="text-ink-soft">Interna</dt>
                  <dd className="font-mono tabular-nums">
                    {formatMagnitud(deuda.saldoInterna)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-soft">
                Fuente: Crédito Público (Ministerio de Hacienda).
                {deuda.desdeInstantanea && " Instantánea local: el origen no responde al egreso de la nube."}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              El saldo de deuda no está disponible ahora mismo.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-lg bg-surface p-6 border border-hairline">
        <h2 className="font-semibold">Institución por institución</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Ordenadas por gasto devengado en {fiscal.anio}. El porcentaje es cuánto
          lleva ejecutado de su presupuesto vigente.
        </p>
        <ul className="mt-4 space-y-2">
          {fiscal.instituciones.map((i) => (
            <li key={i.codigo} className="cv-auto [--cv-alto:5.5rem]">
              <Link
                href={`/finanzas/${i.codigo}`}
                className="block rounded-lg border border-hairline px-4 py-3 transition hover:border-v-finanzas"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="min-w-0 font-medium">{i.nombreLegible}</span>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                    {formatPesos(i.devengado)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-hairline">
                  <div
                    className="bar-grow h-2 rounded-full bg-v-finanzas"
                    style={{
                      width: `${Math.max(1, (i.devengado / maxDevengado) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
                  <span className="font-mono">Capítulo {i.codigo}</span>
                  <span>· {pct(i.ejecucion)} de su presupuesto vigente</span>
                  <span className="hidden sm:inline">· {i.seccionNombre}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-6">
        <h2 className="font-semibold">Cómo leer estas cifras</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="rotulo text-ink-soft">Presupuesto vigente</dt>
            <dd className="text-ink-soft">
              El aprobado al abrir el año más las modificaciones hechas después.
              Sube y baja durante el año: por eso no coincide con el inicial.
            </dd>
          </div>
          <div>
            <dt className="rotulo text-ink-soft">Comprometido</dt>
            <dd className="text-ink-soft">
              El Estado firmó algo que lo obliga —un contrato, una orden—, pero
              todavía no ha recibido el bien o el servicio.
            </dd>
          </div>
          <div>
            <dt className="rotulo text-ink-soft">Devengado</dt>
            <dd className="text-ink-soft">
              Ya recibió lo que compró y nació la obligación de pagar. Es la
              medida honesta de «cuánto gastó».
            </dd>
          </div>
          <div>
            <dt className="rotulo text-ink-soft">Pagado</dt>
            <dd className="text-ink-soft">
              El dinero salió de la cuenta. Puede ir por detrás del devengado:
              esa distancia es la deuda administrativa del año.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Fuente: API de datos abiertos del SIGEF (Ministerio de Hacienda),{" "}
          <span className="font-mono">{fiscal.fuente}</span>. La API calcula el
          año en curso en vivo y tarda minutos, así que la plataforma consolida
          las tres secciones institucionales en una instantánea
          {hace(fiscal.generadoEn) ? ` (generada ${hace(fiscal.generadoEn)})` : ""}{" "}
          y la sirve al instante; se regenera con{" "}
          <span className="font-mono">python3 scripts/build-fiscal.py</span>.
          Cubre {fiscal.instituciones.length} instituciones del Presupuesto
          General del Estado: no incluye ayuntamientos ni empresas públicas
          financieras.
        </p>
      </section>
    </div>
  );
}
