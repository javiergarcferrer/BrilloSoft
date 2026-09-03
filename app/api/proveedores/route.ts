import { NextRequest, NextResponse } from "next/server";
import { buscarProveedores, muestrearProveedores } from "@/lib/dgcp";

export const dynamic = "force-dynamic";

/**
 * Proveedores del Estado. Sin `q` devuelve el mercado reciente agregado por
 * RPE; con `q` resuelve la consulta por RPE, documento o nombre.
 *
 * El caché del borde se alinea con la ventana de `lib/dgcp.ts` (30 min para
 * la muestra de contratos que alimenta ambas respuestas).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (q !== null && q.length > 120) {
    return NextResponse.json({ error: "Consulta demasiado larga" }, { status: 400 });
  }

  const cabeceras = {
    "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
  };

  try {
    if (q && q.trim()) {
      return NextResponse.json(await buscarProveedores(q), { headers: cabeceras });
    }
    const mercado = await muestrearProveedores();
    return NextResponse.json(
      { ...mercado, proveedores: mercado.proveedores.slice(0, 200) },
      { headers: cabeceras },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 },
    );
  }
}
