import { NextRequest, NextResponse } from "next/server";
import { getPreciosSubclase } from "@/lib/dgcp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const subclase = req.nextUrl.searchParams.get("subclase");
  if (!subclase || !/^\d{6,10}$/.test(subclase)) {
    return NextResponse.json({ error: "Parámetro subclase inválido" }, { status: 400 });
  }
  try {
    const stats = await getPreciosSubclase(subclase);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
