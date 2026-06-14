import type { Metadata } from "next";
import { SearchExplorer } from "@/components/licita/search-explorer";
import { CATEGORIAS } from "@/lib/licitaciones/data";
import { FILTROS_VACIOS, type Orden } from "@/lib/licitaciones/utils";

export const metadata: Metadata = {
  title: "Explorar licitaciones",
  description:
    "Busca y filtra licitaciones públicas del Estado dominicano por categoría, institución, monto, provincia y tipo de procedimiento.",
};

const ORDENES: Orden[] = ["afinidad", "cierre", "monto", "reciente"];

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const cat = typeof sp.cat === "string" ? sp.cat : undefined;
  const ordenParam = typeof sp.orden === "string" ? sp.orden : undefined;

  const initial = {
    ...FILTROS_VACIOS,
    texto: q,
    categorias: cat && CATEGORIAS.some((c) => c.id === cat) ? [cat] : [],
  };
  const initialOrden: Orden =
    ordenParam && ORDENES.includes(ordenParam as Orden)
      ? (ordenParam as Orden)
      : "afinidad";

  return (
    <div className="border-b border-hairline bg-canvas">
      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 pb-2 pt-8 sm:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Explorar licitaciones
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Busca, filtra y guarda procesos del Portal Transaccional con alertas
            y orden por afinidad.
          </p>
        </div>
      </div>
      <SearchExplorer initial={initial} initialOrden={initialOrden} />
    </div>
  );
}
