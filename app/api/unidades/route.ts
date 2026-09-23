import { NextResponse } from "next/server";
import { getUnidadesCompra } from "@/lib/dgcp";
import { hrefInstitucion, institucionPorId } from "@/lib/instituciones";

export const dynamic = "force-dynamic";

/**
 * El catálogo de unidades de compra para el buscador. Cada unidad lleva
 * `ficha` —el enlace a su página de institución— cuando está en el cruce
 * (`lib/instituciones.ts`): el href se calcula aquí porque el cruce pesa
 * 114 KB y el buscador es un componente de cliente.
 */
export async function GET() {
  try {
    const unidades = (await getUnidadesCompra()).map((u) => {
      const inst = institucionPorId(u.codigo);
      return inst ? { ...u, ficha: hrefInstitucion(inst) } : u;
    });
    return NextResponse.json(unidades, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
