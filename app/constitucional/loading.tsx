import { Cargando, Esqueleto, EsqueletoFilas } from "@/components/esqueleto";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * La silueta de las sentencias del Tribunal Constitucional: la banda de tinta
 * con sus cuatro cifras, la tarjeta de los años (chips y el mando de los
 * anteriores), el buscador con su alcance y el listado —número y antigüedad,
 * el «relativo a» en dos o tres renglones, el expediente—. El año en curso
 * tarda unos segundos en llegar la primera vez; lo que llega cae en su sitio.
 */
export default function Loading() {
  return (
    <Cargando className="space-y-5">
      <Esqueleto className="h-[34rem] border-transparent bg-ink/90 sm:h-80" />
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="flex flex-wrap gap-2 px-5 py-4 sm:gap-1.5 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-16 bg-hairline/70 sm:h-9" />
          ))}
        </div>
        <div className="flex min-h-11 items-center border-t border-hairline px-5">
          <Skeleton className="h-3 w-64 max-w-full bg-hairline/70" />
        </div>
      </div>
      <div className="space-y-2">
        <Esqueleto className="h-11" />
        <Skeleton className="h-3 w-3/4 max-w-lg bg-hairline/70" />
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <Skeleton className="mx-5 mt-4 h-3 w-48 bg-hairline/70 sm:mx-6" />
        <EsqueletoFilas n={8} className="mt-2 rounded-none border-x-0 border-b-0" />
      </div>
    </Cargando>
  );
}
