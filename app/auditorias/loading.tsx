import { Cargando, Esqueleto, EsqueletoFilas } from "@/components/esqueleto";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * La silueta de las auditorías: la banda de tinta con sus cuatro cifras, el
 * titular de los informes, el buscador con su alcance, los tres filtros de
 * órgano, el listado y, debajo, las listas de declaración jurada. Lee una
 * instantánea local: casi nunca se llega a ver.
 */
export default function Loading() {
  return (
    <Cargando className="space-y-5">
      <Esqueleto className="h-[34rem] border-transparent bg-ink/90 sm:h-80" />
      <Skeleton className="h-8 w-80 max-w-full bg-hairline/70" />
      <div className="space-y-2">
        <Esqueleto className="h-11" />
        <Skeleton className="h-3 w-3/4 max-w-lg bg-hairline/70" />
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 bg-hairline/70 sm:h-9" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <Skeleton className="mx-5 mt-4 h-3 w-48 bg-hairline/70 sm:mx-6" />
        <EsqueletoFilas n={8} className="mt-2 rounded-none border-x-0 border-b-0" />
      </div>
    </Cargando>
  );
}
