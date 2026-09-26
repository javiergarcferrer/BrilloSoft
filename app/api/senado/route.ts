import { NextResponse } from "next/server";
import {
  CUATRIENIO_VIGENTE,
  buscarExpedientesSenado,
  cuatrienioPorEtiqueta,
  listarRecientesSenado,
} from "@/lib/senado";
import { recortar } from "@/lib/raiz";

export const dynamic = "force-dynamic";

/**
 * Expedientes del Senado.
 *
 * Mismo patrón que `/api/procesos` y `/api/congreso`: proxy delgado sobre
 * `lib/senado.ts`, con `502` si el origen falla. `c` selecciona la colección
 * por cuatrienio (`2024-2028` por defecto); `q` busca la frase y, si no trae nada, hasta tres formas con tilde de su palabra más larga.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = recortar(searchParams.get("q"), 120);
  const cuatrienio =
    cuatrienioPorEtiqueta(searchParams.get("c")) ?? CUATRIENIO_VIGENTE;

  const listado = q
    ? await buscarExpedientesSenado(cuatrienio.etiqueta, q)
    : await listarRecientesSenado(cuatrienio.etiqueta);

  if (!listado) {
    return NextResponse.json(
      { error: "No se pudo consultar el sistema del Senado." },
      { status: 502 },
    );
  }
  return NextResponse.json(listado, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
