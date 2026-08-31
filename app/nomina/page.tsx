import type { Metadata } from "next";
import { IconLayers } from "@/components/icons";
import { Explorer } from "@/components/nomina/explorer";

export const metadata: Metadata = {
  title: "Nómina pública",
  description:
    "Foto transversal de la nómina pública dominicana: plazas, áreas, cargos y sueldos brutos del último mes publicado por cada institución cubierta, sin nombres ni datos personales.",
  robots: { index: false, follow: false },
};

export default function NominaPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
          <IconLayers className="h-4 w-4" />
          Nóminas de transparencia · consolidadas
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Nómina pública
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
