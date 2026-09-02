import Link from "next/link";
import { Suspense } from "react";
import { getPreciosSubclase, type PreciosStats } from "@/lib/dgcp";
import { formatFecha, formatMonto } from "@/lib/format";
import Plegable from "@/components/plegable";

/**
 * Precios históricos de adjudicación por subclase UNSPSC.
 *
 * Antes era un componente cliente que, tras hidratar, lanzaba una petición a
 * `/api/precios` por subclase: cuatro viajes de ida y vuelta después de que
 * la página ya estaba en pantalla. Ahora cada subclase es un componente de
 * servidor dentro de su propio `Suspense`: la ficha llega entera y los
 * precios se transmiten en cuanto la DGCP contesta, sin JavaScript de por
 * medio y con la misma caché de una hora de `lib/dgcp.ts`.
 */
export default function PreciosHistoricos({
  subclases,
  divisa,
}: {
  subclases: { codigo: string; descripcion: string }[];
  divisa: string;
}) {
  if (subclases.length === 0) return null;
  return (
    <section className="rounded-lg bg-surface p-6 border border-hairline">
      <h2 className="font-sans font-semibold">Precios históricos de adjudicación</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Lo que el Estado realmente pagó en contratos recientes por artículos de la misma
        categoría UNSPSC — úsalo como referencia antes de fijar tu precio.
      </p>
      <div className="mt-4 space-y-5">
        {subclases.map((s) => (
          <Suspense key={s.codigo} fallback={<SubclaseEsqueleto subclase={s} />}>
            <SubclaseStats subclase={s} divisa={divisa} />
          </Suspense>
        ))}
      </div>
    </section>
  );
}

function Cabecera({ subclase }: { subclase: { codigo: string; descripcion: string } }) {
  return (
    <h3 className="text-sm font-semibold">
      {subclase.descripcion}{" "}
      <span className="font-mono text-xs font-normal text-ink-soft">
        UNSPSC {subclase.codigo}
      </span>
    </h3>
  );
}

function SubclaseEsqueleto({ subclase }: { subclase: { codigo: string; descripcion: string } }) {
  return (
    <div aria-busy="true" className="rounded-lg border border-hairline p-4">
      <Cabecera subclase={subclase} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shimmer h-14 rounded-lg border border-hairline bg-canvas" />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">Consultando los contratos de la DGCP…</p>
    </div>
  );
}

async function SubclaseStats({
  subclase,
  divisa,
}: {
  subclase: { codigo: string; descripcion: string };
  divisa: string;
}) {
  const stats: PreciosStats | null = await getPreciosSubclase(subclase.codigo).catch(
    () => null,
  );

  return (
    <div className="rounded-lg border border-hairline p-4">
      <Cabecera subclase={subclase} />

      {!stats ? (
        <p className="mt-2 text-sm text-ink-soft">
          No se pudo consultar el histórico ahora mismo.
        </p>
      ) : stats.muestras === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          Sin contratos recientes registrados en esta categoría.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-canvas px-2 py-2">
              <div className="text-xs text-ink-soft">Mínimo</div>
              <div className="font-mono text-sm font-semibold tabular-nums">
                {formatMonto(stats.min, divisa)}
              </div>
            </div>
            <div className="rounded-lg bg-brand-50 px-2 py-2 ring-1 ring-brand-100">
              <div className="text-xs text-ink-soft">
                Mediana · {stats.muestras} contratos
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums text-ink">
                {formatMonto(stats.mediana, divisa)}
              </div>
            </div>
            <div className="rounded-lg bg-canvas px-2 py-2">
              <div className="text-xs text-ink-soft">Máximo</div>
              <div className="font-mono text-sm font-semibold tabular-nums">
                {formatMonto(stats.max, divisa)}
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">
            Precios unitarios; los rangos amplios suelen mezclar presentaciones o
            alcances distintos — compara siempre con la descripción del contrato.
          </p>

          {stats.ejemplos.length > 0 && (
            <Plegable
              className="-mx-4 -mb-4 mt-3 border-t border-hairline"
              etiqueta={`Ver los ${stats.ejemplos.length} contratos recientes`}
              etiquetaCerrar="Ocultar los contratos recientes"
            >
              <ul className="space-y-1.5 px-4 pt-3">
                {stats.ejemplos.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg bg-canvas px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {e.descripcion_usuario || e.descripcion_articulo}
                      </span>
                      <Link
                        href={`/procesos/${encodeURIComponent(e.codigo_proceso)}`}
                        className="font-mono text-brand-700 hover:underline"
                      >
                        {e.codigo_proceso}
                      </Link>{" "}
                      <span className="text-ink-soft">
                        · {formatFecha(e.fecha_creacion_contrato)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono font-semibold tabular-nums">
                        {formatMonto(e.precio_unitario, divisa)}
                      </span>
                      <span className="text-ink-soft">
                        × {e.cantidad?.toLocaleString("es-DO")} {e.unidad_medida}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Plegable>
          )}
        </>
      )}
    </div>
  );
}
