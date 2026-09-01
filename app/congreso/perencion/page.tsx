import Link from "next/link";
import type { Metadata } from "next";
import IniciativaCard from "@/components/iniciativa-card";
import {
  DURACION_LEGISLATURA_DIAS,
  VENTANA_ALERTA_DIAS,
  diffDias,
  evaluarPerencion,
  legislaturaVigente,
  muestrearIniciativas,
} from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import { IconArrowLeft } from "@/components/icons";

export const metadata: Metadata = {
  title: "Perención",
  description:
    "Qué iniciativas del Congreso están por perimir antes del cierre de la legislatura.",
};

export const revalidate = 900;

/** Muestra amplia: aquí el recall importa más que la latencia. */
const PAGINAS_MUESTRA = 25;

export default async function PerencionPage() {
  const muestra = await muestrearIniciativas(PAGINAS_MUESTRA);
  const legislatura = legislaturaVigente();
  const diasParaCierre = legislatura ? diffDias(new Date(), legislatura.cierre) : null;

  const vivas = muestra.iniciativas.filter((i) => i.viva);
  const enRiesgo = vivas
    .map((ini) => ({ ini, p: evaluarPerencion(ini.legislatura) }))
    .filter((x) => x.p.estado === "en-riesgo")
    .sort((a, b) => {
      const da = a.p.estado === "en-riesgo" ? a.p.diasRestantes : 0;
      const db = b.p.estado === "en-riesgo" ? b.p.diasRestantes : 0;
      return da - db;
    });

  const transcurridos =
    diasParaCierre !== null ? DURACION_LEGISLATURA_DIAS - diasParaCierre : 0;
  const progreso = Math.max(
    0,
    Math.min(100, (transcurridos / DURACION_LEGISLATURA_DIAS) * 100),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/congreso"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Congreso
      </Link>

      <header className="mb-6 mt-3">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          ¿Qué se muere cuando cierra la legislatura?
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Cada legislatura ordinaria dura {DURACION_LEGISLATURA_DIAS} días. Las piezas
          que sigan pendientes al cierre se perimen. Esta vista avisa con{" "}
          {VENTANA_ALERTA_DIAS} días de anticipación.
        </p>
      </header>

      {legislatura && diasParaCierre !== null && (
        <section className="mb-6 rounded-lg border border-hairline bg-surface p-5 ">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">
                {legislatura.nombre} {legislatura.anio}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {formatFecha(legislatura.inicio.toISOString().slice(0, 10))} —{" "}
                {formatFecha(legislatura.cierre.toISOString().slice(0, 10))}
              </p>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-ink">
              {diasParaCierre}
              <span className="ml-1 text-sm font-medium text-ink-soft">
                días restantes
              </span>
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-sm border border-hairline bg-canvas">
            <div
              className="h-full bg-alerta-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-hairline bg-surface ">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <h2 className="font-sans text-sm font-semibold text-ink">
            Piezas en la ventana de aviso
          </h2>
          <span className="font-mono text-xs tabular-nums text-ink-soft">{enRiesgo.length}</span>
        </div>

        {enRiesgo.length > 0 ? (
          <ul>
            {enRiesgo.map(({ ini }) => (
              <IniciativaCard key={ini.id} iniciativa={ini} />
            ))}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-ink">
              Ninguna pieza entra hoy en la ventana de {VENTANA_ALERTA_DIAS} días
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
              Se revisaron {vivas.length} piezas vigentes dentro de una muestra de{" "}
              {muestra.muestra}. La alerta se activa cuando el cierre de la legislatura
              queda a {VENTANA_ALERTA_DIAS} días o menos.
            </p>
          </div>
        )}
      </section>

      <p className="mt-5 text-xs leading-relaxed text-ink-soft">
        Cobertura parcial: se evalúan las {muestra.muestra} iniciativas más recientes
        del registro, no el corpus completo. El SIL pagina de 10 en 10 y barrer sus
        ~622 páginas en cada carga no es viable.{" "}
        <Link href="/fuentes" className="text-brand-700 underline">
          Ver estado de las fuentes
        </Link>
        .
      </p>
    </div>
  );
}
