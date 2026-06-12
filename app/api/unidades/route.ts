import { NextResponse } from "next/server";
import { getUnidadesCompra } from "@/lib/dgcp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const unidades = await getUnidadesCompra();
    return NextResponse.json(unidades, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
