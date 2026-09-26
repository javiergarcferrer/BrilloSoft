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
  // También la ñ pasa a n: quien teclea «ninos» en el teléfono busca «niños»,
  // y el índice de `lib/busqueda.ts` se construyó así.
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Lematiza una palabra ya en minúsculas. */
export function lematizar(palabra: string): string {
  return stemmer(sinTildes(palabra));
}

/* ---------------------------------------------------- todas las palabras */

/**
 * Una consulta preparada para buscar **todas sus palabras** en un texto, sin
 * tildes, en cualquier orden y por raíz: «reparacion porton» encuentra
 * «Reparación del Portón», «portones» encuentra «portón», «ley no. 95-24»
 * encuentra «Ley 95-24». Es la regla de `/buscar` llevada a los buscadores de
 * cada vertical, que antes buscaban la frase entera tal cual.
 *
 * - Las palabras vacías («de», «la», «no», «núm.») no se exigen; si la
 *   consulta es solo eso, se exigen tal cual.
 * - Un número o una cita («47-20», «1-26», un RNC) se exige **entero**:
 *   «1-26» no encuentra «11-26».
 * - El texto se compara con `plano()`: minúsculas, sin tildes, signos como
 *   espacio.
 */
export interface Agujas {
  raices: string[];
  numeros: RegExp[];
}

/**
 * Minúsculas, sin tildes, y todo signo que no sea letra, cifra o guion como
 * espacio. El guion solo se queda entre cifras («47-20», «2024-0001»): entre
 * letras separa palabras, y «sub-director» lleva «director».
 */
