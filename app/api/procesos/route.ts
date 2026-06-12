import { NextRequest, NextResponse } from "next/server";
import { listProcesos } from "@/lib/dgcp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listProcesos({
      q: sp.get("q") ?? undefined,
      proceso: sp.get("proceso") ?? undefined,
      estado: sp.get("estado") ?? undefined,
      modalidad: sp.get("modalidad") ?? undefined,
      startdate: sp.get("startdate") ?? undefined,
      enddate: sp.get("enddate") ?? undefined,
      mipyme: sp.get("mipyme") ?? undefined,
      mipyme_mujer: sp.get("mipyme_mujer") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      limit: sp.get("limit") ? Math.min(Number(sp.get("limit")), 100) : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 }
    );
  }
}
