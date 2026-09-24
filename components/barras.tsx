/**
 * Una serie de saldos en barras verticales, pintada en el servidor.
 *
 * Una sola serie y un solo tono (el de la vertical, que se pasa como clase
 * literal para que Tailwind la vea): no hay leyenda que leer,
 * el título de la tarjeta la nombra. Cada barra lleva su `<title>` —el
 * navegador lo muestra al apuntarla— y la etiqueta accesible del gráfico dice
 * el primer y el último valor; la tabla completa va aparte, desplegable, para
 * quien no puede o no quiere leer barras. Las marcas del eje van en HTML
 * debajo del SVG y no dentro: dentro de un `viewBox` el texto se encoge con el
 * gráfico y a 390 px bajaba de 8 px.
 */
export function Barras({
  puntos,
  etiqueta,
  alto = 180,
  tono = "fill-v-finanzas",
}: {
  puntos: { clave: string; valor: number; titulo: string; marca?: string }[];
  /** Qué dice el gráfico, para quien no lo ve. */
  etiqueta: string;
  alto?: number;
  /** Clase de relleno de la vertical: `fill-v-finanzas`, `fill-v-compras`. */
  tono?: "fill-v-finanzas" | "fill-v-compras";
}) {
  const n = puntos.length;
  if (n === 0) return null;
  const max = Math.max(1, ...puntos.map((p) => p.valor));
  const paso = 10;
  const ancho = n * paso;
  const marcas = puntos.filter((p) => p.marca);

  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        className="h-44 w-full sm:h-52"
        role="img"
        aria-label={etiqueta}
      >
        <line x1={0} x2={ancho} y1={alto - 0.5} y2={alto - 0.5} className="stroke-hairline" strokeWidth={1} />
        {puntos.map((p, i) => {
          const h = Math.max(1, (p.valor / max) * (alto - 4));
          return (
            <rect
              key={p.clave}
              x={i * paso + 1}
              y={alto - h}
              width={paso - 2}
              height={h}
              rx={1}
              className={tono}
            >
              <title>{p.titulo}</title>
            </rect>
          );
        })}
      </svg>
      <div className="relative mt-1 h-4 font-mono text-xs tabular-nums text-ink-soft" aria-hidden>
        {marcas.map((p) => {
          const i = puntos.indexOf(p);
          const izq = ((i + 0.5) / n) * 100;
          return (
            <span
              key={p.clave}
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
              style={{ left: i === 0 ? 0 : i === n - 1 ? "100%" : `${izq}%` }}
            >
              {p.marca}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
