import { cn } from "@/lib/cn";
import { Leyenda } from "./leyenda";

/**
 * Una barra al 100 %: **el reparto de un todo** —los procesos por estado, los
 * votos de una votación—.
 *
 * Los segmentos se separan con 2 px de la superficie, nunca con un trazo
 * alrededor; así dos vecinos del mismo color siguen leyéndose como dos. Cada
 * segmento lleva su `title`, y la etiqueta accesible dice el reparto entero en
 * palabras. La leyenda escribe cada parte con su cifra, así que el color nunca
 * es la única forma de saber cuál es cuál; con `href`, la entrada de la
 * leyenda lleva a la entidad (un segmento de 12 px no es un objetivo de toque).
 *
 * Qué color va en cada segmento lo decide quien llama y **por su oficio**:
 * estados → `TONOS[t].dot` en `ORDEN_TONOS`; dos lados → `DIVERGENTE`. Nunca
 * un color porque «queda bien».
 *
 * Un segmento con valor pero menos de 3 px de ancho se pinta con 3 px para que
 * se vea que existe; la cifra exacta está en la leyenda.
 */
export interface Segmento {
  clave: string;
  etiqueta: string;
  valor: number;
  /** Clase de fondo del segmento. */
  clase: string;
  /** El valor escrito; por omisión, el entero. */
  cifra?: string;
  href?: string;
}

export function BarraApilada({
  segmentos,
  etiqueta,
  sobre = "papel",
  grosor = "normal",
  leyenda = true,
  className,
}: {
  segmentos: Segmento[];
  /** Qué se reparte: «Procesos por estado». */
  etiqueta: string;
  sobre?: "papel" | "tinta";
  grosor?: "fino" | "normal";
  leyenda?: boolean;
  className?: string;
}) {
  const visibles = segmentos.filter((s) => s.valor > 0);
  if (visibles.length === 0) return null;
  const cifra = (s: Segmento) => s.cifra ?? s.valor.toLocaleString("es-DO");
  const texto = `${etiqueta}: ${visibles.map((s) => `${s.etiqueta}, ${cifra(s)}`).join("; ")}`;
  return (
    <figure className={className}>
      <div
        role="img"
        aria-label={texto}
        className={cn("flex w-full gap-[2px]", grosor === "fino" ? "h-1.5" : "h-3")}
      >
        {visibles.map((s) => (
          <div
            key={s.clave}
            title={`${s.etiqueta}: ${cifra(s)}`}
            className={cn("min-w-[3px] first:rounded-l-sm last:rounded-r-sm", s.clase)}
            style={{ flexGrow: s.valor, flexBasis: 0 }}
          />
        ))}
      </div>
      {leyenda && (
        <Leyenda
          className="mt-3"
          sobre={sobre}
          entradas={visibles.map((s) => ({
            clave: s.clave,
            etiqueta: s.etiqueta,
            clase: s.clase,
            forma: "barra",
            cifra: cifra(s),
            href: s.href,
          }))}
        />
      )}
    </figure>
  );
}
