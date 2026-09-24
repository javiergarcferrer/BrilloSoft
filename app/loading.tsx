import { EsqueletoPagina } from "@/components/esqueleto";

/**
 * Silueta genérica para toda ruta sin esqueleto propio: la navegación pinta
 * al instante y el contenido llega por streaming cuando la fuente responde.
 */
export default function Loading() {
  return (
    <>
      {/* Un lector de pantalla que llega durante la carga oye qué pasa, y la
          página nunca queda sin `h1` (axe: page-has-heading-one). */}
      <h1 className="sr-only">Cargando la página…</h1>
      <EsqueletoPagina />
    </>
  );
}
