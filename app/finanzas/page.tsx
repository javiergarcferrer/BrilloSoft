import Link from "next/link";
import type { Metadata } from "next";
import { etiquetaCorte, getFiscal } from "@/lib/fiscal";
import { getDeuda } from "@/lib/deuda";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EstadoVacio } from "@/components/estado-vacio";
import { Portada, PortadaCifra, PortadaCifras } from "@/components/portada";
import { formatMagnitud, formatPesos, hace } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { Termino } from "@/components/termino";

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
      <EstadoVacio
        className="mx-auto max-w-2xl"
        titulo="Todavía no hay instantánea de ejecución"
      >
        Se genera con{" "}
        <span className="font-mono">python3 scripts/build-fiscal.py</span>, que
        consulta la API de datos abiertos del SIGEF.
      </EstadoVacio>
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
      <Portada
        rotulo={`Ejecución presupuestaria · SIGEF · corte a ${corte}`}
        titulo="¿En qué gasta el Estado?"
        descripcion={
          <>
            El presupuesto no se ejecuta de golpe: se aprueba, se modifica, se
            compromete, se devenga y se paga. Estas son las cifras de cada
            institución en {fiscal.anio}, con el gasto{" "}
            <Termino clave="devengado" className="font-medium text-canvas">devengado</Termino> —lo que el
            Estado ya se obligó a pagar— como medida.
          </>
        }
      >
        <PortadaCifras>
          {kpis.map((k) => (
            <PortadaCifra
              key={k.etiqueta}
              etiqueta={k.etiqueta}
              valor={k.valor}
              destacar={k.destacar}
            />
          ))}
        </PortadaCifras>
      </Portada>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card as="section" className="p-5 sm:p-6 lg:col-span-3">
          <CardTitle>Gasto devengado mes a mes</CardTitle>
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
                <Progress
                  value={Math.max(2, (m.devengado / maxMes) * 100)}
                  aria-label={`${etiquetaCorte(m.mes, fiscal.anio)}: ${formatPesos(m.devengado)}`}
                  indicadorClassName="bg-v-finanzas"
                  className="mt-1"
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card as="section" className="p-5 sm:p-6 lg:col-span-2">
          <CardTitle>Y lo que debe</CardTitle>
          {deuda ? (
            <>
              <p className="mt-3 font-mono text-2xl font-bold tabular-nums">
                {formatMagnitud(deuda.saldoTotal)}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Saldo de la deuda del <Termino clave="spnf">Sector Público No Financiero</Termino> · {deuda.periodo}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                  <dt className="text-ink-soft"><Termino clave="deudaExterna">Externa</Termino></dt>
                  <dd className="font-mono tabular-nums">
                    {formatMagnitud(deuda.saldoExterna)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                  <dt className="text-ink-soft"><Termino clave="deudaInterna">Interna</Termino></dt>
                  <dd className="font-mono tabular-nums">
                    {formatMagnitud(deuda.saldoInterna)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-soft">
                Fuente: Crédito Público (Ministerio de Hacienda).
                {deuda.desdeInstantanea && " Instantánea local: el origen no responde al egreso de la nube."}
              </p>
              <Link href="/finanzas/guia/deuda" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline sm:min-h-0">
                ¿Qué es la deuda pública? Lee la guía →
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              El saldo de deuda no está disponible ahora mismo.
            </p>
          )}
        </Card>
      </div>

      <Card as="section" className="p-5 sm:p-6">
        <CardTitle>Institución por institución</CardTitle>
        <p className="mt-1 text-xs text-ink-soft">
          Ordenadas por gasto devengado en {fiscal.anio}. El porcentaje es cuánto
          lleva ejecutado de su presupuesto vigente.
        </p>
        <ul className="mt-4 space-y-2">
          {fiscal.instituciones.map((i) => (
            /*
              `--cv-alto` es lo que el navegador reserva por fila sin pintarla:
              a 390 px el nombre de la institución ocupa dos líneas y la fila
              mide unos 120 px, no los 88 de escritorio. Con la estimación corta
              la barra de desplazamiento saltaba al pintar cada tramo.
            */
            <li key={i.codigo} className="cv-auto [--cv-alto:7.5rem] sm:[--cv-alto:5.5rem]">
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
                <Progress
                  value={Math.max(1, (i.devengado / maxDevengado) * 100)}
                  aria-label={`${i.nombreLegible}: ${formatPesos(i.devengado)}`}
                  indicadorClassName="bg-v-finanzas"
                  className="mt-1.5"
                />
                {/*
                  Los dos metadatos van a los extremos, no en una fila que se
                  parte: con `flex-wrap` y un «·» al principio del segundo, a
                  390 px la línea se rompía y dejaba el punto huérfano abriendo
                  el renglón. Anclados a izquierda y derecha caben los dos en
                  una sola línea, y la sección —que solo cabe en pantalla
                  ancha— se cuela en medio desde `sm`.
                */}
                <div className="mt-1.5 flex items-baseline justify-between gap-x-3 text-xs text-ink-soft">
                  <span className="shrink-0 font-mono">Capítulo {i.codigo}</span>
                  <span className="hidden min-w-0 truncate sm:block">{i.seccionNombre}</span>
                  <span className="shrink-0 text-right">
                    {pct(i.ejecucion)} de su presupuesto vigente
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>Cómo leer estas cifras</CardTitle>
          <Link href="/finanzas/guia" className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline sm:min-h-0">
            Guía: cómo leer el presupuesto →
          </Link>
        </div>
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
              esa distancia es lo que se le debe a proveedores, la{" "}
              <Termino clave="deudaAdministrativa">deuda administrativa</Termino>.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Fuente: API de datos abiertos del <Termino clave="sigef">SIGEF</Termino> (Ministerio de Hacienda),{" "}
          <span className="break-all font-mono">{fiscal.fuente}</span>. La API calcula el
          año en curso en vivo y tarda minutos, así que la plataforma consolida
          las tres secciones institucionales en una instantánea
          {hace(fiscal.generadoEn) ? ` (generada ${hace(fiscal.generadoEn)})` : ""}{" "}
          y la sirve al instante; se regenera con{" "}
          <span className="font-mono">python3 scripts/build-fiscal.py</span>.
          Cubre {fiscal.instituciones.length} instituciones del Presupuesto
          General del Estado: no incluye ayuntamientos ni empresas públicas
          financieras.
        </p>
      </Card>
    </div>
  );
}
