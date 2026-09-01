/**
 * Deuda pública — Crédito Público (Ministerio de Hacienda).
 *
 * Mismo contrato que las demás capas: sin base de datos, lectura en vivo con
 * caché. La Dirección General de Crédito Público publica la evolución de la
 * deuda del Sector Público No Financiero (SPNF) como XLSX mensuales con URL
 * predecible; esta capa localiza el más reciente y lee el saldo sin
 * dependencias: un XLSX es un ZIP de XML, y solo necesitamos tres celdas.
 *
 * Reconocimiento en AUDITORIA.md §3.3 y PLAN-DEMOCRACIA.md §1.
 */

// Módulo SOLO de servidor (usa node:zlib y node:fs): no importarlo desde
// componentes cliente — webpack en Next 15 lo rechaza (lección de lib/nomina).
import { inflateRaw } from "node:zlib";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://www.creditopublico.gob.do";
const PAGINA = `${BASE}/inicio/estadisticas`;
const inflate = promisify(inflateRaw);

const USER_AGENT =
  "GobiernoRD-Inteligencia/1.0 (monitoreo de deuda pública; herramienta independiente)";

export interface Deuda {
  /** Saldo de la deuda pública total del SPNF, en millones de US$. */
  saldoTotal: number;
  saldoExterna: number;
  saldoInterna: number;
  /** Etiqueta del período, p. ej. "Jul-26" (de la hoja del XLSX). */
  periodo: string;
  /** URL del XLSX de origen. */
  fuente: string;
  /**
   * true cuando el dato viene de la instantánea commiteada
   * (`public/data/deuda.json`) porque el origen no respondió: el servidor de
   * Crédito Público es on-premise en RD y rechaza el egreso de la nube.
   * Regenerar con `python3 scripts/build-deuda.py`.
   */
  desdeInstantanea: boolean;
  /** Fecha de generación de la instantánea (solo cuando desdeInstantanea). */
  generadoEn?: string;
}

async function fetchBuffer(url: string, revalidate: number): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (err) {
    console.error(`[deuda] fetch ${url}: ${String(err)}`);
    return null;
  }
}

/* ----------------------------------------------------- mini-lector de XLSX */

interface ArchivoZip {
  nombre: string;
  datos: Buffer;
}

/**
 * Extrae los archivos de un XLSX (ZIP). Soporta almacenamiento sin comprimir
 * (método 0) e inflado deflate (método 8) — es todo lo que produce Excel.
 */
async function leerZip(buf: ArrayBuffer): Promise<ArchivoZip[]> {
  const b = Buffer.from(buf);
  const archivos: ArchivoZip[] = [];
  // Recorremos las cabeceras de archivo local (firma PK\x03\x04).
  let i = 0;
  while (i + 4 <= b.length) {
    if (b.readUInt32LE(i) !== 0x04034b50) {
      i++;
      continue;
    }
    const metodo = b.readUInt16LE(i + 8);
    const compSize = b.readUInt32LE(i + 18);
    const nameLen = b.readUInt16LE(i + 26);
    const extraLen = b.readUInt16LE(i + 28);
    const nombre = b.toString("utf8", i + 30, i + 30 + nameLen);
    const inicio = i + 30 + nameLen + extraLen;
    const comprimido = b.subarray(inicio, inicio + compSize);
    if (compSize > 0 && (nombre.endsWith(".xml") || nombre.endsWith(".rels"))) {
      try {
        const datos = metodo === 0 ? comprimido : await inflate(comprimido);
        archivos.push({ nombre, datos });
      } catch {
        /* archivo ilegible: se ignora */
      }
    }
    i = inicio + compSize;
  }
  return archivos;
}

function texto(xml: string, re: RegExp): string[] {
  return [...xml.matchAll(re)].map((m) => m[1]);
}

/**
 * Lee la fila «Deuda Pública Total del …» de la hoja de saldo-evolución.
 * La columna B trae la etiqueta y la C el saldo; las dos filas siguientes son
 * Externa e Interna (AUDITORIA.md §3.3).
 */
