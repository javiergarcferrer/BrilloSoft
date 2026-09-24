import { Cargando, Esqueleto, EsqueletoFilas } from "@/components/esqueleto";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * La silueta de `/luz`: la portada con su tira de cuatro cifras, los chips de
 * empresa, el buscador y un día de cortes.
 */
export default function Loading() {
  return (
    <Cargando className="space-y-5">
      <Esqueleto className="h-80 sm:h-72" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 bg-hairline/70" />
        <Skeleton className="h-10 w-28 bg-hairline/70" />
        <Skeleton className="h-10 w-24 bg-hairline/70" />
      </div>
      <Esqueleto className="h-11" />
      <EsqueletoFilas n={6} />
    </Cargando>
  );
}
