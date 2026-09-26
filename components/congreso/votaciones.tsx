import Link from "next/link";
import { ETIQUETA_SENTIDO, type SentidoVoto, type Votacion } from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { enlace } from "@/lib/grafo";

/**
 * Una votación del pleno de Diputados, en una fila.
 *
 * El orden es el de la ergonomía de la casa: **qué se sometió** (la moción, en
 * las palabras del acta), **cómo salió** (el recuento, con su base: presentes
 * de cuántos miembros) y, si la fila viene de la ficha de un diputado, **qué
 * votó él**. Toda la fila lleva a la votación, donde está el voto nominal de
 * cada uno.
 *
 * El sentido del voto va en palabras y en grafito: ningún color de
 * `lib/estados.ts` significa «a favor» o «en contra», y pintar uno sería
 * inventarle una valencia a un voto.
 */
export function FilaVotacion({
  votacion,
  conSentido = false,
}: {
  votacion: Votacion;
  /** Mostrar cómo votó el legislador de la ficha. */
  conSentido?: boolean;
}) {
  const emitidos = votacion.si + votacion.no + votacion.abstencion;

  return (
    <li className="relative border-b border-hairline last:border-0">
      <div className="px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Link
            href={enlace.votacion(votacion.id)}
            className="font-mono text-xs font-semibold tabular-nums text-brand-700 estira hover:underline"
          >
            {votacion.titulo}
          </Link>
          {votacion.fecha && (
            <span className="font-mono text-xs tabular-nums text-ink-soft">
              {formatFecha(votacion.fecha)}
            </span>
          )}
          {conSentido && votacion.sentido && <SentidoBadge sentido={votacion.sentido} />}
        </div>

        {votacion.mocion && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-snug text-ink">{votacion.mocion}</p>
        )}

        <Recuento votacion={votacion} emitidos={emitidos} className="mt-2" />
      </div>
    </li>
  );
}

/** El recuento con su base, y la barra del reparto entre los votos emitidos. */
export function Recuento({
  votacion,
  emitidos,
  className,
}: {
  votacion: Votacion;
  emitidos: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="font-mono text-xs tabular-nums text-ink-soft">
        <span className="font-semibold text-ink">{votacion.si}</span> a favor ·{" "}
        <span className="font-semibold text-ink">{votacion.no}</span> en contra ·{" "}
        <span className="font-semibold text-ink">{votacion.abstencion}</span>{" "}
        {votacion.abstencion === 1 ? "abstención" : "abstenciones"}
        {votacion.presentes !== null && (
          <>
            {" "}
            · {votacion.presentes} presentes
            {votacion.miembros ? ` de ${votacion.miembros}` : ""}
          </>
        )}
      </p>
      {emitidos > 0 && (
        <Progress
          value={votacion.si}
          max={emitidos}
          className="h-1.5 max-w-xs"
          aria-label={`${votacion.si} de ${emitidos} votos emitidos a favor`}
        />
      )}
    </div>
  );
}

export function SentidoBadge({ sentido }: { sentido: SentidoVoto }) {
  return (
    <Badge forma="etiqueta" variant={sentido === "si" || sentido === "no" ? "contorno" : "neutro"}>
      {sentido === "si" || sentido === "no" || sentido === "abstencion"
        ? `Votó: ${ETIQUETA_SENTIDO[sentido].toLowerCase()}`
        : ETIQUETA_SENTIDO[sentido]}
    </Badge>
  );
}
