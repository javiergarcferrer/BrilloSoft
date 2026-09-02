/**
 * Congreso Nacional — capa de datos del SIL de la Cámara de Diputados.
 *
 * Mismo contrato que `lib/dgcp.ts`: sin base de datos, sin variables de entorno,
 * todo se lee en vivo y se cachea con `revalidate` de Next.
 *
 * El origen es la **API interna** del portal SIL Ciudadano
 * (`https://www.diputadosrd.gob.do/sil/api`), no una API pública documentada.
 * El reconocimiento está en `docs/RECON.md`; las tres reglas que impone:
 *
 *  1. **Un `200` no significa que la ruta exista.** IIS enruta lo desconocido
 *     bajo `/sil/` al catch-all de la SPA y devuelve HTML con estado 200. Hay
 *     que validar `content-type`, nunca el código de estado.
 *  2. **Solo GET.** El único endpoint de escritura del SIL
 *     (`suscriptor/suscribirse`) no se toca jamás.
 *  3. **User-Agent identificable**, y ritmo conservador.
 */

const BASE = "https://www.diputadosrd.gob.do/sil/api";

const USER_AGENT =
  "Socratico-Inteligencia/1.0 (monitoreo legislativo; herramienta independiente)";

/** El origen pagina de 10 en 10 y no acepta otro tamaño. */
export const SIL_PAGE_SIZE = 10;

const TIMEOUT_MS = 25_000;

/* --------------------------------------------------------------- tipos */

/** Envoltorio de paginación uniforme en todos los listados del SIL. */
export interface SilPage<T> {
  page: number;
  pageSize: number;
  total: number;
  results: T[];
}

/** Iniciativa cruda, tal como responde el SIL. */
export interface SilIniciativa {
  id: number;
  tipo: string | null;
  camaraInicio: string | null;
  numero: string | null;
  descripcion: string | null;
  periodoRegistro: string | null;
  materia: string | null;
  numPromulgacion: string | null;
  fechaPromulgacion: string | null;
  condicion: string | null;
  estado: string | null;
  fechaDeposito: string | null;
  fechaUltimoCambioPrincipal: string | null;
  grupoId: number | null;
  grupo: string | null;
  origen: string | null;
  legislatura: string | null;
}

export interface SilHistorico {
  id: number;
  estado: string | null;
  inicio: string | null;
  fin: string | null;
}

export interface SilProponente {
  principal: boolean;
  legisladorId: number | null;
  nombres: string | null;
  apellidos: string | null;
  nombreCompleto: string | null;
  representacion: {
    funcion: string | null;
    provincia: string | null;
    partido: { nombre: string | null; siglas: string | null } | null;
    periodo: string | null;
  } | null;
}

export interface SilDocumento {
  id: number;
  descripcion: string | null;
  extension: string | null;
  cargado: string | null;
}

export interface SilGrupo {
  id: number;
  descripcion: string;
  icono: string | null;
}

export interface SilPeriodo {
  id: number;
  description: string;
  isCurrent: boolean;
}

/* --------------------------------------------------------------- fetch */

function emptyPage<T>(): SilPage<T> {
  return { page: 1, pageSize: SIL_PAGE_SIZE, total: 0, results: [] };
}

/**
 * Wrapper único de todas las llamadas al SIL: timeout, **un reintento** y la
 * validación de `content-type` que exige la regla 1.
 */
