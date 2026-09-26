/**
 * La raíz de una palabra en español, sin tildes: la usan el índice
 * (`lib/busqueda.ts`) y el resaltado de lo encontrado
 * (`components/resaltado.tsx`), y tienen que coincidir.
 *
 * Las tildes se quitan **antes** de lematizar. Al revés, el lematizador
 * Snowball reconoce «-ación» y no «-acion»: «Educación» daba `educ` y
 * «educacion», tecleado en el teléfono, `educacion`, y la búsqueda del
 * Ministerio de Educación sin tilde no lo encontraba.
 */

import { stemmer } from "@orama/stemmers/spanish";
import { stopwords } from "@orama/stopwords/spanish";

/**
 * Palabras de contenido que la lista de `@orama/stopwords` (la de
 * stopwords-iso, 577 palabras) trata como vacías. En un corpus del Estado
 * son nombres propios de lo que se busca: «Ministerio de **Trabajo**»,
 * «**Poder** Judicial», «Cámara de **Cuentas**», «Contraloría **General**»,
 * «**Estado**», «**empleo**», «**trata** de personas», «**valor**». Con ellas
 * dentro, «ministerio trabajo» se quedaba en «ministerio» y traía todos los
 * ministerios. Se usa la lista de la biblioteca menos estas.
 */
const CONTENIDO = new Set([
  "acuerdo", "breve", "buen", "buena", "buenas", "bueno", "buenos", "cinco", "claro", "cosas",
  "cuatro", "cuenta", "dia", "dias", "día", "días", "diferente", "diferentes", "dos", "ejemplo",
  "empleais", "emplean", "emplear", "empleas", "empleo", "estado", "estados", "final", "fin",
  "general", "gran", "grandes", "horas", "igual", "lado", "largo", "lugar", "mal", "manera",
  "mayor", "medio", "mejor", "momento", "modo", "nueva", "nuevas", "nuevo", "nuevos", "ocho",
  "pais", "paìs", "parte", "peor", "poder", "posible", "primer", "primera", "primero",
  "primeros", "segunda", "segundo", "seis", "siete", "tercera", "tiempo", "total", "trabaja",
  "trabajais", "trabajamos", "trabajan", "trabajar", "trabajas", "trabajo", "trata", "tres",
  "uso", "usa", "usar", "valor", "verdad", "verdadera", "verdadero",
]);

export const PALABRAS_VACIAS: string[] = stopwords.filter((w) => !CONTENIDO.has(w));

export function sinTildes(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Lematiza una palabra ya en minúsculas. */
export function lematizar(palabra: string): string {
  return stemmer(sinTildes(palabra));
}
