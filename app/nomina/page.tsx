import type { Metadata } from "next";
import { preload } from "react-dom";
import { IconLayers } from "@/components/icons";
import { Explorer } from "@/components/nomina/explorer";

export const metadata: Metadata = {
  title: "¿A quién le paga el Estado?",
  description:
    "Foto transversal de la nómina pública dominicana: plazas, áreas, cargos y sueldos brutos del último mes publicado por cada institución cubierta, sin nombres ni datos personales.",
  robots: { index: false, follow: false },
};

export default function NominaPage() {
  /*
    El explorador es un componente cliente que pide la instantánea al
    hidratar: HTML → JavaScript → hidratación → fetch → render, cuatro pasos
    en fila. La pista de precarga viaja en el HTML y el navegador empieza a
    bajar el JSON en paralelo con el JavaScript; cuando el explorador lo pide,
    ya está en caché. `anonymous` casa con el modo del `fetch()` del cliente.
  */
  preload("/data/nomina.json", { as: "fetch", crossOrigin: "anonymous" });

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 rotulo text-brand-700">
          <IconLayers className="h-4 w-4" />
          Nóminas de transparencia · consolidadas
        </div>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          ¿A quién le paga el Estado?
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft sm:text-base">
          Qué paga el Estado por plaza: la foto del último mes publicado por cada
          institución cubierta, consolidada desde sus nóminas oficiales de
          transparencia. Filtra por institución, área, cargo y sueldo — sin
          nombres ni datos personales.
        </p>
      </header>

      <Explorer />
    </div>
  );
}