export function plano(s: string): string {
  return ` ${sinTildes(s)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .replace(/-(?![0-9])|(?<![0-9])-/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/** Palabras que en una cita o una razón social son relleno: «núm.», «No.», «SRL». */
const RELLENO = new Set([
  "num", "nums", "numero", "no", "nos", "nro", "art",
  // La forma jurídica no es el nombre: «Plaza Lama SRL» es «Plaza Lama, SA».
  "srl", "sa", "sas", "eirl", "cxa", "spa", "ltda", "inc",
]);

export function agujas(consulta: string): Agujas {
  const fichas = plano(consulta).trim().split(" ").filter(Boolean);
  const numeros: RegExp[] = [];
  const raices: string[] = [];
  const vacias = new Set(PALABRAS_VACIAS);
  for (const f of fichas) {
    if (/\d/.test(f)) {
      const limpio = f.replace(/^-+|-+$/g, "");
      if (limpio) numeros.push(new RegExp(`(?<![0-9a-z])${limpio.replace(/-/g, "\\-")}(?![0-9a-z])`));
      continue;
    }
    if (vacias.has(f) || RELLENO.has(f)) continue;
    const palabra = f.replace(/-/g, " ").trim();
    for (const p of palabra.split(" ")) {
      if (p.length < 2) continue;
      // La raíz, nunca más corta que tres letras: «ley» no se vuelve «le».
      const r = stemmer(p);
      raices.push(r.length >= 3 || r.length === p.length ? r : p.slice(0, 3));
    }
  }
  if (raices.length === 0 && numeros.length === 0) {
    for (const f of fichas) if (f.length >= 2) raices.push(f);
  }
  return { raices, numeros };
}

/**
 * ¿Están todas? Cada raíz tiene que **empezar** una palabra del texto
 * («salud» no casa dentro de «desaludo»); cada número, estar entero.
 * `textoPlano` es el texto ya pasado por `plano()` (guárdelo si se repite).
 */
export function contieneTodas(textoPlano: string, a: Agujas): boolean {
  return a.raices.every((r) => textoPlano.includes(` ${r}`)) && a.numeros.every((n) => n.test(textoPlano));
}

/**
 * Una prueba por palabra, para cuando las palabras pueden caer en campos
 * distintos (el cargo en uno, la institución en otro): la fila vale si cada
 * prueba la pasa **alguno** de sus campos.
 */
export function pruebas(a: Agujas): ((textoPlano: string) => boolean)[] {
  return [
    ...a.raices.map((r) => (t: string) => t.includes(` ${r}`)),
    ...a.numeros.map((n) => (t: string) => n.test(t)),
  ];
}

/** Atajo: ¿el texto contiene todas las palabras de la consulta? */
export function coincideConsulta(texto: string, consulta: string): boolean {
  return contieneTodas(plano(texto), agujas(consulta));
}

/**
 * Las palabras que cuentan de una consulta, en su forma plana y en orden:
 * sin vacías ni relleno. Los números y citas van tal cual. Si la consulta es
 * solo relleno, sus palabras.
 */
export function palabrasDeContenido(consulta: string): string[] {
  const fichas = plano(consulta).trim().split(" ").filter(Boolean);
  const vacias = new Set(PALABRAS_VACIAS);
  const utiles = fichas.filter((f) => /\d/.test(f) || (f.length >= 2 && !vacias.has(f) && !RELLENO.has(f)));
  return utiles.length ? utiles : fichas.filter((f) => f.length >= 2);
}

const AGUDA: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };

/**
 * Las palabras que cuentan de una consulta **como se teclearon** (en
 * minúsculas, con sus tildes y su ñ), en orden: sin vacías ni relleno. Para
 * los orígenes que comparan letra por letra, donde «educación» tecleado ya es
 * la forma buena y no hay que adivinarla.
 */
export function palabrasTecleadas(consulta: string): string[] {
  const utiles = new Set(palabrasDeContenido(consulta));
  return consulta
    .toLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((w) => w && utiles.has(plano(w).trim()));
}

/** Cuántas formas se prueban por palabra, la tecleada incluida. */
export const MAX_VARIANTES = 6;

/**
 * Las formas con tilde que una palabra tecleada sin ella puede tener en un
 * origen que compara letra por letra (el SIL de la Cámara, el consultante del
 * Senado): «educacion» → «educación», «publico» → «público», «ninos» →
 * «niños». En español la tilde cae en una de las tres últimas sílabas: se
 * prueba primero en la última vocal, después en la penúltima y la
 * antepenúltima, y la ñ en cada «n» seguida de vocal. La palabra tal cual va
 * primero, y nunca salen más de `MAX_VARIANTES`: cada forma es una petición a
 * una fuente del Estado. Si ya trae una tilde o una ñ, es un número o pasa de
 * veinte letras (no es una palabra), se queda como vino.
 */
export function variantesAcento(palabra: string): string[] {
  const p = palabra.toLowerCase();
  if (/\d/.test(p) || /[^a-z-]/.test(p) || p.length > 20) return [p];
  const conTilde = (w: string) => {
    const vocales = [...w.matchAll(/[aeiou]/g)].map((m) => m.index ?? 0);
    return vocales
      .slice(-3)
      .reverse()
      .map((i) => w.slice(0, i) + AGUDA[w[i]] + w.slice(i + 1));
  };
  // «companias» → «compañías»: la ñ y la tilde a la vez.
  const bases = [p];
  for (const m of p.matchAll(/n(?=[aeiou])/g)) {
    const i = m.index ?? 0;
    if (i > 0) bases.push(p.slice(0, i) + "ñ" + p.slice(i + 1));
  }
  const salida = new Set<string>([p]);
  for (const v of conTilde(p)) salida.add(v);
  for (const b of bases.slice(1)) {
    salida.add(b);
    for (const v of conTilde(b)) salida.add(v);
  }
  return [...salida].slice(0, MAX_VARIANTES);
}

/**
 * Lo tecleado, sin espacios en los bordes y cortado a `n` caracteres **sin
 * partir un emoji**: `slice` corta unidades UTF-16, y medio emoji al final
 * hacía que `encodeURIComponent` lanzara y la página cayera en el error.
 */
export function recortar(texto: string | null | undefined, n: number): string {
  const t = (texto ?? "").trim();
  return t.length <= n ? t : t.slice(0, n).replace(/[\uD800-\uDBFF]$/, "").trim();
}
