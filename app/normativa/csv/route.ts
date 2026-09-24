import { NextRequest, NextResponse } from "next/server";
import {
  TIPOS_NORMATIVA,
  listaNormativa,
  materiaDe,
  materiaPorSlug,
  type Documento,
  type TipoNormativa,
} from "@/lib/normativa";
import { aCsv, respuestaCsv, type ColumnaCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUMNAS: ColumnaCsv<Documento>[] = [
  ["tipo", (d) => d.tipo],
  ["numero", (d) => d.numero],
  ["fecha_promulgacion", (d) => d.fechaIso ?? d.fecha],
  ["titulo", (d) => d.titulo],
  ["gaceta", (d) => d.gaceta],
  ["etiqueta_institucion", (d) => d.institucion],
  ["url_documento", (d) => d.url],
  // Derivada con reglas del título y la etiqueta (`materiaDe`), no del origen.
  // Al final, para no correr las columnas de quien lee por posición.
  ["materia_derivada", (d) => materiaDe(d)?.nombre ?? null],
];

/**
 * La lista de `/normativa` en CSV: el mismo tipo, año, texto, mes y materia que la
 * página, **sin** el recorte a 200 filas de la vista. Parámetros validados
 * con las mismas reglas que la página.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tipoPedido = sp.get("tipo") ?? "3";
  if (!(tipoPedido in TIPOS_NORMATIVA)) {
    return NextResponse.json({ error: "Tipo de documento no válido" }, { status: 400 });
  }
  const tipo = tipoPedido as TipoNormativa;
  const anioPedido = sp.get("anio") ?? "";
  const anioActual = new Date().getFullYear();
  const anio = /^\d{4}$/.test(anioPedido) ? Number(anioPedido) : anioActual;
  if (anio < anioActual - 3 || anio > anioActual) {
    return NextResponse.json({ error: "Año fuera de la ventana de la vertical" }, { status: 400 });
  }
  const q = (sp.get("q") ?? "").trim().slice(0, 80) || undefined;
  const mesPedido = sp.get("mes") ?? "";
  const mes =
    tipo === "3" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesPedido) && mesPedido.startsWith(String(anio))
      ? mesPedido
      : undefined;
  const materia = tipo === "3" && !mes ? materiaPorSlug(sp.get("materia"))?.slug : undefined;

  const r = await listaNormativa({ tipo, anio, q, mes, materia });
  if (r.origen === null) {
    return NextResponse.json(
      { error: "La Consultoría Jurídica no respondió y la instantánea no cubre esa consulta" },
      { status: 502 },
    );
  }
  const fuente = r.origen === "vivo" ? "en vivo" : `instantanea del ${r.origen}`;
  const partes = [`normativa-${tipo}-${anio}`, mes, materia, q ? "busqueda" : null].filter(Boolean).join("-");
  return respuestaCsv(
    aCsv(COLUMNAS, r.docs),
    `${partes}.csv`,
    `${r.docs.length} de ${r.total} ${TIPOS_NORMATIVA[tipo].toLowerCase()} de ${anio}, Consultoría Jurídica ${fuente}.`,
  );
}
