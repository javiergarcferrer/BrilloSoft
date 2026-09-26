import { NextResponse, type NextRequest } from "next/server";
import { rutaDirecta } from "@/lib/buscar";

/**
 * El atajo de `/buscar` («Ley 47-20», un RNC, un código de proceso, unas
 * siglas) como redirección HTTP. Dentro de la página, `redirect()` llega
 * después de que `app/loading.tsx` empezó a enviar la respuesta: el
 * navegador con JavaScript llegaba, pero la respuesta era un 200 sin
 * `Location`. La página conserva su propio atajo como red por si esto no
 * corre. Sin estado, sin variables de entorno: lee la URL y un JSON del
 * repositorio.
 */
export function middleware(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  const destino = q ? rutaDirecta(q) : null;
  if (!destino) return NextResponse.next();
  return NextResponse.redirect(new URL(destino, req.url), 307);
}

export const config = { matcher: "/buscar" };
