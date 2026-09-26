/**
 * Leer HTML y XML de los portales del Estado con bibliotecas, no con
 * expresiones regulares.
 *
 * · **Entidades**: `entities` (BSD-2), la tabla completa de HTML5. Había nueve
 *   decodificadores copiados en `lib/` y no coincidían: unos conocían seis
 *   entidades con nombre, otro rompía los caracteres fuera del plano básico
 *   (`String.fromCharCode`), varios solo `&amp;` —y «&eacute;», «&ntilde;» de
 *   un portal dominicano pasaban tal cual a la pantalla—.
 * · **Árbol**: `cheerio` (MIT) sobre `parse5`, el analizador del estándar
 *   WHATWG —el mismo algoritmo que un navegador—. Las tablas del TC, del TSE y
 *   del Senado se leen por su estructura: un cambio de comillas, de espacios o
 *   de anidado en el portal ya no reduce filas en silencio. Se probó primero
 *   `node-html-parser`, más ligero, y perdía la ficha del Senado entera: el
 *   FileMaster anida tablas dentro de `<span>` y `<p>`, HTML inválido que solo
 *   un analizador del estándar repara como lo hace un navegador.
 *
 * El espacio duro (`&nbsp;`) sale como espacio normal: todas las capas lo
 * trataban así y los textos se comparan y se colapsan después.
 *
 * Solo servidor.
 */

import { decodeHTML, decodeXML } from "entities";
import { load, type CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";

export type { CheerioAPI, Element };

const DURO = /\u00a0/g;

/** Entidades de HTML resueltas (con nombre, decimales y hexadecimales). */
export function desentidades(s: string): string {
  return decodeHTML(s).replace(DURO, " ");
}

/** Entidades de XML resueltas: las cinco predefinidas y las numéricas. */
export function desentidadesXml(s: string): string {
  return decodeXML(s).replace(DURO, " ");
}

/** El texto visible de un fragmento: sin etiquetas, entidades resueltas, espacios colapsados. */
export function textoPlano(html: string): string {
  return desentidades(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Un documento HTML como árbol. */
export function arbol(html: string): CheerioAPI {
  return load(html);
}

/**
 * El texto visible de un nodo, colapsado. Los trozos de texto se juntan con
 * un espacio —una etiqueta separa palabras, como hacían las capas antes—; las
 * entidades ya vienen resueltas por el analizador, una sola vez.
 */
export function textoDe(nodo: AnyNode | AnyNode[] | null | undefined): string {
  if (!nodo) return "";
  const trozos: string[] = [];
  const recorrer = (n: AnyNode) => {
    if (n.type === "text") trozos.push((n as unknown as { data: string }).data);
    else if ("children" in n) for (const h of (n as Element).children) recorrer(h);
  };
  for (const n of Array.isArray(nodo) ? nodo : [nodo]) recorrer(n);
  return trozos.join(" ").replace(/\s+/g, " ").trim();
}
