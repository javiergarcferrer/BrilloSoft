import type { Metadata } from "next";
import { Database } from "lucide-react";
import { Explorer } from "@/components/nomina/explorer";

export const metadata: Metadata = {
  title: "Explorador de Nómina · Empleados Fijos 2023–2026",
  description:
    "Tabla interactiva de la nómina de empleados fijos (2023–2026): filtra por localidad, cargo, año, mes y sueldo; visualiza el gasto mensual, las localidades de mayor gasto y la distribución salarial.",
  robots: { index: false, follow: false },
};

export default function NominaPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
            <Database className="h-4 w-4" />
            Nómina pública · Empleados Fijos
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Explorador de Nómina 2023–2026
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-soft sm:text-base">
            91,806 registros de plazas fijas en 35 meses. Filtra, ordena y
            visualiza el gasto por localidad y cargo para entender de un vistazo
            cómo se distribuye la nómina.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <Explorer />
      </main>
    </div>
  );
}
