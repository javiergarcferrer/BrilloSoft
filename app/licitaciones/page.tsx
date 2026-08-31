import { Suspense } from "react";
import type { Metadata } from "next";
import Buscador from "../buscador";

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
 */
export default function LicitacionesPage() {
  return (
    <Suspense fallback={null}>
      <Buscador />
    </Suspense>
  );
}
