import { Cargando, Esqueleto } from "@/components/esqueleto";

/**
 * La silueta del índice de proveedores: banda de cabecera, tira de cifras,
 * campo de búsqueda y las dos columnas del ranking, con sus alturas. El
 * contenido cae en su sitio sin mover nada.
 */
export default function Loading() {
  return (
    <Cargando className="space-y-5">
      <Esqueleto className="h-52 border-transparent bg-ink/90" />
      <div className="grid divide-y divide-hairline border-y border-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 px-5 py-4">
            <div className="shimmer h-3 w-24 rounded-md bg-hairline/70" />
            <div className="shimmer h-6 w-28 rounded-md bg-hairline/70" />
            <div className="shimmer h-2.5 w-32 rounded-md bg-hairline/70" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Esqueleto className="h-11" />
        <div className="shimmer h-3 w-3/4 max-w-lg rounded-md bg-hairline/70" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Esqueleto className="h-[30rem]" />
        <Esqueleto className="h-[30rem]" />
      </div>
    </Cargando>
  );
}
