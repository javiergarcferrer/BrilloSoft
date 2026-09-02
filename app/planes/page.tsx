import type { Metadata } from "next";
import { listPacc } from "@/lib/dgcp";
import { formatFecha } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { IconExternal } from "@/components/icons";

export const metadata: Metadata = {
  title: "Planes anuales de compras",
  description:
    "Qué planea comprar cada institución del Estado dominicano este año, según el Plan Anual de Compras y Contrataciones (PACC) que publica en la DGCP.",
};

export const revalidate = 3600;

/** El año en curso en hora dominicana: el PACC es un documento por período. */
function anioVigente(): number {
  return Number(
    new Intl.DateTimeFormat("es-DO", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
    }).format(new Date()),
  );
}

export default async function PlanesPage() {
  const periodo = anioVigente();
  const planes = await listPacc({ periodo }).catch(() => []);

  if (planes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-hairline bg-surface px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          No hay planes publicados para {periodo}
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
          O la API de la DGCP no respondió. Vuelve en unos minutos.
        </p>
      </div>
    );
  }

  const instituciones = new Set(planes.map((p) => p.codigoUnidadCompra)).size;
  // La página no vuelca los ~500 planes del bloque: la lista larga pesa más de
  // un mega y nadie la lee entera. Se muestran los más recientes y se declara
  // el recorte.
  const VISIBLES = 120;
  const visibles = planes.slice(0, VISIBLES);
  const ultimo = planes[0]?.fechaPublicacion ?? null;
  const revisiones = planes.reduce((suma, p) => {
    const v = Number(p.version);
    return suma + (Number.isFinite(v) ? v : 0);
  }, 0);

  const kpis = [
    { etiqueta: `Planes del ${periodo}`, valor: formatInt(planes.length), destacar: true },
    { etiqueta: "Instituciones", valor: formatInt(instituciones) },
    { etiqueta: "Revisiones acumuladas", valor: formatInt(revisiones) },
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
            Plan Anual de Compras y Contrataciones · PACC {periodo}
          </div>
          <h1 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl">
            ¿Qué planea comprar el Estado?
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-white/70">
            Antes de que exista una licitación, cada institución declara lo que
            piensa comprar en el año. Ese documento es el PACC, y se puede leer
            hoy: es la señal más temprana que publica el Estado sobre su propio
            gasto.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

      <section className="rounded-lg bg-surface p-6 border border-hairline">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Planes publicados, del más reciente</h2>
          {ultimo && (
            <span className="text-xs text-ink-soft">
              Última publicación: {formatFecha(ultimo)}
            </span>
          )}
        </div>

        <ul className="mt-4 space-y-2">
          {visibles.map((p) => (
            <li
              key={p.uid}
              className="cv-auto [--cv-alto:4rem] flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium">{p.unidadCompra}</div>
                <div className="text-xs text-ink-soft">
                  {p.fechaPublicacion
                    ? `Publicado ${formatFecha(p.fechaPublicacion)}`
                    : "Sin fecha de publicación"}
                  {Number(p.version) > 0 && (
                    <> · versión {p.version}</>
                  )}
                </div>
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1 text-xs font-medium hover:border-brand-500 hover:text-brand-600"
              >
                Ver el plan
                <IconExternal className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          {planes.length > VISIBLES && (
            <>
              Se listan los {VISIBLES} planes publicados más recientemente de los{" "}
              {formatInt(planes.length)} que devuelve el registro para {periodo}.{" "}
            </>
          )}
          Fuente: endpoint <span className="font-mono">/pacc</span> de la API de
          datos abiertos de la DGCP; el documento en sí lo sirve el Portal
          Transaccional. Dos límites que conviene saber: la API devuelve el
          último bloque de planes registrados —no el censo completo de
          instituciones— y su filtro de período no funciona, así que el año se
          filtra aquí. Una versión alta no es un defecto: significa que la
          institución corrigió su plan muchas veces.
        </p>
      </section>
    </div>
  );
}
