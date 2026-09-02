import { EsqueletoPagina } from "@/components/esqueleto";

/**
 * Silueta genérica para toda ruta sin esqueleto propio: la navegación pinta
 * al instante y el contenido llega por streaming cuando la fuente responde.
 */
export default function Loading() {
  return <EsqueletoPagina />;
}
