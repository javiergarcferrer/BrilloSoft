import { Cargando, Esqueleto, EsqueletoFilas } from "@/components/esqueleto";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Perención heredaba el esqueleto de un listado con buscador —campo de
 * búsqueda incluido— y aquí no hay ninguno: al llegar el dato la página
 * saltaba entera. Esta es su silueta: la pregunta, la tarjeta del plazo y las
 * filas de las piezas en riesgo, con las alturas del contenido real.
 *
 * Es la espera más larga de la vertical: veinticinco páginas del SIL, que
 * pagina de diez en diez.
 */
export default function Loading() {
  return (
    <Cargando className="mx-auto max-w-4xl">
      <Skeleton className="h-3 w-20 bg-hairline/70" />
      <div className="mb-6 mt-4 space-y-2">
        <Skeleton className="h-9 w-full max-w-sm bg-hairline/70" />
        <Skeleton className="h-3 w-3/4 max-w-md bg-hairline/70" />
      </div>
      <Esqueleto className="mb-6 h-32" />
      <EsqueletoFilas n={6} />
    </Cargando>
  );
}
