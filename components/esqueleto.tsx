import { cn } from "@/lib/cn";

/**
 * Esqueletos: la forma de la página antes de que llegue el dato.
 *
 * Cada `loading.tsx` y cada `Suspense` pinta con estas piezas la silueta de
 * lo que va a aparecer —mismas alturas, mismas rejillas— para que el
 * contenido caiga en su sitio sin mover nada (sin salto de diseño) y para que
 * la navegación responda al instante aunque la fuente tarde. Son papel sobre
 * papel: filete, esquina contenida, el brillo de `.shimmer` y nada más.
 *
 * Todas son componentes de servidor: no llevan estado ni efectos.
 */

export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("shimmer rounded-lg border border-hairline bg-surface", className)}
    />
  );
}

/** Líneas de texto de anchos desiguales, como un párrafo aún sin tinta. */
export function EsqueletoLineas({
  n = 3,
  className,
}: {
  n?: number;
  className?: string;
}) {
  const anchos = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-4/5"];
  return (
    <div aria-hidden className={cn("space-y-2", className)}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={cn("shimmer h-3 rounded-md bg-hairline/70", anchos[i % anchos.length])}
        />
      ))}
    </div>
  );
}

/** Filas de un listado denso (iniciativas, expedientes, normas). */
export function EsqueletoFilas({ n = 8, className }: { n?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-surface",
        className,
      )}
    >
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="space-y-2 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="shimmer h-3 w-28 rounded-md bg-hairline/70" />
            <div className="shimmer h-4 w-16 rounded-md bg-hairline/70" />
          </div>
          <div className="shimmer h-3.5 w-11/12 rounded-md bg-hairline/70" />
          <div className="shimmer h-3 w-1/2 rounded-md bg-hairline/70" />
        </div>
      ))}
    </div>
  );
}

/** Rejilla de tarjetas (resultados de licitaciones, dominios del panorama). */
export function EsqueletoTarjetas({
  n = 6,
  alto = "h-44",
  columnas = "md:grid-cols-2",
  className,
}: {
  n?: number;
  alto?: string;
  columnas?: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("grid gap-3", columnas, className)}>
      {Array.from({ length: n }).map((_, i) => (
        <Esqueleto key={i} className={alto} />
      ))}
    </div>
  );
}

/**
 * Envoltorio accesible de una página en carga: anuncia el estado una sola
 * vez y oculta la silueta al lector de pantalla.
 */
export function Cargando({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}

/** Página genérica: título, un bloque ancho y dos paneles. */
export function EsqueletoPagina() {
  return (
    <Cargando className="space-y-5">
      <div className="space-y-2 pt-1">
        <div className="shimmer h-8 w-2/3 max-w-md rounded-md bg-hairline/70" />
        <div className="shimmer h-3 w-1/2 max-w-xs rounded-md bg-hairline/70" />
      </div>
      <Esqueleto className="h-56" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Esqueleto className="h-72" />
        <Esqueleto className="h-72" />
      </div>
    </Cargando>
  );
}

/** Listado con buscador: cabecera, campo de búsqueda, conteo y filas. */
export function EsqueletoListado({ filas = 8 }: { filas?: number }) {
  return (
    <Cargando className="mx-auto max-w-4xl">
      <div className="mb-5 space-y-2">
        <div className="shimmer h-9 w-2/3 max-w-sm rounded-md bg-hairline/70" />
        <div className="shimmer h-3 w-3/4 max-w-md rounded-md bg-hairline/70" />
      </div>
      <Esqueleto className="h-11" />
      <div className="shimmer mt-4 h-3 w-40 rounded-md bg-hairline/70" />
      <EsqueletoFilas n={filas} className="mt-3" />
    </Cargando>
  );
}

/** Ficha: enlace de vuelta, cabecera, dossier y paneles en dos columnas. */
export function EsqueletoFicha() {
  return (
    <Cargando className="mx-auto max-w-4xl">
      <div className="shimmer h-3 w-20 rounded-md bg-hairline/70" />
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="shimmer h-4 w-36 rounded-md bg-hairline/70" />
          <div className="shimmer h-4 w-20 rounded-md bg-hairline/70" />
        </div>
        <div className="shimmer h-6 w-full rounded-md bg-hairline/70" />
        <div className="shimmer h-6 w-4/5 rounded-md bg-hairline/70" />
      </div>
      <Esqueleto className="mt-5 h-40" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Esqueleto className="h-64" />
        <Esqueleto className="h-64" />
      </div>
    </Cargando>
  );
}
