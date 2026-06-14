import type { Metadata } from "next";
import { AnalyticsCharts } from "@/components/licita/analytics-charts";

export const metadata: Metadata = {
  title: "Analítica de mercado",
  description:
    "Inteligencia de contrataciones públicas: valor por institución, procesos por categoría, distribución por estado y ranking de adjudicaciones.",
};

export default function AnaliticaPage() {
  return (
    <div>
      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-8 sm:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Analítica de mercado
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Entiende el panorama de las compras públicas: quién compra, en qué
            rubros y quién está ganando los contratos.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <AnalyticsCharts />
      </div>
    </div>
  );
}
