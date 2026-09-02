import { NextRequest, NextResponse } from "next/server";
import { getCompetencia } from "@/lib/dgcp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const proceso = req.nextUrl.searchParams.get("proceso");
  if (!proceso || proceso.length > 80) {
    return NextResponse.json({ error: "Parámetro proceso inválido" }, { status: 400 });
  }
  try {
    const competencia = await getCompetencia(proceso);
    return NextResponse.json(competencia ?? { oferentes: [], totalOfertas: 0 }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
