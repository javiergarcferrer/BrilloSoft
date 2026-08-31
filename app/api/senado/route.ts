import { NextResponse } from "next/server";
import {
  CUATRIENIO_VIGENTE,
  buscarExpedientesSenado,
  cuatrienioPorEtiqueta,
  listarRecientesSenado,
} from "@/lib/senado";

export const dynamic = "force-dynamic";

/**
 * Expedientes del Senado.
 *
 * Mismo patrón que `/api/procesos` y `/api/congreso`: proxy delgado sobre
 * `lib/senado.ts`, con `502` si el origen falla. `c` selecciona la colección
 * por cuatrienio (`2024-2028` por defecto); `q` busca subcadena literal.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
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
  return NextResponse.json(listado);
}