async function silFetch<T>(path: string, revalidate = 600): Promise<T> {
  let ultimoError: unknown;

  for (let intento = 0; intento < 2; intento++) {
    try {
      const res = await fetch(`${BASE}/${path}`, {
        method: "GET",
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate },
      });

      if (!res.ok) throw new Error(`El SIL respondió ${res.status}`);

      // Regla 1: HTML con estado 200 es un fallo de ruta disfrazado de éxito.
      const tipo = res.headers.get("content-type") ?? "";
      if (!tipo.includes("application/json")) {
        throw new Error(
          `Ruta inexistente: el SIL devolvió ${tipo || "sin content-type"} en vez de JSON`,
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      ultimoError = err;
    }
  }

  throw new Error(`SIL ${path}: ${String(ultimoError)}`);
}

/** Como `silFetch`, pero degrada a `null` en vez de tumbar la vista. */
async function silFetchSafe<T>(path: string, revalidate?: number): Promise<T | null> {
  try {
    return await silFetch<T>(path, revalidate);
  } catch (err) {
    console.error(`[congreso] ${String(err)}`);
    return null;
  }
}

/* ----------------------------------------------------------- consultas */

/** Censo de iniciativas del registro vigente. */
export async function getCountIniciativas(): Promise<number | null> {
  return silFetchSafe<number>("iniciativa/CountIniciativas", 3600);
}

/**
 * Listado de iniciativas. `keyword` hace match de subcadena sobre la
 * descripción y funciona con frases de varias palabras.
 *
 * El endpoint filtrado del SIL (`iniciativa/iniciativas`, con grupo/tipo/
 * perimidas) devuelve 400 en todas las combinaciones probadas, así que el
 * filtrado por tema se hace del lado de la aplicación.
 */
export async function listIniciativas(
  page = 1,
  keyword = "",
): Promise<SilPage<SilIniciativa>> {
  const q = `iniciativa/getIniciativas?page=${page}&keyword=${encodeURIComponent(keyword)}`;
  return (await silFetchSafe<SilPage<SilIniciativa>>(q, 300)) ?? emptyPage();
}

export async function getIniciativa(id: number): Promise<SilIniciativa | null> {
  return silFetchSafe<SilIniciativa>(`iniciativa/iniciativa/${id}`, 300);
}

/** Traza de estados. Devuelve intervalos (`inicio`/`fin`), no eventos. */
export async function getHistoricos(id: number): Promise<SilPage<SilHistorico>> {
  return (
    (await silFetchSafe<SilPage<SilHistorico>>(`iniciativa/historicos?page=1&id=${id}`, 300)) ??
    emptyPage()
  );
}

export async function getProponentes(id: number): Promise<SilPage<SilProponente>> {
  return (
    (await silFetchSafe<SilPage<SilProponente>>(`iniciativa/proponentes?page=1&id=${id}`, 300)) ??
    emptyPage()
  );
}

/** Documentos PDF de la pieza. Versionados append-only: no se sobrescriben. */
export async function getDocumentos(id: number): Promise<SilPage<SilDocumento>> {
  return (
    (await silFetchSafe<SilPage<SilDocumento>>(`iniciativa/documentos?page=1&id=${id}`, 300)) ??
    emptyPage()
  );
}

/** Taxonomía temática oficial: 15 grupos con id estable. */
export async function getGrupos(): Promise<SilGrupo[]> {
  return (await silFetchSafe<SilGrupo[]>("iniciativa/Grupos", 86400)) ?? [];
}

/** Períodos legislativos. Las fechas vienen con mes `00`: no parsearlas. */
export async function getPeriodos(): Promise<SilPeriodo[]> {
  return (await silFetchSafe<SilPeriodo[]>("periodolegislativo/all", 86400)) ?? [];
}

/**
 * Base para descargar un documento, resuelta en runtime.
 *
 * El bundle del SIL trae una URL hardcodeada distinta de la que devuelve este
 * endpoint, así que hay que preguntarla y no fijarla. El host que responde es
 * on-premise en RD y rechaza conexiones desde fuera del país (docs/RECON.md §2.9).
 */
export async function getRutaDocumento(): Promise<string | null> {
  return silFetchSafe<string>("comun/GetRutaDocumento/", 86400);
}

export function documentoUrl(base: string | null, documentoId: number): string | null {
  return base ? `${base}${documentoId}` : null;
}

/* ------------------------------------------------------ normalización */

/** Colapsa espacios repetidos y recorta. El SIL trae `"Mélido  Mercedes"`. */
export function limpiarTexto(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\s+/g, " ").trim();
}

/** Palabras que no se capitalizan en medio de un título en español. */
const ATONAS = new Set([
  "y", "e", "o", "u", "de", "del", "la", "las", "el", "los", "en", "a", "al",
  "por", "para", "con", "sin", "que", "su", "sus", "un", "una",
  // Fórmulas de la técnica legislativa: aparecen en casi todos los títulos
  // («…, mediante la cual se deroga…») y en versalita quedan de adorno.
  "se", "cual", "cuales", "mediante", "sobre", "como", "lo", "le", "les",
  "ni", "o", "sino", "según", "ante", "tras", "es",
]);

