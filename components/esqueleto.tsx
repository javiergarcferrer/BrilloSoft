import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";

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
 *
 * La pieza atómica es `Skeleton` (`components/ui/skeleton.tsx`); lo que vive
 * aquí son las **siluetas de esta plataforma** —la ficha, el listado con
 * buscador, la tira de indicadores—, que es lo que ninguna librería puede
 * traer: dependen de las alturas y las rejillas del contenido real, y si no
 * coinciden la página salta al llegar el dato.
 */

export function Esqueleto({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("rounded-lg border border-hairline bg-surface", className)}
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
        <Skeleton
          key={i}
          className={cn("h-3 bg-hairline/70", anchos[i % anchos.length])}
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
            <Skeleton className="h-3 w-28 bg-hairline/70" />
            <Skeleton className="h-4 w-16 bg-hairline/70" />
          </div>
          <Skeleton className="h-3.5 w-11/12 bg-hairline/70" />
          {/*
            En el teléfono un título legislativo ocupa dos o tres líneas —el SIL
            publica enunciados de cuarenta palabras—: con una sola, la silueta
            mide 87 px contra los 113 de la fila real, y un listado de diez
            saltaba medio pantallazo al llegar el dato.
          */}
          <Skeleton className="h-3.5 w-3/4 bg-hairline/70 sm:hidden" />
          <Skeleton className="h-3 w-1/2 bg-hairline/70" />
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
      {/*
        En un teléfono de 390 px ninguna pregunta de esta plataforma cabe en un
        renglón: el titular de cada vertical ocupa dos o tres líneas, así que la
        silueta reserva dos. Con una sola, la página entera subía 40 px al
        llegar el título —en cada navegación, en todas las rutas que usan esta
        silueta—.
      */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-8 w-full max-w-md bg-hairline/70 sm:w-2/3" />
        <Skeleton className="h-8 w-3/5 max-w-xs bg-hairline/70 sm:hidden" />
        <Skeleton className="h-3 w-1/2 max-w-xs bg-hairline/70" />
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
        <Skeleton className="h-9 w-2/3 max-w-sm bg-hairline/70" />
        <Skeleton className="h-3 w-3/4 max-w-md bg-hairline/70" />
      </div>
      <Esqueleto className="h-11" />
      <Skeleton className="mt-4 h-3 w-40 bg-hairline/70" />
      <EsqueletoFilas n={filas} className="mt-3" />
    </Cargando>
  );
}

/** Ficha: enlace de vuelta, cabecera, dossier y paneles en dos columnas. */
export function EsqueletoFicha() {
  return (
    <Cargando className="mx-auto max-w-4xl">
      <Skeleton className="h-3 w-20 bg-hairline/70" />
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-36 bg-hairline/70" />
          <Skeleton className="h-4 w-20 bg-hairline/70" />
        </div>
        <Skeleton className="h-6 w-full bg-hairline/70" />
        <Skeleton className="h-6 w-4/5 bg-hairline/70" />
      </div>
      <Esqueleto className="mt-5 h-40" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Esqueleto className="h-64" />
        <Esqueleto className="h-64" />
      </div>
    </Cargando>
  );
}
