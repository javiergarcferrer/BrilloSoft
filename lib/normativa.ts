/**
 * Normativa del Poder Ejecutivo — Consultoría Jurídica.
 *
 * Mismo contrato que las demás capas: sin base de datos, lectura en vivo con
 * caché. La Consultoría Jurídica del Poder Ejecutivo expone la consulta pública
 * de leyes, decretos, reglamentos, resoluciones y Gaceta Oficial. No hay API:
 * es una app ASP.NET MVC con token antiforgery, misma familia que el
 * consultante del Senado. Reglas verificadas (AUDITORIA.md §4.1, spike QRSPI):
 *
 *  1. **Token + POST.** `GET /consulta/` entrega `__RequestVerificationToken`;
 *     la búsqueda es `POST /Consulta/Home/Search` con ese token y una sesión.
 *  2. **Consultas acotadas.** Sin filtro el buscador cuelga (renderiza todo el
 *     histórico 1926–hoy sin paginar). Siempre se filtra por año.
 *  3. **Operadores numéricos.** El operador de año es `1`=Igual, `2`=Mayor Que…
 *     (no el signo `=`). Ese detalle es lo que hace viable la consulta.
 *  4. GET/POST de solo lectura; User-Agent identificable; un reintento.
 */

import { unstable_cache } from "next/cache";

const BASE = "https://www.consultoria.gov.do";

const USER_AGENT =
  "Socratico-Inteligencia/1.0 (monitoreo normativo; herramienta independiente)";

const TIMEOUT_MS = 30_000;

/** Tipos de documento del propio formulario. */
export const TIPOS_NORMATIVA = {
  "1": "Leyes",
  "3": "Decretos",
  "4": "Reglamentos",
  "7": "Resoluciones",
  "1014": "Gaceta Oficial",
} as const;

export type TipoNormativa = keyof typeof TIPOS_NORMATIVA;

export interface Documento {
  tipo: string;
  numero: string;
  titulo: string;
  gaceta: string | null;
  fecha: string | null;
  /** ISO `yyyy-mm-dd` para ordenar, si la fecha tiene forma dd/mm/yyyy. */
  fechaIso: string | null;
  documentId: string | null;
  /** URL de apertura del documento en el origen. */
  url: string | null;
}

function limpiar(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fechaIso(f: string | null): string | null {
  if (!f) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(f.trim());
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

interface Sesion {
  token: string;
  cookie: string;
}

async function abrirSesion(): Promise<Sesion | null> {
  try {
    const res = await fetch(`${BASE}/consulta/`, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const token = /name="__RequestVerificationToken"[^>]*value="([^"]+)"/.exec(html)?.[1];
    if (!token) return null;
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [res.headers.get("set-cookie") ?? ""];
    const cookie = setCookies
      .map((c) => c.split(";")[0])
      .filter((c) => c.includes("="))
      .join("; ");
    return { token, cookie };
  } catch (err) {
    console.error(`[normativa] sesión: ${String(err)}`);
    return null;
  }
}

function parsearFilas(html: string): Documento[] {
  const filas = [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)];
  const docs: Documento[] = [];
  for (const [, rxml] of filas) {
    const celdas = [...rxml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => m[1]);
    if (celdas.length < 5) continue; // cabecera u otra fila
    const fecha = limpiar(celdas[4]) || null;
    const documentId = /documentId=(\d+)/.exec(rxml)?.[1] ?? null;
    docs.push({
      tipo: limpiar(celdas[0]),
      numero: limpiar(celdas[1]),
      titulo: limpiar(celdas[2]),
      gaceta: limpiar(celdas[3]) || null,
      fecha,
      fechaIso: fechaIso(fecha),
      documentId,
      url: documentId
        ? `${BASE}/Consulta/Home/FileManagement?documentId=${documentId}&managementType=1`
        : null,
    });
  }
  return docs;
}

/**
 * Busca documentos de un tipo dentro de un año. Devuelve la lista ordenada de
 * más reciente a más antigua (por fecha del documento). Degrada a `[]`.
 */
