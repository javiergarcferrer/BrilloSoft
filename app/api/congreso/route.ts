import { NextResponse } from "next/server";
import { listIniciativas, normalizarIniciativa } from "@/lib/congreso";

export const dynamic = "force-dynamic";

/**
 * Listado de iniciativas del Congreso.
 *
 * Mismo patrón que `/api/procesos`: proxy delgado sobre la función de
 * `lib/congreso.ts`, con `502` si el origen falla.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  try {
    const respuesta = await listIniciativas(page, q);
    return NextResponse.json(
      {
        page: respuesta.page,
        pageSize: respuesta.pageSize,
        total: respuesta.total,
        results: respuesta.results.map(normalizarIniciativa),
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
    );
  } catch (err) {
    console.error("[api/congreso]", err);
    return NextResponse.json(
      { error: "No se pudo consultar el SIL de la Cámara de Diputados." },
      { status: 502 },
    );
  }
}
