import { NextRequest, NextResponse } from "next/server";
import { ORDENES, listProcesos, type OrdenProceso } from "@/lib/dgcp";
import { ETAPAS, etapaDe } from "@/lib/estados";

export const dynamic = "force-dynamic";

/* Enumeraciones cerradas: lo que no esté en la lista no llega a la capa. */
const ETAPAS_VALIDAS = new Set(ETAPAS.map((e) => e.clave as string));
const ORDENES_VALIDOS = new Set<string>(ORDENES);

/** `YYYY-MM-DD` o nada: una fecha con basura no se reenvía a la DGCP. */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const fecha = (v: string | null) => (v && ISO.test(v) ? v : undefined);

/**
 * La etapa pedida. `estado` ya no se reenvía crudo al origen: era el único
 * parámetro de enumeración sin allowlist —contra `.claude/rules/fuentes.md`
 * §API routes— y además ganaba sobre `etapa`, así que
 * `?estado=cualquiercosa&etapa=cerrados` mandaba basura a la DGCP y devolvía
 * un conjunto que contradecía la etapa pedida. Los enlaces antiguos que lo
 * llevan se traducen, como en el feed y en el buscador.
 */
function etapaPedida(sp: URLSearchParams): string | undefined {
  const clave = sp.get("etapa");
  if (clave) return ETAPAS_VALIDAS.has(clave) ? clave : undefined;
  const estado = sp.get("estado");
  return estado ? etapaDe(estado).clave : undefined;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const orden = sp.get("orden");
  try {
    const result = await listProcesos({
      q: sp.get("q") ?? undefined,
      proceso: sp.get("proceso") ?? undefined,
      etapa: etapaPedida(sp),
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
