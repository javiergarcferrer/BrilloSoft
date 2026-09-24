/**
 * Comercio exterior y recaudación de la Dirección General de Aduanas (DGA).
 *
 * Mecánica verificada el 2026-09-24 (docs/AUDITORIA.md §G.5):
 *
 *   GET https://www.aduanas.gob.do/umbraco/api/searcher/getpageofdocuments?id=3442
 *
 * → 200 `application/json`, ~10 KB. Es la misma llamada que hace el buscador
 * de `/estadisticas/series-de-tiempo/`: un arreglo de categorías
 * (`Importaciones` 8 archivos, `Exportaciones` 5, `Recaudaciones` 7), cada
 * archivo con `documentName`, `documentFile` y `documentDateTime`. Las rutas
 * `/media/{hash}/…` **no se pueden predecir** —cambian en cada corte—, así
 * que el índice se lee en cada lectura y de ahí sale la URL del archivo.
 *
 * De cada categoría se toma un solo archivo, el agregado:
 *   - «Importaciones Por Régimen …» → hoja «Imp FOB por Régimen», 49 KB.
 *   - «Exportaciones por régimen …» → hoja «Exp por regimen», 48 KB.
 *   - «Recaudaciones mensuales DGA según impuestos … » → hoja «Mensual», 135 KB.
 * Si hay varios que casan (la recaudación guarda cortes viejos congelados a
 * diciembre), gana el de `documentDateTime` más reciente. Los tres son XLSX
 * de una hoja y comparten forma: una fila de años (un año por bloque de
 * columnas, en la primera celda del bloque), debajo la fila de meses
 * («Enero»…«Diciembre», a veces con espacio al final), y una fila `Total` /
 * `TOTAL` en la columna A con el total del mes. Cada bloque cierra con una
 * columna de total del año (en el año en curso, el acumulado).
 *
 * Rarezas de la fuente (y lo que hace este módulo con ellas):
 *   - **La unidad del título miente por seis ceros.** Importaciones y
 *     exportaciones dicen «VALORES FOB EXPRESADOS EN MILLONES DE DÓLARES US$» y
 *     la recaudación «millones de pesos dominicanos», pero las celdas están en
 *     dólares y en pesos (agosto 2026: 2778371797.42 = US$ 2,778.4 millones).
 *     Aquí se leen como unidades, y un valor fuera del rango plausible de un
 *     mes (p. ej. si algún día publican en millones de verdad) deja la cifra
 *     en `null`: no se reescala a ojo.
 *   - Todo es **preliminar** («Data preliminar sujeta a rectificaciones…»);
 *     la nota se devuelve tal cual para que la interfaz la diga.
 *   - La recaudación es la del «Fondo 100» (lo que la DGA cobra para el
 *     fondo general), en pesos; en su fila de año la columna 2025 no siempre
 *     cuadra entre subpartidas, por eso aquí solo se usa la fila `TOTAL`, mes
 *     a mes.
 *   - Debajo de la tabla de recaudación hay celdas sueltas con números de
 *     trabajo (filas 38–40): se ignoran porque solo se lee la fila `TOTAL`.
 *   - El acumulado del año se suma con los meses del propio archivo y se
 *     cruza con la columna de total que la DGA pone al cierre del bloque; si
 *     no cuadran (más de 0.1 %), el acumulado queda en `null`.
 *
 * Contrato de la casa (copiado de `lib/tasa.ts`): User-Agent identificable,
 * 25 s, un reintento, `content-type` validado (JSON para el índice; hoja de
 * cálculo y firma «PK» para los archivos), cada cifra se degrada sola a
 * `null` y nada lanza hacia la página. Serie mensual: caché de 24 h.
 * Solo servidor: reutiliza `leerZip` de `lib/deuda.ts` (`node:zlib`).
 */

import { leerZip } from "./deuda";

export const ORIGEN_ADUANAS = "https://www.aduanas.gob.do";
export const URL_INDICE_ADUANAS = `${ORIGEN_ADUANAS}/umbraco/api/searcher/getpageofdocuments?id=3442`;
export const URL_SERIES_ADUANAS = `${ORIGEN_ADUANAS}/estadisticas/series-de-tiempo/`;
const USER_AGENT = "Socratico-Inteligencia/1.0 (comercio exterior de Aduanas; herramienta independiente)";
const REVALIDAR = 86_400;

