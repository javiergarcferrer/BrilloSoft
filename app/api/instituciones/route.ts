import { NextResponse } from "next/server";
import { buscarInstituciones, hrefInstitucion } from "@/lib/instituciones";

export const dynamic = "force-dynamic";

/**
 * Sugerencias de institución para la paleta: el cruce pesa 114 KB y no viaja
 * al navegador; aquí se filtra y salen cinco filas.
 */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json([]);
  try {
    const filas = buscarInstituciones(q, 5).map((i) => ({
      href: hrefInstitucion(i),
      nombre: i.nombre,
      detalle: [i.acronimo, i.tipo].filter(Boolean).join(" · "),
    }));
    return NextResponse.json(filas, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo buscar" }, { status: 502 });
  }
}
