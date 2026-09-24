/**
 * Sentencias del Tribunal Superior Electoral — el visor de sentencias
 * contenciosas del Tribunal.
 *
 * Mecánica verificada en docs/AUDITORIA.md §G.6 (2026-09-24) y re-medida el
 * mismo día con este User-Agent:
 *
 *  1. `tse.gob.do` redirige a `tse.do` (WordPress; su robots solo veta
 *     `/wp-admin/`). La página «Sentencias contenciosas» incrusta el visor
 *     `visorpdf.tse.do`, un PHP detrás de Cloudflare cuyo `robots.txt`
 *     responde 200 **vacío** (no hay reglas). Sin cookie ni token para listar:
 *     la `PHPSESSID` que pone no hace falta.
 *  2. El listado de un año es `GET https://visorpdf.tse.do/?y=AAAA&s=`, HTML
 *     hecho en el servidor, **60 filas por página**; las siguientes son
 *     `?pos=N&y=AAAA&s=`. El paginador es una ventana (en la página 7 de 2024
 *     muestra 3…7), así que no se cree el último número que enseña: se sigue
 *     el enlace «Siguiente» hasta que no aparece. Medido: 2026 → 26 filas en
 *     una página (28 KB, 0,5 s); 2024 → 7 páginas, 402 filas (58 KB y 0,9 s
 *     cada una); 2021 → 8 filas.
 *  3. La tabla tiene cuatro columnas: número (un `<th>` enlazado a su ficha,
 *     `/documento/contenciosas/<id opaco>`), fecha «10 Ago 2026», expediente y
 *     «Relativo a». La ficha trae la síntesis y el PDF en un `<iframe>`
 *     (`/file-upload/<n>.pdf`, PDF de texto). Leer cada ficha para sacar el
 *     PDF sería una petición por sentencia: no se hace; la fila lleva a la ficha.
 *  4. El selector de año va de 2021 al año en curso (más «Todos»): el visor no
 *     publica sentencias anteriores a 2021, aunque el Tribunal existe desde 2011.
 *
 * Particularidades que el lector obedece:
 *  · El selector se rotula «Año de expediente», pero filtra por el año de la
 *    **sentencia**: TSE/0001/2026 (expediente TSE-05-0019-2025) sale en 2026.
 *  · La numeración no es uniforme: «TSE/0028/2026», «TSE/007/2021»,
 *    «TSE-006-2021», «TSE/0387/2024.» (con punto). Se guarda como se publica,
 *    sin el punto o la coma final.
 *  · **Un mismo número puede aparecer dos veces** con fichas distintas
 *    (TSE/0293/2024, TSE/0303/2024, TSE/0377/2024): la clave de una fila es su
 *    ficha, no su número.
 *  · Los meses van abreviados en español y no siempre igual («Ago», «Mayo»).
 *    Se devuelve ISO de calendario; si la fecha no se entiende, `null`.
 *  · El orden del listado no es el de la numeración: se ordena aquí por fecha
 *    y luego por número.
 *
 * Contrato (`.claude/rules/fuentes.md`): GET solamente, User-Agent
 * identificable, 25 s por petición (la más lenta midió 0,9 s), un reintento,
 * `content-type` validado y la tabla presente; lectura acotada a
 * `MAX_PAGINAS` páginas, y si el tope corta se declara (`truncado`). Si algo
 * falla, `null` y nunca una excepción hacia la página.
 *
 * Caché: `unstable_cache` sobre las **filas ya leídas** de todas las páginas,
 * para que un año se sirva entero y coherente (no la página 3 de ayer con la
 * 1 de hoy). 6 h para el año en curso, 7 días para un año cerrado. Un fallo
 * lanza dentro de la función cacheada para que **nunca se guarde un `null`**.
 */

import { unstable_cache } from "next/cache";

const ORIGEN = "https://visorpdf.tse.do";
const USER_AGENT = "Socratico-Inteligencia/1.0 (justicia; herramienta independiente)";
const TIMEOUT_MS = 25_000;
/** 15 × 60 = 900 filas; el año más cargado medido (2024) ocupa 7 páginas. */
const MAX_PAGINAS = 15;

/** El visor lista sentencias desde 2021 (su selector de año empieza ahí). */
export const PRIMER_ANIO_TSE = 2021;

export interface SentenciaTSE {
  /** «TSE/0028/2026», tal como la numera el Tribunal (sin puntuación final). */
  numero: string;
  /** Fecha de la sentencia, `AAAA-MM-DD`; `null` si el visor la trae ilegible. */
  fecha: string | null;
  /** Uno o varios expedientes, texto libre. `null` si viene vacío. */
  expediente: string | null;
  /** «Relativo a…»: partes y asunto, como lo redacta el Tribunal. */
  relativo: string;
  /** URL absoluta de la ficha en el visor, que muestra la síntesis y el PDF. */
  ficha: string;
}

export interface SentenciasTSE {
  anio: number;
  /** De la más reciente a la más antigua (fecha, luego número). */
  sentencias: SentenciaTSE[];
  /** Filas `<tr>` leídas en el cuerpo de las tablas, incluidas las ilegibles. */
  escaneados: number;
  /** Páginas del visor recorridas. */
  paginas: number;
  /** `true` si el tope de páginas cortó la lectura con «Siguiente» aún presente. */
  truncado: boolean;
  /** URL del listado del año en el visor del Tribunal. */
  fuente: string;
  /** Instante de la lectura (ISO). */
  consultado: string;
}

/** Año en curso en Santo Domingo, no en UTC. */
export function anioActualTSE(): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo", year: "numeric" }).format(
      Date.now(),
    ),
  );
}

