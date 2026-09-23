import { NextRequest, NextResponse } from "next/server";
import { listProcesos } from "@/lib/dgcp";
import { filtrosDeQuery } from "./filtros";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listProcesos({
      ...filtrosDeQuery(sp),
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
