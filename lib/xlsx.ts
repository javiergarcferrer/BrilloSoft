/**
 * El lector de hojas de cálculo de la casa: Crédito Público (`lib/deuda.ts`),
 * la tasa del BCRD (`lib/tasa.ts`), los indicadores del BCRD
 * (`lib/macro.ts`) y Aduanas (`lib/aduanas.ts`).
 *
 * Un XLSX es un ZIP de XML. Hasta el 2026-09-26 las cuatro capas lo leían a
 * mano: un recorrido de las cabeceras locales del ZIP y cuatro juegos de
 * expresiones regulares sobre el XML. Las dos cosas fallaban en silencio:
 *
 *  · el tamaño se leía de la cabecera local, que un Excel escrito «en
 *    streaming» deja en cero (el tamaño real va en un descriptor detrás de los
 *    datos): cada archivo pesaba cero, se saltaba, y la fuente quedaba muda
 *    sin error. ZIP64 no se leía.
 *  · las regex ignoraban el texto enriquecido de las cadenas compartidas
 *    (`<si><r><t>…</t></r>…</si>`), las entidades numéricas y, según la capa,
 *    las cadenas en línea.
 *
 * Ahora: `fflate` (MIT) lee el ZIP por su directorio central, y
 * `fast-xml-parser` (MIT) el XML; `entities` decodifica. Lo único propio es
 * el mapeo de la estructura documentada de OOXML (ECMA-376 §18.3.1: fila
 * `row@r`, celda `c@r`/`c@t`, valor `v`, cadena en línea `is`) a la forma que
 * usan las capas: fila → columna → texto.
 *
 * Solo servidor.
 */

import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { decodeXML } from "entities";

/** Número de fila (1…) → letra de columna («A», «CW») → texto de la celda. */
export type Hoja = Map<number, Map<string, string>>;

const COMO_LISTA = new Set(["row", "c", "si", "r"]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  parseAttributeValue: false,
  // Los espacios de una cadena son parte de ella (`xml:space="preserve"`).
  trimValues: false,
  // Las entidades las decodifica `entities`, numéricas incluidas.
  processEntities: false,
  // Solo elementos: un atributo `r` (la referencia de la celda) no es lista.
  isArray: (nombre, _ruta, _hoja, esAtributo) => !esAtributo && COMO_LISTA.has(nombre),
});

/** El texto de un `<t>`, de un `<si>`/`<is>` con sus trozos `<r>`, o vacío. */
function textoDe(nodo: unknown): string {
  if (nodo == null) return "";
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (typeof nodo !== "object") return "";
  const o = nodo as Record<string, unknown>;
  // `<si>`/`<is>`: texto plano en `t`, o enriquecido en trozos `r`, cada uno
  // con su `t`. `rPh` (la lectura fonética) no es parte del texto. Van antes
  // que `#text`: en un XML sangrado, el `<si>` trae también un `#text` de
  // puro espacio, y leerlo primero dejaba todas las cadenas en blanco.
  if ("t" in o) return textoDe(o.t);
  if (Array.isArray(o.r)) return o.r.map((r) => textoDe((r as Record<string, unknown>).t)).join("");
  if ("#text" in o) return String(o["#text"] ?? "");
  return "";
}

/** «CW» → 101. */
export function indiceColumna(letras: string): number {
  let n = 0;
  for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

/**
 * Lee la hoja `n` (el archivo `xl/worksheets/sheet{n}.xml`, la primera por
 * defecto) de un XLSX. Las celdas vacías no se guardan. Devuelve `null` si el
 * archivo no es un XLSX legible o no trae esa hoja.
 */
export function leerHoja(buf: ArrayBuffer | Uint8Array, n = 1): Hoja | null {
  const nombreHoja = `xl/worksheets/sheet${n}.xml`;
  let archivos: Record<string, Uint8Array>;
  try {
    archivos = unzipSync(buf instanceof Uint8Array ? buf : new Uint8Array(buf), {
      filter: (f) => f.name === nombreHoja || f.name === "xl/sharedStrings.xml",
    });
  } catch {
    return null;
  }
  if (!archivos[nombreHoja]) return null;

  try {
    const compartidas: string[] = [];
    if (archivos["xl/sharedStrings.xml"]) {
      const sst = parser.parse(strFromU8(archivos["xl/sharedStrings.xml"]))?.sst;
      for (const si of (sst?.si ?? []) as unknown[]) compartidas.push(decodeXML(textoDe(si)));
    }

    const hoja: Hoja = new Map();
    const filas = (parser.parse(strFromU8(archivos[nombreHoja]))?.worksheet?.sheetData?.row ?? []) as Record<
      string,
      unknown
    >[];
    for (const fila of filas) {
      for (const c of (fila.c ?? []) as Record<string, unknown>[]) {
        const ref = /^([A-Z]+)(\d+)$/.exec(String(c.r ?? ""));
        if (!ref) continue;
        let valor: string;
        if (c.t === "inlineStr") valor = textoDe(c.is);
        else {
          const v = textoDe(c.v);
          if (v === "") continue;
          valor = c.t === "s" ? (compartidas[Number(v)] ?? "") : v;
        }
        valor = c.t === "s" ? valor : decodeXML(valor);
        if (valor === "") continue;
        const n = Number(ref[2]);
        if (!hoja.has(n)) hoja.set(n, new Map());
        hoja.get(n)!.set(ref[1], valor);
      }
    }
    return new Map([...hoja].sort((a, b) => a[0] - b[0]));
  } catch {
    return null;
  }
}

/** Las filas de una hoja en orden, cada una con su número. */
export function filasDe(hoja: Hoja): { n: number; celdas: Map<string, string> }[] {
  return [...hoja].map(([n, celdas]) => ({ n, celdas }));
}