/** Los años que se pueden pedir, del más reciente a 2021. */
export function aniosTSE(): number[] {
  const r: number[] = [];
  for (let a = anioActualTSE(); a >= PRIMER_ANIO_TSE; a--) r.push(a);
  return r;
}

export function urlListadoTSE(anio: number, pagina = 1): string {
  return pagina > 1 ? `${ORIGEN}/?pos=${pagina}&y=${anio}&s=` : `${ORIGEN}/?y=${anio}&s=`;
}

const NOMBRADAS: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodificar(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return NOMBRADAS[e.toLowerCase()] ?? m;
  });
}

function celda(html: string): string {
  return decodificar(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

const MESES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
};

/** «10 Ago 2026», «14 Mayo 2026», «15 Sept 2021» → `AAAA-MM-DD`. */
function fechaISO(texto: string): string | null {
  const m = /^(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})$/i.exec(texto);
  if (!m) return null;
  const mes = MESES[m[2].slice(0, 3).toLowerCase()];
  const dia = Number(m[1]);
  if (!mes || dia < 1 || dia > 31) return null;
  return `${m[3]}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Lee una página del visor. Devuelve `null` si la tabla no está —la página
 * cambió de forma o llegó otra cosa con 200—.
 */
export function parsearPaginaTSE(
  html: string,
): { sentencias: SentenciaTSE[]; escaneados: number; siguiente: boolean } | null {
  const ini = html.indexOf("<tbody");
  const fin = html.indexOf("</tbody>", ini);
  // La cabecera propia de este listado: si falta, no es la tabla de sentencias.
  if (ini < 0 || fin < 0 || !/Relativo a/.test(html.slice(Math.max(0, ini - 3000), ini))) return null;
  const cuerpo = html.slice(ini, fin);

  const sentencias: SentenciaTSE[] = [];
  let escaneados = 0;
  for (const tr of cuerpo.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    escaneados++;
    const celdas = [...tr[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]);
    if (celdas.length < 4) continue;
    const enlace = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(celdas[0]);
    if (!enlace) continue;
    const numero = celda(enlace[2]).replace(/[.,;\s]+$/, "");
    if (!/^TSE[-/ ]?\d+[-/]\d{4}$/i.test(numero)) continue;
    let ficha: string;
    try {
      ficha = new URL(decodificar(enlace[1]), ORIGEN).toString();
    } catch {
      continue;
    }
    const expediente = celda(celdas[2]).replace(/[.,;\s]+$/, "");
    sentencias.push({
      numero,
      fecha: fechaISO(celda(celdas[1])),
      expediente: expediente || null,
      relativo: celda(celdas[3]),
      ficha,
    });
  }
  // La tabla existe pero no se entendió ninguna fila con filas presentes: cambió de forma.
  if (escaneados > 0 && sentencias.length === 0) return null;
  const siguiente = />\s*Siguiente\s*</i.test(html.slice(fin));
  return { sentencias, escaneados, siguiente };
}

async function leerPagina(url: string): Promise<NonNullable<ReturnType<typeof parsearPaginaTSE>>> {
  let ultimo: unknown = null;
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`el visor respondió ${res.status}`);
      const tipo = res.headers.get("content-type") ?? "";
      if (!/text\/html/i.test(tipo)) throw new Error(`content-type inesperado: ${tipo || "(vacío)"}`);
      const leido = parsearPaginaTSE(await res.text());
      if (!leido) throw new Error("la página no trae la tabla de sentencias");
      return leido;
    } catch (err) {
      ultimo = err;
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
}

function numeroDe(s: SentenciaTSE): number {
  const m = /(\d+)[-/]\d{4}$/.exec(s.numero);
  return m ? Number(m[1]) : 0;
}

async function leerAnio(anio: number): Promise<SentenciasTSE> {
  const vistas = new Map<string, SentenciaTSE>();
  let escaneados = 0;
  let pagina = 0;
  let siguiente = true;
  while (siguiente && pagina < MAX_PAGINAS) {
    pagina++;
    const p = await leerPagina(urlListadoTSE(anio, pagina));
    escaneados += p.escaneados;
    // Por ficha: el mismo número con dos fichas son dos filas; la misma ficha
    // en dos páginas (si el visor reordena entre peticiones) es una.
    for (const s of p.sentencias) if (!vistas.has(s.ficha)) vistas.set(s.ficha, s);
    siguiente = p.siguiente && p.sentencias.length > 0;
  }
  const sentencias = [...vistas.values()].sort((a, b) => {
    if (a.fecha !== b.fecha) {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return a.fecha < b.fecha ? 1 : -1;
    }
    return numeroDe(b) - numeroDe(a);
  });
  return {
    anio,
    sentencias,
    escaneados,
    paginas: pagina,
    truncado: siguiente,
    fuente: urlListadoTSE(anio),
    consultado: new Date().toISOString(),
  };
}

const anioEnCurso = unstable_cache(leerAnio, ["tse-sentencias-en-curso"], { revalidate: 21_600 });
const anioCerrado = unstable_cache(leerAnio, ["tse-sentencias-cerrado"], { revalidate: 604_800 });

/**
 * Todas las sentencias de un año en el visor del Tribunal Superior Electoral.
 * `null` si el año no está entre 2021 y el actual, o si el visor no contestó.
 */
export async function listarSentenciasTSE(anio: number): Promise<SentenciasTSE | null> {
  const actual = anioActualTSE();
  if (!Number.isInteger(anio) || anio < PRIMER_ANIO_TSE || anio > actual) return null;
  try {
    return await (anio === actual ? anioEnCurso : anioCerrado)(anio);
  } catch (err) {
    console.error(`[tse] ${anio}: ${String(err)}`);
    return null;
  }
}
