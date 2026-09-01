import { NextResponse } from "next/server";
import { cuatrienioPorEtiqueta, getArchivoSenado } from "@/lib/senado";

export const dynamic = "force-dynamic";

/**
 * Redirección al archivo real de un documento del Senado.
 *
 * Resolver la ruta cuesta tres peticiones al consultante (visor + salto `.htm`
 * + cabeceras), así que la ficha solo resuelve su documento principal y todos
 * los demás se enlazan aquí: se resuelve al hacer clic y queda en caché 24 h.
 * Esta ruta **no proxea bytes** —responde 302 al origen— para que el documento
 * siga viniendo del Estado y no de esta plataforma.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cuatrienio = searchParams.get("c") ?? "";
  const expediente = Number(searchParams.get("e"));
  const item = Number(searchParams.get("item"));
  const bd = Number(searchParams.get("bd"));

  if (
    !cuatrienioPorEtiqueta(cuatrienio) ||
    ![expediente, item, bd].every((n) => Number.isInteger(n) && n > 0)
  ) {
    return NextResponse.json({ error: "parámetros inválidos" }, { status: 400 });
  }

  const archivo = await getArchivoSenado(cuatrienio, expediente, item, bd);
  if (!archivo) {
    return NextResponse.json(
      { error: "el consultante no entregó el documento" },
      { status: 502 },
    );
  }

  return NextResponse.redirect(archivo.url, 302);
}
