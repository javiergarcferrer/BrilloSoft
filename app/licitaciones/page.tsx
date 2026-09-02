import { Suspense } from "react";
import type { Metadata } from "next";
import Buscador from "../buscador";
import { Cargando, Esqueleto, EsqueletoTarjetas } from "@/components/esqueleto";

export const metadata: Metadata = {
  title: "Licitaciones",
  description:
    "Busca procesos de compras públicas del Estado dominicano con los datos abiertos de la DGCP: filtros por institución, modalidad, estado y monto.",
};

/**
 * Buscador de compras públicas.
 *
 * Vivía en `/` hasta que la plataforma pasó a cubrir varios dominios; ahora `/`
 * es el panorama y esta ruta conserva el buscador intacto.
 *
 * El buscador lee la URL (`useSearchParams`), así que en la página estática
 * se renderiza el `fallback` hasta que el navegador hidrata. Antes ese
 * fallback era `null`: el HTML llegaba en blanco y en un teléfono lento la
 * página parecía rota durante uno o dos segundos. Ahora llega con la silueta
 * del buscador —título, filtros, tarjetas— y el contenido cae encima.
 */
export default function LicitacionesPage() {
  return (
    <Suspense fallback={<BuscadorEsqueleto />}>
      <Buscador />
    </Suspense>
  );
}

function BuscadorEsqueleto() {
  return (
    <Cargando className="space-y-5">
      <div className="space-y-2 pt-1">
        <div className="shimmer h-8 w-3/4 max-w-lg rounded-md bg-hairline/70" />
        <div className="shimmer h-3 w-56 rounded-md bg-hairline/70" />
      </div>
      <Esqueleto className="hidden h-56 lg:block" />
      <Esqueleto className="h-11 lg:hidden" />
      <EsqueletoTarjetas n={6} />
    </Cargando>
  );
}