export type UnidadAduanas = "USD" | "DOP";

export interface SerieAduanas {
  /** Último mes con dato en el archivo. */
  anio: number;
  /** 1–12. */
  mes: number;
  /** Valor del mes, en unidades (dólares FOB o pesos). */
  valor: number;
  /** El mismo mes un año antes, si el archivo lo trae. */
  mismoMesAnterior: number | null;
  /** Enero → `mes` del año en curso, si cuadra con el total del archivo. */
  acumulado: number | null;
  /** Enero → `mes` del año anterior, sumado del mismo archivo. */
  acumuladoAnterior: number | null;
  unidad: UnidadAduanas;
  /** «Data preliminar sujeta a rectificaciones…», tal como la escribe la DGA. */
  nota: string | null;
  /** URL absoluta del XLSX leído. */
  archivo: string;
  /** Nombre del documento en el índice. */
  documento: string;
  /** `documentDateTime` del índice (ISO), o null. */
  publicado: string | null;
}

export interface ComercioExterior {
  importaciones: SerieAduanas | null;
  exportaciones: SerieAduanas | null;
  recaudacion: SerieAduanas | null;
  /** ¿Contestó el índice? Si no, las tres cifras son null por la misma causa. */
  indiceLeido: boolean;
  fuente: string;
}

interface DocIndice {
  documentName?: unknown;
  documentFile?: unknown;
  documentDateTime?: unknown;
}
interface CategoriaIndice {
  categoryName?: unknown;
  documents?: unknown;
}

/** Rango plausible de UN mes. Fuera de él, la unidad cambió y no se adivina. */
const RANGO_MENSUAL: Record<UnidadAduanas, [number, number]> = {
  USD: [1e8, 1e11], // hoy: ~US$ 1,000–3,000 millones al mes
  DOP: [1e9, 1e12], // hoy: ~RD$ 20,000 millones al mes
};

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/* ------------------------------------------------------------------ red */

async function pedir(url: string, tipo: RegExp): Promise<Response | null> {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: REVALIDAR },
        signal: AbortSignal.timeout(25_000),
      });
      // Un 5xx se reintenta una vez; un tipo equivocado no mejora reintentando.
      if (!res.ok) throw new Error(`Aduanas respondió ${res.status}`);
      const ct = res.headers.get("content-type") ?? "";
      if (!tipo.test(ct)) {
        console.error(`[aduanas] ${res.status} ${ct} ${url}`);
        return null;
      }
      return res;
    } catch (err) {
      if (intento === 2) {
        console.error(`[aduanas] ${String(err)} ${url}`);
        return null;
      }
    }
  }
  return null;
}

async function leerIndice(): Promise<CategoriaIndice[] | null> {
  const res = await pedir(URL_INDICE_ADUANAS, /application\/json/i);
  if (!res) return null;
  try {
    const datos: unknown = await res.json();
    return Array.isArray(datos) ? (datos as CategoriaIndice[]) : null;
  } catch {
    return null;
  }
}

async function bajarHoja(url: string): Promise<ArrayBuffer | null> {
  const res = await pedir(url, /spreadsheetml|octet-stream|excel/i);
  if (!res) return null;
  try {
    const buf = await res.arrayBuffer();
    // Un 200 puede ser una página de error: un XLSX empieza por «PK».
    if (new Uint8Array(buf.slice(0, 2)).join() !== "80,75") return null;
    return buf;
  } catch {
    return null;
  }
}

