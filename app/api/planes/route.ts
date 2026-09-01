import { NextRequest, NextResponse } from "next/server";
import { listPacc } from "@/lib/dgcp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const periodo = req.nextUrl.searchParams.get("periodo");
  const unidad = req.nextUrl.searchParams.get("unidad_compra");
  if (periodo && !/^\d{4}$/.test(periodo)) {
    return NextResponse.json({ error: "Parámetro periodo inválido" }, { status: 400 });
  }
  if (unidad && !/^\d{1,10}$/.test(unidad)) {
    return NextResponse.json({ error: "Parámetro unidad_compra inválido" }, { status: 400 });
  }
  try {
    const planes = await listPacc({
      periodo: periodo ? Number(periodo) : undefined,
      unidad_compra: unidad ?? undefined,
    });
    return NextResponse.json({ planes });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