/** Capitaliza un texto que viene TODO EN MAYÚSCULAS; deja intacto el resto. */
export function desdeMayusculas(valor: string): string {
  const limpio = limpiarTexto(valor);
  if (limpio !== limpio.toUpperCase()) return limpio;

  return limpio
    .toLowerCase()
    .replace(
      /(^|[\s(/-])([a-záéíóúñ][a-záéíóúñ]*)/g,
      (_, sep: string, palabra: string) =>
        sep +
        (sep !== "" && ATONAS.has(palabra)
          ? palabra
          : palabra.charAt(0).toUpperCase() + palabra.slice(1)),
    );
}

export interface NumeroExpediente {
  completo: string;
  secuencia: string | null;
  periodoRegistro: string | null;
  camara: string | null;
}

/**
 * Descompone `06225-2024-2028-CD`.
 *
 * Es un identificador de **cita**, no de identidad: incorpora el período de
 * registro y cambia cuando la pieza se arrastra al siguiente. La identidad
 * estable es el `id` interno.
 */
export function parseNumero(numero: string | null | undefined): NumeroExpediente | null {
  const completo = limpiarTexto(numero);
  if (!completo) return null;

  const m = /^(\d+)-(\d{4}-\d{4})-([A-Z]+)$/i.exec(completo);
  if (!m) return { completo, secuencia: null, periodoRegistro: null, camara: null };

  return {
    completo,
    secuencia: m[1],
    periodoRegistro: m[2],
    camara: m[3].toUpperCase(),
  };
}

/**
 * El SIL guarda el título reformulado dentro de la misma `descripcion`, detrás
 * de un marcador en mayúsculas. Separarlo importa: que a una pieza le cambien
 * el título durante el trámite es justo lo que un abogado quiere ver.
 */
export function separarTitulo(descripcion: string): {
  titulo: string;
  tituloModificado: string | null;
} {
  const m = /\bT[ÍI]TULO\s+MODIFICADO\s*:\s*/i.exec(descripcion);
  if (!m) return { titulo: descripcion, tituloModificado: null };

  const titulo = descripcion.slice(0, m.index).trim().replace(/[.\s]+$/, "");
  const modificado = descripcion.slice(m.index + m[0].length).trim();

  return { titulo: titulo || descripcion, tituloModificado: modificado || null };
}

export type CondicionTono = "vigente" | "aprobado" | "perimido" | "neutro";

/** Agrupa la condición del SIL en el tono semántico que usa la UI. */
export function tonoDeCondicion(condicion: string | null | undefined): CondicionTono {
  const c = (condicion ?? "").toUpperCase();
  if (c.includes("PERIMID")) return "perimido";
  if (c.includes("APROBAD") || c.includes("PROMULGAD")) return "aprobado";
  if (c.includes("RECHAZAD") || c.includes("RETIRAD")) return "neutro";
  if (c.includes("VIGENTE") || c.includes("DEPOSITAD")) return "vigente";
  return "neutro";
}

export interface Iniciativa {
  id: number;
  numero: NumeroExpediente | null;
  titulo: string;
  tituloModificado: string | null;
  tipo: string | null;
  camaraOrigen: string | null;
  grupo: string | null;
  grupoId: number | null;
  materia: string | null;
  condicion: string | null;
  estado: string | null;
  tono: CondicionTono;
  /** Sigue viva y por tanto puede perimir. */
  viva: boolean;
  legislatura: string | null;
  periodoRegistro: string | null;
  fechaDeposito: string | null;
  fechaUltimoCambio: string | null;
  promulgada: boolean;
  numPromulgacion: string | null;
  fechaPromulgacion: string | null;
}

export function normalizarIniciativa(raw: SilIniciativa): Iniciativa {
  const condicion = limpiarTexto(raw.condicion) || null;
  const tono = tonoDeCondicion(condicion);
  const { titulo, tituloModificado } = separarTitulo(
    limpiarTexto(raw.descripcion) || "(sin descripción)",
  );

  return {
    id: raw.id,
    numero: parseNumero(raw.numero),
    titulo,
    tituloModificado,
    tipo: limpiarTexto(raw.tipo) || null,
    camaraOrigen: limpiarTexto(raw.camaraInicio) || null,
    grupo: limpiarTexto(raw.grupo) || null,
    grupoId: raw.grupoId,
    materia: raw.materia ? desdeMayusculas(raw.materia) : null,
    condicion,
    estado: limpiarTexto(raw.estado) || null,
    tono,
    viva: tono === "vigente",
    legislatura: limpiarTexto(raw.legislatura) || null,
    periodoRegistro: limpiarTexto(raw.periodoRegistro) || null,
    fechaDeposito: raw.fechaDeposito,
    fechaUltimoCambio: raw.fechaUltimoCambioPrincipal,
    promulgada: Boolean(raw.fechaPromulgacion || raw.numPromulgacion),
    numPromulgacion: limpiarTexto(raw.numPromulgacion) || null,
    fechaPromulgacion: raw.fechaPromulgacion,
  };
}

export interface Proponente {
  legisladorId: number | null;
  nombre: string;
  principal: boolean;
  funcion: string | null;
  provincia: string | null;
  partidoSiglas: string | null;
}

export function normalizarProponente(raw: SilProponente): Proponente {
  return {
    legisladorId: raw.legisladorId,
    nombre:
      limpiarTexto(raw.nombreCompleto) ||
      limpiarTexto(`${raw.nombres ?? ""} ${raw.apellidos ?? ""}`) ||
      "(sin nombre)",
    principal: Boolean(raw.principal),
    funcion: limpiarTexto(raw.representacion?.funcion) || null,
    provincia: raw.representacion?.provincia
      ? desdeMayusculas(raw.representacion.provincia)
      : null,
    partidoSiglas: limpiarTexto(raw.representacion?.partido?.siglas) || null,
  };
}

/**
 * Etapa de un documento. `texto` marca los que contienen articulado —los que
 * una comparación entre lecturas compara—; el resto es tramitación.
 */
export interface EtapaDocumento {
  clave: "deposito" | "modificacion" | "aprobado" | "informe" | "acuse" | "aviso" | "otro";
  texto: boolean;
}

/**
 * Clasifica la etiqueta libre del SIL. Deliberadamente tolerante: el origen
 * escribe en mayúsculas, con acentos inconsistentes, espacios iniciales y el
 * nombre de la comisión pegado.
 */
export function clasificarDocumento(descripcion: string | null | undefined): EtapaDocumento {
  const d = limpiarTexto(descripcion)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (d.includes("MODIFICACION")) return { clave: "modificacion", texto: true };
  if (d.includes("APROBADO")) return { clave: "aprobado", texto: true };
  if (d.includes("DEPOSITADO")) return { clave: "deposito", texto: true };
  if (d.includes("INFORME")) return { clave: "informe", texto: false };
  if (d.includes("ACUSE")) return { clave: "acuse", texto: false };
  if (d.includes("AVISO")) return { clave: "aviso", texto: false };
  return { clave: "otro", texto: false };
}

export interface Documento {
  id: number;
  etiqueta: string;
  etapa: EtapaDocumento;
  extension: string | null;
  cargado: string | null;
}

export function normalizarDocumento(raw: SilDocumento): Documento {
  return {
    id: raw.id,
    etiqueta: desdeMayusculas(raw.descripcion ?? "") || "Documento",
    etapa: clasificarDocumento(raw.descripcion),
    extension: limpiarTexto(raw.extension).toLowerCase() || null,
    cargado: raw.cargado,
  };
}

/* ------------------------------------------------ legislaturas y perención */

/** Días que dura una legislatura ordinaria, contando el día de apertura. */
export const DURACION_LEGISLATURA_DIAS = 150;

/** Ventana de aviso previo al cierre, en días. */
export const VENTANA_ALERTA_DIAS = 30;

export type TipoLegislatura = "PLO" | "SLO";

export interface Legislatura {
  codigo: string;
  anio: number;
  tipo: TipoLegislatura;
  nombre: string;
  inicio: Date;
  /** Último día de la legislatura (inicio + 149 días). */
  cierre: Date;
}

// Mes en base 0, como espera Date.UTC.
const INICIOS: Record<TipoLegislatura, { mes: number; dia: number }> = {
  PLO: { mes: 1, dia: 27 }, // 27 de febrero
  SLO: { mes: 7, dia: 16 }, // 16 de agosto
};

const NOMBRES: Record<TipoLegislatura, string> = {
  PLO: "Primera Legislatura Ordinaria",
  SLO: "Segunda Legislatura Ordinaria",
};

const MS_POR_DIA = 86_400_000;

/** Diferencia en días completos entre dos fechas (b − a). */
export function diffDias(a: Date, b: Date): number {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((ub - ua) / MS_POR_DIA);
}

/** Interpreta un código `"2026-SLO"`. Devuelve `null` si no tiene esa forma. */
export function parseLegislatura(codigo: string | null | undefined): Legislatura | null {
  if (!codigo) return null;

  const m = /^(\d{4})\s*-\s*(PLO|SLO)$/i.exec(codigo.trim());
  if (!m) return null;

  const anio = Number(m[1]);
  const tipo = m[2].toUpperCase() as TipoLegislatura;
  const { mes, dia } = INICIOS[tipo];

  const inicio = new Date(Date.UTC(anio, mes, dia));
  const cierre = new Date(inicio.getTime() + (DURACION_LEGISLATURA_DIAS - 1) * MS_POR_DIA);

  return { codigo: codigo.trim(), anio, tipo, nombre: NOMBRES[tipo], inicio, cierre };
}

/** La legislatura ordinaria vigente en una fecha dada, si hay alguna. */
export function legislaturaVigente(hoy: Date = new Date()): Legislatura | null {
  const anio = hoy.getUTCFullYear();
  return (
    [
      parseLegislatura(`${anio}-PLO`),
      parseLegislatura(`${anio}-SLO`),
      // La SLO cruza el año: en enero seguimos dentro de la del año anterior.
      parseLegislatura(`${anio - 1}-SLO`),
    ]
      .filter((l): l is Legislatura => l !== null)
      .find((l) => hoy >= l.inicio && hoy <= l.cierre) ?? null
  );
}

export type EstadoPerencion =
  | { estado: "sin-datos" }
  | { estado: "cerrada"; legislatura: Legislatura }
  | { estado: "en-riesgo"; legislatura: Legislatura; diasRestantes: number }
  | { estado: "vigente"; legislatura: Legislatura; diasRestantes: number };

/** Situación de una pieza viva frente al cierre de su legislatura. */
export function evaluarPerencion(
  codigoLegislatura: string | null | undefined,
  hoy: Date = new Date(),
): EstadoPerencion {
  const legislatura = parseLegislatura(codigoLegislatura);
  if (!legislatura) return { estado: "sin-datos" };

  const diasRestantes = diffDias(hoy, legislatura.cierre);
  if (diasRestantes < 0) return { estado: "cerrada", legislatura };
  if (diasRestantes <= VENTANA_ALERTA_DIAS) {
    return { estado: "en-riesgo", legislatura, diasRestantes };
  }
  return { estado: "vigente", legislatura, diasRestantes };
}

/* -------------------------------------------------------------- agregados */

/** Peticiones simultáneas al SIL. Conservador a propósito. */
const CONCURRENCIA = 4;

export interface Muestra {
  iniciativas: Iniciativa[];
  /** Censo declarado por el origen, no el tamaño de la muestra. */
  total: number | null;
  /** Cuántas iniciativas se recorrieron realmente. */
  muestra: number;
}

/**
 * Trae `paginas` páginas del listado, en lotes.
 *
 * El SIL pagina de 10 en 10 y no expone agregados, así que recorrer las ~622
 * páginas del corpus en cada render es inviable. Hasta que exista una capa de
 * ingesta persistente, las vistas trabajan sobre una muestra acotada y lo
 * declaran, en vez de presentar el número como si fuera el censo completo.
 */
export async function muestrearIniciativas(paginas: number, keyword = ""): Promise<Muestra> {
  const numeros = Array.from({ length: paginas }, (_, i) => i + 1);
  const acumulado: Iniciativa[] = [];
  let total: number | null = null;

  for (let i = 0; i < numeros.length; i += CONCURRENCIA) {
    const respuestas = await Promise.all(
      numeros.slice(i, i + CONCURRENCIA).map((page) => listIniciativas(page, keyword)),
    );
    for (const r of respuestas) {
      if (total === null && r.total > 0) total = r.total;
      acumulado.push(...r.results.map(normalizarIniciativa));
    }
  }

  return { iniciativas: acumulado, total, muestra: paginas * SIL_PAGE_SIZE };
}

export interface ResumenLegislativo {
  vivas: number;
  aprobadas: number;
  perimidas: number;
  otras: number;
  enRiesgo: Iniciativa[];
  porGrupo: { grupo: string; total: number }[];
}

/** Conteos y cortes sobre una muestra ya normalizada. */
export function resumirIniciativas(iniciativas: Iniciativa[]): ResumenLegislativo {
  let vivas = 0;
  let aprobadas = 0;
  let perimidas = 0;
  let otras = 0;

  const enRiesgo: Iniciativa[] = [];
  const grupos = new Map<string, number>();

  for (const ini of iniciativas) {
    if (ini.tono === "vigente") vivas++;
    else if (ini.tono === "aprobado") aprobadas++;
    else if (ini.tono === "perimido") perimidas++;
    else otras++;

    if (ini.viva && evaluarPerencion(ini.legislatura).estado === "en-riesgo") {
      enRiesgo.push(ini);
    }

    if (ini.grupo) grupos.set(ini.grupo, (grupos.get(ini.grupo) ?? 0) + 1);
  }

  const porGrupo = [...grupos.entries()]
    .map(([grupo, total]) => ({ grupo, total }))
    .sort((a, b) => b.total - a.total);

  return { vivas, aprobadas, perimidas, otras, enRiesgo, porGrupo };
}