export async function buscarNormativa(
  tipo: TipoNormativa,
  anio: number,
): Promise<Documento[]> {
  const sesion = await abrirSesion();
  if (!sesion) return [];

  const cuerpo = new URLSearchParams({
    __RequestVerificationToken: sesion.token,
    DocumentTypeCode: tipo,
    DocumentCategory: "0",
    DocumentNumber: "",
    DocumentTitle: "",
    GacetaOficial: "",
    PublicationYearOperator: "1", // Igual a
    PublicationYear: String(anio),
    PublicationYearEnd: "",
    EmisionDateOperator: "",
    EmisionDate: "",
    EmisionDateEnd: "",
    President: "",
    Consultor: "",
    Category: "",
    Institution: "",
  });

  try {
    const res = await fetch(`${BASE}/Consulta/Home/Search?Length=7`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: sesion.cookie,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: cuerpo.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const docs = parsearFilas(await res.text());
    docs.sort((a, b) => (b.fechaIso ?? "").localeCompare(a.fechaIso ?? ""));
    return docs;
  } catch (err) {
    console.error(`[normativa] búsqueda ${tipo}/${anio}: ${String(err)}`);
    return [];
  }
}

export interface ResumenNormativa {
  anio: number;
  decretosRecientes: Documento[];
  leyesRecientes: Documento[];
  totalDecretos: number;
  totalLeyes: number;
}

/** Panorámica del año vigente: decretos y leyes recientes con sus totales. */
export async function getResumenNormativa(anio = new Date().getFullYear()): Promise<ResumenNormativa | null> {
  const [decretos, leyes] = await Promise.all([
    buscarNormativa("3", anio),
    buscarNormativa("1", anio),
  ]);
  if (decretos.length === 0 && leyes.length === 0) return null;
  return {
    anio,
    decretosRecientes: decretos.slice(0, 8),
    leyesRecientes: leyes.slice(0, 8),
    totalDecretos: decretos.length,
    totalLeyes: leyes.length,
  };
}

/* --------------------------------------------------- resolución de una cita */

/** Código de tipo del formulario para el nombre que usa el título de una ley. */
const CODIGO_POR_TIPO: Record<string, TipoNormativa> = {
  ley: "1",
  decreto: "3",
  reglamento: "4",
  "resolución": "7",
  resolucion: "7",
};

/** Segmento de URL de cada tipo, para las fichas de norma. */
export const RUTA_POR_TIPO: Record<string, string> = {
  Ley: "ley",
  Decreto: "decreto",
  Reglamento: "reglamento",
  "Resolución": "resolucion",
};

/** ¿Es un tipo con ficha propia? Devuelve su nombre canónico. */
export function tipoDeRuta(slug: string): string | null {
  const encontrado = Object.entries(RUTA_POR_TIPO).find(([, r]) => r === slug);
  return encontrado?.[0] ?? null;
}

/** Qué es cada instrumento del Ejecutivo, en una frase. */
export function queEsNorma(tipo: string): string | null {
  switch (tipo) {
    case "Ley":
      return "Una ley de la República: la aprobó el Congreso en sus dos cámaras y la promulgó el Presidente. Obliga a todo el mundo hasta que otra ley la derogue.";
    case "Decreto":
      return "Un decreto del Poder Ejecutivo: lo dicta el Presidente por sí solo, sin pasar por el Congreso. No puede contradecir una ley, y otro decreto puede dejarlo sin efecto.";
    case "Reglamento":
      return "Un reglamento: desarrolla cómo se aplica una ley en la práctica. Vive subordinado a la ley que reglamenta.";
    case "Resolución":
      return "Una resolución: una decisión administrativa de alcance acotado, normalmente de un ministerio u organismo.";
    default:
      return null;
  }
}

/**
 * Resuelve una cita normativa (`Ley 47-20`) al documento oficial.
 *
 * El buscador acepta `DocumentNumber` como único filtro y responde en ~2 s
 * —la regla de «siempre filtrar» se cumple con el número—, así que una cita
 * cuesta una sesión más una consulta. Devuelve `null` si no hay coincidencia
 * exacta: se prefiere no enlazar antes que enlazar a otra norma.
 */
async function normaUpstream(tipo: string, numero: string): Promise<Documento | null> {
  const codigo = CODIGO_POR_TIPO[tipo.toLowerCase()];
  if (!codigo) return null;

  const sesion = await abrirSesion();
  if (!sesion) throw new Error("sin sesión en la Consultoría");

  const cuerpo = new URLSearchParams({
    __RequestVerificationToken: sesion.token,
    DocumentTypeCode: codigo,
    DocumentCategory: "0",
    DocumentNumber: numero,
    DocumentTitle: "",
    GacetaOficial: "",
    PublicationYearOperator: "",
    PublicationYear: "",
    PublicationYearEnd: "",
    EmisionDateOperator: "",
    EmisionDate: "",
    EmisionDateEnd: "",
    President: "",
    Consultor: "",
    Category: "",
    Institution: "",
  });

  const res = await fetch(`${BASE}/Consulta/Home/Search?Length=7`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: sesion.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: cuerpo.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`la búsqueda respondió ${res.status}`);

  const normalizado = numero.replace(/\s+/g, "");
  return (
    parsearFilas(await res.text()).find((d) => d.numero.replace(/\s+/g, "") === normalizado) ??
    null
  );
}

// Una norma publicada no cambia: ventana larga y un fallo nunca se cachea.
const normaCached = unstable_cache(normaUpstream, ["normativa-cita"], { revalidate: 86400 });

/** Documento oficial de una cita normativa, o `null` si no se pudo resolver. */
export async function resolverNorma(
  tipo: string,
  numero: string | null,
): Promise<Documento | null> {
  if (!numero) return null;
  try {
    return await normaCached(tipo, numero);
  } catch (err) {
    console.error(`[normativa] cita ${tipo} ${numero}: ${String(err)}`);
    return null;
  }
}
