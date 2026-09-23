/**
 * Normativa del Poder Ejecutivo — Consultoría Jurídica.
 *
 * Mismo contrato que las demás capas: sin base de datos, lectura en vivo con
 * caché. En septiembre de 2026 la Consultoría rehízo su portal: la vieja app
 * ASP.NET MVC (`/consulta/`, token antiforgery + POST de formulario) devuelve
 * 404 y el buscador nuevo habla JSON. Reglas verificadas (docs/AUDITORIA.md §4.1):
 *
 *  1. **Búsqueda.** `POST /api/consultas/search` con cuerpo JSON; sin token ni
 *     sesión. Responde la lista completa, sin paginar.
 *  2. **Consultas acotadas.** Siempre se filtra: por año (`PublicationYear`)
 *     para los listados, por número (`DocumentNumber`) para una cita.
 *  3. **Gaceta Oficial** no está en el buscador: vive en el repositorio de
 *     documentos, `GET /api/documents?category=gacetas`, un JSON con todas.
 *  4. El texto de una norma es `GET /api/document/{DocId}`, PDF `inline`.
 *  5. Solo lectura; User-Agent identificable.
 */

import { unstable_cache } from "next/cache";

const BASE = "https://www.consultoria.gov.do";

const USER_AGENT =
  "Socratico-Inteligencia/1.0 (monitoreo normativo; herramienta independiente)";

const TIMEOUT_MS = 30_000;

/**
 * Tipos que ofrece la vertical. Los códigos 1–7 son los del buscador; `1014`
 * era el de Gaceta en la app vieja y se conserva como clave de URL, aunque
 * ahora se sirve desde el repositorio de documentos.
 */
export const TIPOS_NORMATIVA = {
  "1": "Leyes",
  "3": "Decretos",
  "4": "Reglamentos",
  "7": "Resoluciones",
  "1014": "Gaceta Oficial",
} as const;

export type TipoNormativa = keyof typeof TIPOS_NORMATIVA;

/** Nombre singular por código: el que usan las fichas y las citas. */
const TIPO_SINGULAR: Record<number, string> = {
  1: "Ley",
  3: "Decreto",
  4: "Reglamento",
  5: "Varios",
  7: "Resolución",
};

export interface Documento {
  tipo: string;
  numero: string;
  titulo: string;
  gaceta: string | null;
  fecha: string | null;
  /** ISO `yyyy-mm-dd` para ordenar, si el origen da una fecha completa. */
  fechaIso: string | null;
  documentId: string | null;
  /** URL de apertura del documento en el origen. */
  url: string | null;
}

/** Fila del buscador `/api/consultas/search` (solo los campos que se leen). */
interface FilaBuscador {
  DocId?: number | null;
  TipoDocumento?: number | null;
  Tipo?: string | null;
  Numero?: string | null;
  Titulo?: string | null;
  Gaceta?: string | null;
  FechaPromulgacion?: string | null;
}

/** Entrada del repositorio `/api/documents` (solo los campos que se leen). */
interface EntradaRepositorio {
  id?: string;
  title?: string | null;
  fileUrl?: string | null;
  year?: number | null;
  month?: string | null;
  status?: string | null;
}

function texto(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function aDocumento(f: FilaBuscador): Documento {
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(f.FechaPromulgacion ?? "")?.[0] ?? null;
  const documentId = f.DocId != null ? String(f.DocId) : null;
  return {
    tipo: TIPO_SINGULAR[f.TipoDocumento ?? -1] ?? texto(f.Tipo),
    numero: texto(f.Numero),
    titulo: texto(f.Titulo),
    gaceta: texto(f.Gaceta) || null,
    fecha: iso ? iso.split("-").reverse().join("/") : null,
    fechaIso: iso,
    documentId,
    url: documentId ? `${BASE}/api/document/${documentId}` : null,
  };
}

/** Consulta el buscador. Lanza si el origen no contesta con una lista. */
async function consultar(filtro: {
  DocumentTypeCode: number;
  DocumentNumber?: string;
  PublicationYear?: string;
}): Promise<Documento[]> {
  const res = await fetch(`${BASE}/api/consultas/search`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      DocumentTypeCode: filtro.DocumentTypeCode,
      DocumentNumber: filtro.DocumentNumber ?? "",
      FullText: "",
      Name: "",
      LastName: "",
      Identification: "",
      Charge: "",
      Institution: 0,
      President: 0,
      Consultor: 0,
      Career: 0,
      Guild: 0,
      PensionType: 0,
      PublicationYear: filtro.PublicationYear ?? "",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`la búsqueda respondió ${res.status}`);
  const datos: unknown = await res.json();
  if (!Array.isArray(datos)) throw new Error("la búsqueda no devolvió una lista");
  return (datos as FilaBuscador[]).map(aDocumento);
}

/**
 * Gacetas Oficiales de un año, desde el repositorio de documentos. El
 * repositorio da número, mes y año —no día—, así que no hay `fechaIso` y el
 * orden es por número de gaceta.
 */
async function gacetas(anio: number): Promise<Documento[]> {
  const res = await fetch(`${BASE}/api/documents?category=gacetas`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`el repositorio respondió ${res.status}`);
  const datos: unknown = await res.json();
  if (!Array.isArray(datos)) throw new Error("el repositorio no devolvió una lista");
  return (datos as EntradaRepositorio[])
    .filter((e) => e.year === anio && (e.status ?? "published") === "published")
    .map((e) => {
      const numero = texto(e.title);
      const mes = texto(e.month).toLowerCase();
      // `fileUrl` junta el PDF y su portada con «|»; el primero es el PDF.
      const archivo = (e.fileUrl ?? "").split("|")[0]?.trim() ?? "";
      return {
        tipo: "Gaceta Oficial",
        numero,
        titulo: mes ? `Edición de ${mes} de ${anio}` : `Edición de ${anio}`,
        gaceta: null,
        fecha: mes ? `${mes} de ${anio}` : String(anio),
        fechaIso: null,
        documentId: e.id ?? null,
        url: archivo.startsWith("/uploads/") ? `${BASE}${archivo}` : null,
      };
    })
    .sort((a, b) => Number(b.numero) - Number(a.numero));
}

/**
 * Busca documentos de un tipo dentro de un año. Devuelve la lista ordenada de
 * más reciente a más antigua. Degrada a `[]`.
 */
export async function buscarNormativa(
  tipo: TipoNormativa,
  anio: number,
): Promise<Documento[]> {
  try {
    if (tipo === "1014") return await gacetas(anio);
    const docs = await consultar({
      DocumentTypeCode: Number(tipo),
      PublicationYear: String(anio),
    });
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
 * El buscador acepta `DocumentNumber` como único filtro y responde en ~1 s
 * —la regla de «siempre filtrar» se cumple con el número—, así que una cita
 * cuesta una consulta. Devuelve `null` si no hay coincidencia exacta: se
 * prefiere no enlazar antes que enlazar a otra norma.
 */
async function normaUpstream(tipo: string, numero: string): Promise<Documento | null> {
  const codigo = CODIGO_POR_TIPO[tipo.toLowerCase()];
  if (!codigo) return null;

  const docs = await consultar({ DocumentTypeCode: Number(codigo), DocumentNumber: numero });
  const normalizado = numero.replace(/\s+/g, "");
  return docs.find((d) => d.numero.replace(/\s+/g, "") === normalizado) ?? null;
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
