import { Cargando, Esqueleto, EsqueletoFilas } from "@/components/esqueleto";

/**
 * La silueta de `/pais`: la portada con su tira de cifras y, por cada una de
 * las tres secciones, la tarjeta del gráfico y la lista que la sigue.
 */
export default function Loading() {
  return (
    <Cargando className="space-y-8">
      <Esqueleto className="h-80 sm:h-72" />
      <Esqueleto className="h-6 w-2/3" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-5">
          <Esqueleto className="h-96" />
          <EsqueletoFilas n={6} />
        </div>
      ))}
    </Cargando>
  );
}