/** Elige el documento XLSX de la categoría cuyo nombre casa, el más reciente. */
export function elegirDocumento(
  indice: CategoriaIndice[],
  categoria: RegExp,
  nombre: RegExp,
): { nombre: string; url: string; publicado: string | null } | null {
  const cat = indice.find((c) => typeof c.categoryName === "string" && categoria.test(c.categoryName));
  if (!cat || !Array.isArray(cat.documents)) return null;
  const candidatos = (cat.documents as DocIndice[])
    .filter(
      (d) =>
        typeof d.documentName === "string" &&
        typeof d.documentFile === "string" &&
        nombre.test(d.documentName) &&
        // Solo rutas del propio sitio y solo XLSX: hay cortes viejos con la
        // extensión truncada (`…-v2.x`) que no se leen.
        /^\/media\/[^?#]+\.xlsx$/i.test(d.documentFile),
    )
    .map((d, i) => ({
      i,
      nombre: (d.documentName as string).trim(),
      url: `${ORIGEN_ADUANAS}${encodeURI(decodeURI(d.documentFile as string))}`,
      publicado: typeof d.documentDateTime === "string" ? d.documentDateTime : null,
    }));
  if (candidatos.length === 0) return null;
  candidatos.sort((a, b) => (b.publicado ?? "").localeCompare(a.publicado ?? "") || a.i - b.i);
  const { nombre: n, url, publicado } = candidatos[0];
  return { nombre: n, url, publicado };
}

/* --------------------------------------------------------------- parseo */

function columna(letras: string): number {
  let n = 0;
  for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function textoCelda(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

type Fila = { n: number; celdas: Map<number, string> };

function leerFilas(hojaXml: string, compartidas: string[]): Fila[] {
  const filas: Fila[] = [];
  // Una fila vacía llega como `<row …/>`: se reconoce aparte para que no se
  // trague la siguiente.
  for (const f of hojaXml.matchAll(/<row\b([^>]*?)(?:\/>|>(.*?)<\/row>)/gs)) {
    const n = Number(/\br="(\d+)"/.exec(f[1])?.[1]);
    const celdas = new Map<number, string>();
    for (const c of (f[2] ?? "").matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(.*?)<\/c>)/gs)) {
      const cuerpo = c[3] ?? "";
      const v = /<v>([^<]*)<\/v>/.exec(cuerpo)?.[1];
      let valor: string;
      if (/t="s"/.test(c[2])) valor = v ? (compartidas[Number(v)] ?? "") : "";
      else if (/t="inlineStr"/.test(c[2])) valor = textoCelda(cuerpo);
      else valor = v ?? "";
      if (valor.trim()) celdas.set(columna(c[1]), valor);
    }
    filas.push({ n, celdas });
  }
  return filas;
}

const esAnio = (s: string | undefined) => !!s && /^\s*(20\d{2})(\.0+)?\s*$/.test(s);

/**
 * Lee una hoja de la DGA (formato ancho: años × meses, fila `Total`) y
 * devuelve el último mes con su comparación. Exportado para verificarlo
 * contra los archivos crudos fuera de línea; `null` si la forma no se reconoce.
 */
export async function parsearHojaAduanas(
  buf: ArrayBuffer,
  unidad: UnidadAduanas,
): Promise<Omit<SerieAduanas, "archivo" | "documento" | "publicado"> | null> {
  const archivos = await leerZip(buf);
  const hoja = archivos.find((a) => a.nombre === "xl/worksheets/sheet1.xml");
  if (!hoja) return null;
  const xmlCompartidas = archivos.find((a) => a.nombre === "xl/sharedStrings.xml");
  const compartidas = xmlCompartidas
    ? [...xmlCompartidas.datos.toString("utf8").matchAll(/<si>(.*?)<\/si>/gs)].map((m) => textoCelda(m[1]))
    : [];
  const filas = leerFilas(hoja.datos.toString("utf8"), compartidas);

  // Fila de meses: la primera con al menos 12 nombres de mes.
  const iMeses = filas.findIndex(
    (f) => [...f.celdas.values()].filter((v) => MESES[v.trim().toLowerCase()]).length >= 12,
  );
  if (iMeses < 0) return null;
  // Fila de años: la más cercana por encima con varios años.
  let iAnios = -1;
  for (let i = iMeses - 1; i >= 0; i--) {
    if ([...filas[i].celdas.values()].filter(esAnio).length >= 3) {
      iAnios = i;
      break;
    }
  }
  if (iAnios < 0) return null;
  const iTotal = filas.findIndex((f, i) => i > iMeses && (f.celdas.get(1) ?? "").trim().toUpperCase() === "TOTAL");
  if (iTotal < 0) return null;

  const inicioAnio = [...filas[iAnios].celdas.entries()]
    .filter(([, v]) => esAnio(v))
    .map(([col, v]) => ({ col, anio: Number.parseInt(v, 10) }))
    .sort((a, b) => a.col - b.col);

  const total = filas[iTotal].celdas;
  const valores = new Map<string, number>(); // «2026-8» → valor
  const ultimaColumna = new Map<number, number>(); // año → columna de su último mes con dato
  for (const [col, texto] of filas[iMeses].celdas) {
    const mes = MESES[texto.trim().toLowerCase()];
    if (!mes) continue;
    const anio = inicioAnio.filter((a) => a.col <= col).at(-1)?.anio;
    const v = Number(total.get(col));
    if (!anio || !Number.isFinite(v) || !(v > 0)) continue;
    valores.set(`${anio}-${mes}`, v);
    if (col > (ultimaColumna.get(anio) ?? 0)) ultimaColumna.set(anio, col);
  }

  const claves = [...valores.keys()]
    .map((k) => k.split("-").map(Number) as [number, number])
    .sort((a, b) => a[0] * 12 + a[1] - (b[0] * 12 + b[1]));
  const ultimo = claves.at(-1);
  if (!ultimo) return null;
  const [anio, mes] = ultimo;
  const valor = valores.get(`${anio}-${mes}`)!;
  const [min, max] = RANGO_MENSUAL[unidad];
  if (valor < min || valor > max) return null;

  const suma = (a: number): number | null => {
    let s = 0;
    for (let m = 1; m <= mes; m++) {
      const v = valores.get(`${a}-${m}`);
      if (v === undefined) return null;
      s += v;
    }
    return s;
  };
  let acumulado = suma(anio);
  // Cruce con la columna de total que la DGA pone al cierre del bloque del año.
  const colTotal = (ultimaColumna.get(anio) ?? 0) + 1;
  const totalArchivo = Number(total.get(colTotal));
  if (acumulado !== null && Number.isFinite(totalArchivo) && totalArchivo > 0) {
    if (Math.abs(totalArchivo - acumulado) / totalArchivo > 0.001) acumulado = null;
  }

  const nota =
    filas
      .flatMap((f) => [...f.celdas.values()])
      .map((v) => v.replace(/^\*+/, "").trim())
      .find((v) => /preliminar/i.test(v)) ?? null;

  return {
    anio,
    mes,
    valor,
    mismoMesAnterior: valores.get(`${anio - 1}-${mes}`) ?? null,
    acumulado,
    acumuladoAnterior: suma(anio - 1),
    unidad,
    nota,
  };
}

/* -------------------------------------------------------------- lectura */

async function leerSerie(
  indice: CategoriaIndice[],
  categoria: RegExp,
  nombre: RegExp,
  unidad: UnidadAduanas,
): Promise<SerieAduanas | null> {
  try {
    const doc = elegirDocumento(indice, categoria, nombre);
    if (!doc) return null;
    const buf = await bajarHoja(doc.url);
    if (!buf) return null;
    const serie = await parsearHojaAduanas(buf, unidad);
    if (!serie) {
      console.error(`[aduanas] forma no reconocida: ${doc.url}`);
      return null;
    }
    return { ...serie, archivo: doc.url, documento: doc.nombre, publicado: doc.publicado };
  } catch (err) {
    console.error(`[aduanas] parseo: ${String(err)}`);
    return null;
  }
}

/**
 * Importaciones y exportaciones FOB del último mes (US$) y recaudación de la
 * DGA (RD$), cada una con su mismo mes del año anterior y su acumulado.
 * Nunca lanza: cada cifra que no se pudo leer llega como `null`.
 */
export async function getComercioExterior(): Promise<ComercioExterior> {
  const vacio: ComercioExterior = {
    importaciones: null,
    exportaciones: null,
    recaudacion: null,
    indiceLeido: false,
    fuente: URL_SERIES_ADUANAS,
  };
  try {
    const indice = await leerIndice();
    if (!indice) return vacio;
    const [importaciones, exportaciones, recaudacion] = await Promise.all([
      leerSerie(indice, /^importaciones$/i, /importaciones\s+por\s+r[eé]gimen/i, "USD"),
      leerSerie(indice, /^exportaciones$/i, /exportaciones\s+por\s+r[eé]gimen/i, "USD"),
      leerSerie(indice, /^recaudaciones$/i, /recaudaciones\s+mensuales/i, "DOP"),
    ]);
    return { importaciones, exportaciones, recaudacion, indiceLeido: true, fuente: URL_SERIES_ADUANAS };
  } catch (err) {
    console.error(`[aduanas] ${String(err)}`);
    return vacio;
  }
}