function parsearSaldo(
  archivos: ArchivoZip[],
): Omit<Deuda, "fuente" | "desdeInstantanea" | "generadoEn"> | null {
  const sheet = archivos.find((a) => a.nombre === "xl/worksheets/sheet1.xml");
  const shared = archivos.find((a) => a.nombre === "xl/sharedStrings.xml");
  const workbook = archivos.find((a) => a.nombre === "xl/workbook.xml");
  if (!sheet) return null;

  const strs = shared
    ? texto(shared.datos.toString("utf8"), /<si>(.*?)<\/si>/gs).map((si) =>
        si.replace(/<[^>]+>/g, ""),
      )
    : [];
  const sxml = sheet.datos.toString("utf8");

  const periodo = workbook
    ? (/<sheet name="([^"]+)"/.exec(workbook.datos.toString("utf8"))?.[1] ?? "")
        .replace(/^Saldo-Evoluci[oó]n\s*/i, "")
        .trim()
    : "";

  // Mapa columna→valor por fila.
  const filas = [...sxml.matchAll(/<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs)];
  function celdasDe(rxml: string): Map<string, string> {
    const m = new Map<string, string>();
    for (const c of rxml.matchAll(
      /<c r="([A-Z]+)\d+"(?:[^>]* t="([a-z]+)")?[^>]*>(?:<f>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>)?/g,
    )) {
      const col = c[1];
      const tipo = c[2];
      let v = c[3];
      if (v == null) continue;
      if (tipo === "s") v = strs[Number(v)] ?? v;
      m.set(col, v);
    }
    return m;
  }

  const saldoDe = (rxml: string) => {
    const c = celdasDe(rxml).get("C");
    const n = c ? Number(c) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  // Buscamos la fila cuya etiqueta empieza por "Deuda Pública Total".
  let idxTotal = -1;
  for (let k = 0; k < filas.length; k++) {
    const etiqueta = celdasDe(filas[k][2]).get("B") ?? "";
    if (/^Deuda\s+P[uú]blica\s+Total/i.test(etiqueta)) {
      idxTotal = k;
      break;
    }
  }
  if (idxTotal === -1) return null;

  const saldoTotal = saldoDe(filas[idxTotal][2]);
  if (saldoTotal == null) return null;

  // Externa / Interna: las siguientes filas con esas etiquetas.
  let saldoExterna = 0;
  let saldoInterna = 0;
  for (let k = idxTotal + 1; k < Math.min(idxTotal + 5, filas.length); k++) {
    const et = celdasDe(filas[k][2]).get("B") ?? "";
    if (/Deuda\s+Externa\s+Total/i.test(et)) saldoExterna = saldoDe(filas[k][2]) ?? 0;
    if (/Deuda\s+Interna\s+Total/i.test(et)) saldoInterna = saldoDe(filas[k][2]) ?? 0;
  }

  return { saldoTotal, saldoExterna, saldoInterna, periodo };
}

/* ------------------------------------------------------------- localizador */

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Saldo de deuda con doble vía: primero la lectura **en vivo** del XLSX más
 * reciente; si el origen no responde (rechaza el egreso de la nube), cae a la
 * **instantánea commiteada**, que declara su período y su fecha de generación.
 */
export async function getDeuda(): Promise<Deuda | null> {
  const vivo = await getDeudaEnVivo();
  if (vivo) return vivo;
  return leerInstantanea();
}

async function leerInstantanea(): Promise<Deuda | null> {
  try {
    const ruta = path.join(process.cwd(), "public", "data", "deuda.json");
    const crudo = JSON.parse(await readFile(ruta, "utf8")) as {
      generadoEn: string;
      periodo: string;
      saldoTotal: number;
      saldoExterna: number;
      saldoInterna: number;
      fuente: string;
    };
    if (!crudo?.saldoTotal || !crudo.periodo) return null;
    return { ...crudo, desdeInstantanea: true };
  } catch (err) {
    console.error(`[deuda] instantánea: ${String(err)}`);
    return null;
  }
}

/**
 * Localiza y lee el XLSX de saldo más reciente. La página de estadísticas
 * enlaza los archivos del año en curso; tomamos el de «Saldo Evolución» del
 * mes más reciente. Si la página no responde, degradamos a `null`.
 */
async function getDeudaEnVivo(): Promise<Deuda | null> {
  const htmlBuf = await fetchBuffer(PAGINA, 21_600);
  if (!htmlBuf) return null;
  const html = Buffer.from(htmlBuf).toString("utf8");

  // Enlaces de "Saldo Evolución …", con entidades HTML decodificadas.
  const enlaces = texto(html, /href="(\/Content\/estadisticas\/[^"]+\.xlsx)"/g)
    .map((h) => decodeHtml(h))
    .filter((h) => /Saldo\s+Evoluci/i.test(h));
  if (enlaces.length === 0) return null;

  // Ordenar por recencia usando el patrón .../{año}/{NN}{Mes}/...
  const rango = (ruta: string): number => {
    const m = /\/anual\/(\d{4})\/(\d{1,2})([A-Za-zÁÉÍÓÚáéíóú]+)\//.exec(ruta);
    if (!m) return 0;
    const anio = Number(m[1]);
    const mes = MESES.findIndex((x) => x.toLowerCase() === m[3].toLowerCase()) + 1;
    return anio * 100 + (mes > 0 ? mes : 0);
  };
  enlaces.sort((a, b) => rango(b) - rango(a));

  for (const ruta of enlaces.slice(0, 3)) {
    const url = BASE + encodeURI(ruta);
    const buf = await fetchBuffer(url, 21_600);
    if (!buf) continue;
    const archivos = await leerZip(buf);
    const saldo = parsearSaldo(archivos);
    if (saldo) return { ...saldo, fuente: url, desdeInstantanea: false };
  }
  return null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}
