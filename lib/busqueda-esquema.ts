/**
 * La forma del índice por palabra del buscador, en un solo sitio: la usan
 * `lib/busqueda.ts` (en el servidor, para crear o cargar el índice) y
 * `scripts/build-indice-busqueda.mjs` (en build, para escribirlo ya hecho).
 * Si discreparan —otro lematizador, otra lista de palabras vacías—, el índice
 * guardado tendría raíces que la consulta no produce y buscaría en silencio
 * peor. Por eso ninguno de los dos la escribe por su cuenta.
 *
 * Sin alias `@/` y con la extensión en el import: `node` lo carga tal cual
 * (quita los tipos), sin compilar.
 */

import { create, type AnyOrama } from "@orama/orama";
import { lematizar, PALABRAS_VACIAS } from "./raiz.ts";

/** Tipo, título, texto auxiliar y quién publica. */
export const ESQUEMA = { t: "enum", ti: "string", x: "string", o: "string" } as const;

/** Un índice vacío con el tokenizador de la casa. */
export function indiceVacio(): AnyOrama {
  return create({
    schema: ESQUEMA,
    // Nadie ordena por un campo: el orden es el BM25 y la fusión. Sin esto,
    // Orama arma un índice de orden por cada texto (~10 MB y ~1 s de más).
    sort: { enabled: false },
    components: {
      tokenizer: { language: "spanish", stemming: true, stemmer: lematizar, stopWords: PALABRAS_VACIAS },
    },
  });
}

/**
 * Una entrada del corpus como documento del índice: su id es su posición.
 * Un proveedor no trae texto auxiliar escrito: se busca por su RNC (`c`) y
 * su RPE (`r`).
 */
export function aDocumento(
  d: { t: string; ti: string; x?: string; o?: number; c?: string; r?: string },
  i: number,
  origenes: string[],
): { id: string; t: string; ti: string; x: string; o: string } {
  const x = d.x ?? [d.c, d.r].filter(Boolean).join(" ");
  return { id: String(i), t: d.t, ti: d.ti, x, o: d.o === undefined ? "" : origenes[d.o] };
}

/**
 * La etiqueta que ata un índice guardado a su corpus: la huella que
 * `scripts/build-busqueda.py` calcula sobre las entradas, su fecha y
 * cuántas son. Si el corpus cambia y el índice no se regenera, no coinciden
 * y el servidor construye el índice en memoria, como antes de guardarlo.
 */
export function etiquetaCorpus(c: { generado: string; huella?: string; docs: unknown[] }): string {
  return `${c.generado}|${c.huella ?? "sin-huella"}|${c.docs.length}`;
}
