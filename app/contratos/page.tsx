import Link from "next/link";
import type { Metadata } from "next";
import { muestrearContratos, type AgregadoContrato } from "@/lib/dgcp";
import { formatMonto, formatFecha } from "@/lib/format";
import { formatCompactDOP, formatInt } from "@/lib/nomina";
import { IconArrowRight, IconChartBar } from "@/components/icons";
import Antiguedad from "@/components/antiguedad";

export const metadata: Metadata = {
  title: "Histórico de contrataciones",
  description:
    "Qué está adjudicando el Estado dominicano: montos, adjudicatarios e instituciones sobre los contratos más recientes registrados en la DGCP.",
};

export const revalidate = 1800;

/** Páginas del registro de contratos a escanear (1000 c/u, ~8 días c/u). */
const PAGINAS = 6;

export default async function ContratosPage() {
  const r = await muestrearContratos(PAGINAS).catch(() => null);

  if (!r || r.escaneados === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-hairline bg-surface px-5 py-14 text-center ">
        <p className="text-sm font-medium text-ink">El registro de contratos no respondió</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
          La API de contratos de la DGCP está caída o no devolvió datos. Vuelve
          en unos minutos.
        </p>
      </div>
    );
  }

  const maxMes = Math.max(1, ...r.porMes.map((m) => m.monto));
  const promedio = r.conMonto > 0 ? r.montoTotal / r.conMonto : 0;

  const kpis = [
    { etiqueta: "Monto adjudicado (muestra)", valor: formatCompactDOP(r.montoTotal), destacar: true },
    { etiqueta: "Contratos con monto", valor: formatInt(r.conMonto) },
    { etiqueta: "Adjudicación promedio", valor: formatCompactDOP(promedio) },
    { etiqueta: "Registro completo", valor: formatInt(r.totalRegistro) },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg bg-ink text-canvas">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div className="relative p-6 sm:p-8">
          <div className="rotulo inline-flex items-start gap-2 text-canvas/70">
            <span aria-hidden className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-sello-400" />
            Contratos adjudicados · se actualiza cada 30 min
          </div>
          {r.truncado && (
            <p className="rotulo mt-3 inline-flex items-center gap-2 text-alerta-200">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-alerta-400" />
              Muestra · {formatInt(r.escaneados)} de {formatInt(r.totalRegistro)} contratos
            </p>
          )}
          <h1 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl">
            ¿Qué está contratando el Estado?
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-canvas/70">
            Sobre los {formatInt(r.escaneados)} contratos más recientes del
            registro de la DGCP
            {r.desde && r.hasta && (
              <>
                {" "}
                ({formatFecha(r.desde)} — {formatFecha(r.hasta)})
              </>
            )}
            .
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <div
                key={k.etiqueta}
                className={`rounded-lg p-4 ring-1 ${
                  k.destacar ? "bg-brand-500/15 ring-brand-400/30" : "bg-canvas/5 ring-canvas/10"
                }`}
              >
                <div className="font-mono text-lg font-semibold leading-tight tabular-nums sm:text-xl">{k.valor}</div>
                <div
                  className={`mt-0.5 text-xs ${k.destacar ? "text-brand-100" : "text-canvas/60"}`}
                >
                  {k.etiqueta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tendencia mensual */}
      {r.porMes.length > 1 && (
        <section className="rounded-lg bg-surface p-6 border border-hairline">
          <h2 className="font-sans font-semibold">Monto adjudicado por mes</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Dentro de la ventana escaneada; los meses de los extremos pueden estar
            incompletos.
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {r.porMes.map((m) => (
              <li key={m.mes}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium tabular-nums">{m.mes}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {formatInt(m.n)} · {formatMonto(m.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-sm bg-hairline">
                  <div
                    className="bar-grow h-2 rounded-sm bg-brand-500"
                    style={{ width: `${Math.max(2, (m.monto / maxMes) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <RankingContratos
          titulo="Mayores adjudicatarios"
          nota="Enlazan a su perfil"
          items={r.topAdjudicatarios}
          color="bg-brand-500"
          hrefDe={(a) => (a.rpe ? `/proveedores/${a.rpe}` : undefined)}
        />
        <RankingContratos
          titulo="Instituciones que más adjudican"
          items={r.topInstituciones}
          color="bg-brand-400"
        />
      </div>

      {/* Detalle reciente */}
      <section className="overflow-hidden rounded-lg bg-surface border border-hairline">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <h2 className="font-sans font-semibold">Adjudicaciones más recientes</h2>
          <span className="text-xs text-ink-soft">{r.recientes.length}</span>
        </div>
        <ul className="divide-y divide-hairline">
          {r.recientes.map((c, i) => (
            <li key={`${c.codigo_contrato}-${i}`} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="line-clamp-1 text-sm font-medium text-ink">
                  {c.descripcion || c.codigo_contrato}
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                  {formatMonto(c.valor_contratado, c.divisa)}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
                {c.rpe ? (
                  <Link href={`/proveedores/${c.rpe}`} className="text-brand-600 hover:underline">
                    {c.razon_social}
                  </Link>
                ) : (
                  <span>{c.razon_social}</span>
                )}
                <Sep />
                <span className="line-clamp-1">{c.unidad_compra}</span>
                <Sep />
                <Antiguedad iso={c.fecha_adjudicacion} prefijo="Adjudicado" />
                <Sep />
                <Link
                  href={`/procesos/${encodeURIComponent(c.codigo_proceso)}`}
                  className="text-brand-600 hover:underline"
                >
                  ver proceso →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Muestra de los {formatInt(r.escaneados)} contratos más recientes de{" "}
        {formatInt(r.totalRegistro)} en el registro de la DGCP: el API sirve los
        contratos por recencia y no admite filtro por fecha, así que estas cifras
        describen la ventana reciente, no todo el histórico. Los montos suman solo
        adjudicaciones vigentes (activas, modificadas o cerradas), sin las
        canceladas ni rescindidas.{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          Estado y límites de las fuentes
        </Link>
        .
      </p>
    </div>
  );
}

function Sep() {
  return (
    <span aria-hidden className="text-hairline">
      ·
    </span>
  );
}

function RankingContratos({
  titulo,
  nota,
  items,
  color,
  hrefDe,
}: {
  titulo: string;
  nota?: string;
  items: AgregadoContrato[];
  color: string;
  hrefDe?: (a: AgregadoContrato) => string | undefined;
}) {
  const max = Math.max(1, ...items.map((a) => a.monto));
  return (
    <section className="rounded-lg bg-surface p-6 border border-hairline">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-sans font-semibold">{titulo}</h2>
        {nota && <span className="text-xs text-ink-soft">{nota}</span>}
      </div>
      <ul className="mt-3 space-y-2.5 text-sm">
        {items.map((a) => {
          const href = hrefDe?.(a);
          const nombre = href ? (
            <Link href={href} className="font-medium text-brand-600 hover:underline">
              {a.clave}
            </Link>
          ) : (
            <span className="font-medium">{a.clave}</span>
          );
          return (
            <li key={a.clave}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="line-clamp-1">{nombre}</span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {a.n} · {formatMonto(a.monto, "DOP")}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-sm bg-hairline">
                <div
                  className={`bar-grow h-2 rounded-sm ${color}`}
                  style={{ width: `${Math.max(2, (a.monto / max) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
