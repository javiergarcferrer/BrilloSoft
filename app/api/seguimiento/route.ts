import { NextResponse } from "next/server";
import { desdeMayusculas, getIniciativa, normalizarIniciativa } from "@/lib/congreso";
import { cuatrienioPorEtiqueta, getFichaSenado } from "@/lib/senado";
import { huellaDe } from "@/lib/seguimiento";

export const dynamic = "force-dynamic";

/**
 * El estado de hoy de una pieza del Congreso que alguien sigue.
 *
 * `/seguimiento` compara, en el navegador, lo que la fuente dice ahora con la
 * huella que guardó la última vez. Para las compras le basta `/api/procesos`
 * (`?proceso=`); para el Congreso no había ninguna ruta que devolviera **una**
 * pieza —`/api/congreso` y `/api/senado` son listados y búsquedas—, y buscar
 * por texto para encontrar un id es frágil. Esta ruta es el proxy delgado de
 * las dos lecturas de ficha que ya existen (`getIniciativa`, `getFichaSenado`)
 * y devuelve solo la huella —calculada con `huellaDe`, la misma función que
 * usa la ficha al seguir— y el título.
 *
 *   ?tipo=proyecto&id=155693
 *   ?tipo=expediente-senado&id=2024-2028/1234
 *
 * No guarda nada: quién sigue qué sigue viviendo solo en el navegador.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const id = searchParams.get("id") ?? "";

  try {
    if (tipo === "proyecto") {
      if (!/^\d{1,9}$/.test(id)) {
        return NextResponse.json({ error: "Id de iniciativa inválido." }, { status: 400 });
      }
      const raw = await getIniciativa(Number(id));
      if (!raw) {
        return NextResponse.json(
          { error: "El SIL de la Cámara no devolvió la iniciativa." },
          { status: 502 },
        );
      }
      const ini = normalizarIniciativa(raw);
      return NextResponse.json(
        { huella: huellaDe(ini), titulo: desdeMayusculas(ini.titulo) },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
      );
    }

    if (tipo === "expediente-senado") {
      const m = /^(\d{4}-\d{4})\/(\d{1,9})$/.exec(id);
      const cuatrienio = m ? cuatrienioPorEtiqueta(m[1]) : null;
      if (!m || !cuatrienio) {
        return NextResponse.json({ error: "Expediente inválido." }, { status: 400 });
      }
      const ficha = await getFichaSenado(cuatrienio.etiqueta, Number(m[2]));
      if (!ficha) {
        return NextResponse.json(
          { error: "El consultante del Senado no devolvió el expediente." },
          { status: 502 },
        );
      }
      return NextResponse.json(
        { huella: huellaDe(ficha), titulo: ficha.titulo },
        { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
      );
    }

    return NextResponse.json({ error: "Tipo sin estado que consultar." }, { status: 400 });
  } catch (err) {
    console.error("[api/seguimiento]", err);
    return NextResponse.json({ error: "La fuente no contestó." }, { status: 502 });
  }
}
