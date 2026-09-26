import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CondicionBadge, MarcaIniciativa } from "@/components/iniciativa-card";
import { desdeMayusculas, iniciativaPorNumero, type Iniciativa } from "@/lib/congreso";
import { gemeloEnSenado } from "@/lib/senado";
import { fraseDeBusqueda, numeroDeNorma, proyectosDeNorma } from "@/lib/legislacion";
import { enlace } from "@/lib/grafo";

/*
  Los puentes entre fichas: Diputados ↔ Senado para la misma pieza, y de una
  ley a los proyectos que la originaron o la tocan. Cada uno es un componente
  asíncrono para ir en su propio `Suspense`: la ficha se lee mientras el otro
  origen contesta, y si no contesta —o el cruce no se puede **confirmar**—, el
  bloque no aparece. Un puente adivinado es peor que ninguno.
*/

/** En la ficha de Diputados: el mismo proyecto en el Senado. */
export async function EnElSenado({
  numero,
  titulo,
  promulgacion,
}: {
  /** Cita de Diputados: `06099-2024-2028-CD`. */
  numero: string;
  titulo: string;
  promulgacion: string | null;
}) {
  const gemelo = await gemeloEnSenado(numero, fraseDeBusqueda(titulo), promulgacion);
  if (!gemelo) return null;

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>En el Senado</CardTitle>
      </CardHeader>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-ink">
            {gemelo.numero ?? `Expediente ${gemelo.id}`}
          </span>
          {gemelo.estado && <CondicionBadge tono={gemelo.tono}>{gemelo.estado}</CondicionBadge>}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
          {gemelo.confirmadoPor === "cita"
            ? "El expediente del Senado declara esta misma pieza de Diputados como su gemelo."
            : "Ambas cámaras registran la promulgación con el mismo número de ley."}{" "}
          Ahí están su trámite en la otra cámara y, a veces, el texto escaneado.
        </p>
        <Button asChild variant="secondary" className="mt-3 w-full sm:w-auto">
          <Link href={enlace.expedienteSenado(gemelo.cuatrienio, gemelo.id)}>
            Ver el expediente del Senado →
          </Link>
        </Button>
      </div>
    </Card>
  );
}

/**
 * En la ficha del Senado: la misma pieza en Diputados. Si el Senado llenó el
 * campo de cruce, se resuelve esa cita; si no, y la pieza ya es ley, se busca
 * en el SIL la pieza de Diputados promulgada con el mismo número.
 */
export async function EnDiputados({
  numero,
  promulgacion,
  titulo,
}: {
  numero: string | null;
  promulgacion: string | null;
  titulo: string;
}) {
  const ley = numeroDeNorma(promulgacion);
  const lectura = numero ? await iniciativaPorNumero(numero) : null;
  // Si el SIL no contestó, el bloque no aparece: decir «no aparece ahí» sería
  // afirmar una ausencia que no se comprobó.
  if (lectura === "caida") return null;
  const ini =
    lectura && lectura !== "inexistente"
      ? lectura
      : !numero && ley
        ? ((await proyectosDeNorma("Ley", ley, titulo))?.origen[0] ?? null)
        : null;
  if (!numero && !ini) return null;

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>En la Cámara de Diputados</CardTitle>
      </CardHeader>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm tabular-nums text-ink">
            {numero ?? ini?.numero?.completo}
          </span>
          {ini && <MarcaIniciativa iniciativa={ini} />}
        </div>
        {ini ? (
          <>
            {!numero && (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                El Senado no anotó la cita de Diputados; esta pieza se promulgó con
                el mismo número de ley.
              </p>
            )}
            <Button asChild variant="secondary" className="mt-3 w-full sm:w-auto">
              <Link href={enlace.iniciativa(ini.id)}>Ver la ficha en Diputados →</Link>
            </Button>
          </>
        ) : (
          <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
            Cita del expediente gemelo en Diputados. El SIL de la Cámara solo
            guarda su registro vigente (2024-2028) y lo que se arrastró a él, y
            esta cita no aparece ahí; se muestra como referencia.
          </p>
        )}
      </div>
    </Card>
  );
}

/** En la ficha de una ley: el proyecto que la originó y los que hoy la tocan. */
export async function ProyectosDeLaNorma({
  tipo,
  numero,
  titulo,
}: {
  tipo: string;
  numero: string;
  titulo: string | null;
}) {
  const r = await proyectosDeNorma(tipo, numero, titulo);
  if (!r || (r.origen.length === 0 && r.citan.length === 0)) return null;

  return (
    <Card as="section" className="mt-5">
      <CardHeader>
        <CardTitle>En el Congreso</CardTitle>
      </CardHeader>
      <div className="divide-y divide-hairline">
        {r.origen.length > 0 && (
          <div className="px-5 py-4">
            <p className="rotulo text-ink-soft">El proyecto que la originó</p>
            <ul className="mt-2 space-y-2">
              {r.origen.map((ini) => (
                <FilaProyecto key={ini.id} ini={ini} />
              ))}
            </ul>
          </div>
        )}
        {r.citan.length > 0 && (
          <div className="px-5 py-4">
            <p className="rotulo text-ink-soft">Proyectos que la citan en su título</p>
            <ul className="mt-2 space-y-2">
              {r.citan.map((ini) => (
                <FilaProyecto key={ini.id} ini={ini} />
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="border-t border-hairline px-5 py-3 text-xs leading-relaxed text-ink-soft">
        Del SIL de la Cámara de Diputados.
        {r.origen.length > 0 && " El origen se confirma por el número con que se promulgó, no por el parecido del título."}
        {r.citan.length > 0 &&
          ` Las citas salen de las ${r.revisadas} piezas más recientes que su buscador devuelve para «${numero}».`}{" "}
        El SIL solo guarda el registro vigente (2024-2028) y lo arrastrado a él;
        el Senado no se consulta aquí.
      </p>
    </Card>
  );
}

function FilaProyecto({ ini }: { ini: Iniciativa }) {
  return (
    <li className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={enlace.iniciativa(ini.id)}
          className="font-mono text-xs font-semibold tabular-nums text-brand-700 estira hover:underline"
        >
          {ini.numero?.completo ?? `#${ini.id}`}
        </Link>
        <MarcaIniciativa iniciativa={ini} />
      </div>
      <p className="mt-1 text-sm leading-snug text-ink">{desdeMayusculas(ini.titulo)}</p>
    </li>
  );
}
