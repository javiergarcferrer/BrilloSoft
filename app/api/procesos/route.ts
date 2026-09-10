import { NextRequest, NextResponse } from "next/server";
import { ORDENES, listProcesos, type OrdenProceso } from "@/lib/dgcp";
import { ETAPAS } from "@/lib/estados";

export const dynamic = "force-dynamic";

/* Enumeraciones cerradas: lo que no esté en la lista no llega a la capa. */
const ETAPAS_VALIDAS = new Set(ETAPAS.map((e) => e.clave as string));
const ORDENES_VALIDOS = new Set<string>(ORDENES);

/** `YYYY-MM-DD` o nada: una fecha con basura no se reenvía a la DGCP. */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const fecha = (v: string | null) => (v && ISO.test(v) ? v : undefined);

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const etapa = sp.get("etapa");
  const orden = sp.get("orden");
  try {
    const result = await listProcesos({
      q: sp.get("q") ?? undefined,
      proceso: sp.get("proceso") ?? undefined,
      estado: sp.get("estado") ?? undefined,
      etapa: etapa && ETAPAS_VALIDAS.has(etapa) ? etapa : undefined,
      orden:
        orden && ORDENES_VALIDOS.has(orden) ? (orden as OrdenProceso) : undefined,
      modalidad: sp.get("modalidad") ?? undefined,
      unidad_compra: sp.get("unidad_compra")
        ? Number(sp.get("unidad_compra"))
        : undefined,
      startdate: fecha(sp.get("startdate")),
      enddate: fecha(sp.get("enddate")),
      mipyme: sp.get("mipyme") ?? undefined,
      mipyme_mujer: sp.get("mipyme_mujer") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      limit: sp.get("limit") ? Math.min(Number(sp.get("limit")), 100) : undefined,
    });
    return NextResponse.json(result, {
      // Los listados se cachean 5 min en lib/dgcp.ts; el borde de la CDN
      // puede servir la misma respuesta ese tiempo y renovarla en segundo plano.
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
