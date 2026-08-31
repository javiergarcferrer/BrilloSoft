/**
 * Senado de la República — capa de datos del consultante público del SIL.
 *
 * El Senado no expone API JSON: su web (WordPress) cierra la REST API con un
 * plugin de seguridad, y su SIL (`sil.senadord.gob.do`) es un gestor documental
 * ASP.NET WebForms («FileMaster») cuyo modo **consultante** es la interfaz de
 * consulta ciudadana que la propia web oficial enlaza. Esta capa lee ese modo
 * consultante y nada más. El reconocimiento completo está en `RECON.md` §12.
 *
 * Reglas que impone el origen, en paridad con `lib/congreso.ts`:
 *
 *  1. **Sesión por colección.** Cada cuatrienio vive en una base distinta
 *     (`bd=C2024-2028`…). `consultante.aspx` fija la base en la sesión ASP.NET
 *     y redirige; sin esa cookie, toda ruta responde 302. Cada lectura fría
 *     son dos peticiones encadenadas.
 *  2. **Solo el consultante.** Jamás se toca `login.aspx` ni ninguna ruta de
 *     gestión. La única petición no-GET es el postback de búsqueda del propio
 *     formulario público — una consulta de lectura que es como la interfaz
 *     del Senado busca; no existe variante GET.
 *  3. **Ritmo mínimo y UA identificable.** Este host no declara `robots.txt`;
 *     el WP del Senado impone `Crawl-delay: 120` a agentes genéricos. Se adopta
 *     el criterio más conservador: nunca se barre el corpus, cada función hace
 *     1–3 peticiones y el resultado se cachea con ventanas largas, así el ritmo
 *     efectivo queda muy por debajo de una petición cada dos minutos.
 *  4. **Una redirección es un fallo.** Con la sesión caída el servidor responde
 *     302 (o aterriza en `ErrorGeneral.htm`); las lecturas van con
 *     `redirect: "manual"` y tratan cualquier redirección como error, con un
 *     reintento que rehace la sesión desde cero.
 *
 * El caché de datos de Next no sirve aquí (URLs con nonce y cookie de sesión
 * variable rompen la clave), así que las funciones públicas se cachean con
 * `unstable_cache` sobre el resultado ya parseado.
 */

import { unstable_cache } from "next/cache";
import {
  desdeMayusculas,
  limpiarTexto,
  separarTitulo,
  type CondicionTono,
} from "@/lib/congreso";

const BASE = "https://sil.senadord.gob.do/wfilemaster";

const USER_AGENT =
  "GobiernoRD-Inteligencia/1.0 (monitoreo legislativo; herramienta independiente)";

const TIMEOUT_MS = 20_000;

/** El listado del consultante entrega 50 filas y no pagina por GET. */
export const SENADO_PAGE_SIZE = 50;

/* --------------------------------------------------------------- colecciones */

export interface Cuatrienio {
  /** Base de datos del FileMaster (`bd=`). */
  bd: string;
  /** Etiqueta legible y segmento de URL propio: `2024-2028`. */
  etiqueta: string;
  /** Id de la colección de iniciativas dentro de esa base. */
  coleccion: number;
  vigente?: boolean;
}

/** Las seis colecciones que la web del Senado enlaza, de hoy hacia atrás. */
export const CUATRIENIOS: Cuatrienio[] = [
  { bd: "C2024-2028", etiqueta: "2024-2028", coleccion: 53, vigente: true },
  { bd: "C2020-2024", etiqueta: "2020-2024", coleccion: 53 },
  { bd: "C2016-2020", etiqueta: "2016-2020", coleccion: 53 },
  { bd: "C2010-2016", etiqueta: "2010-2016", coleccion: 53 },
  { bd: "C2006-2010", etiqueta: "2006-2010", coleccion: 53 },
  { bd: "C2002-2006", etiqueta: "2002-2006", coleccion: 42 },
];

export const CUATRIENIO_VIGENTE = CUATRIENIOS[0];

export function cuatrienioPorEtiqueta(etiqueta: string | null | undefined): Cuatrienio | null {
  if (!etiqueta) return null;
  return CUATRIENIOS.find((c) => c.etiqueta === etiqueta) ?? null;
}

/* ------------------------------------------------------------------- fetch */

interface Sesion {
  cookie: string;
  /** URL del listado con el nonce que el consultante añadió. */
  listaUrl: string;
}

async function abrirSesion(cuatrienio: Cuatrienio): Promise<Sesion> {
  const destino = `lista_expedientes.aspx?coleccion=${cuatrienio.coleccion}`;
  const res = await fetch(
    `${BASE}/consultante.aspx?bd=${cuatrienio.bd}&url=${destino}`,
    {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  res.body?.cancel();

  const location = res.headers.get("location");
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""];
  const cookie = setCookies
    .map((c) => c.split(";")[0])
    .filter((c) => c.includes("="))
    .join("; ");

  if (res.status !== 302 || !location || !cookie) {
    throw new Error(`consultante.aspx respondió ${res.status} sin sesión`);
  }

  return { cookie, listaUrl: new URL(location, `${BASE}/`).toString() };
}

/** GET dentro de la sesión. Cualquier redirección o no-HTML es un fallo. */
async function senadoGet(sesion: Sesion, url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    headers: { "User-Agent": USER_AGENT, Cookie: sesion.cookie },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status !== 200) {
    res.body?.cancel();
    throw new Error(`el consultante respondió ${res.status} (sesión caída o ruta inexistente)`);
  }
  const tipo = res.headers.get("content-type") ?? "";
  if (!tipo.includes("text/html")) {
    res.body?.cancel();
    throw new Error(`content-type inesperado: ${tipo || "ninguno"}`);
  }
  return res.text();
}

/**
 * Postback de búsqueda: replica exactamente el formulario del consultante
 * (ViewState incluido). Es la única petición no-GET de toda la capa.
 */
async function senadoBuscarPost(sesion: Sesion, listaHtml: string, q: string): Promise<string> {
  const oculto = (nombre: string): string => {
    const m = new RegExp(`name="${nombre}"[^>]*value="([^"]*)"`).exec(listaHtml);
    if (!m) throw new Error(`el listado no trae ${nombre}; cambió el formulario`);
    return m[1];
  };

  const cuerpo = new URLSearchParams({
    __VIEWSTATE: oculto("__VIEWSTATE"),
    __VIEWSTATEGENERATOR: oculto("__VIEWSTATEGENERATOR"),
    __EVENTVALIDATION: oculto("__EVENTVALIDATION"),
    txtBuscar: q,
    "imgBtnIr.x": "8",
    "imgBtnIr.y": "8",
    cmbEstado: "-1",
    cmbOrden: "fc",
    Orden: "RBOrdenDes",
    CBExpCerrados: "on",
  });

  const res = await fetch(sesion.listaUrl, {
    method: "POST",
    redirect: "manual",
    cache: "no-store",
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: sesion.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: cuerpo.toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // Un postback rechazado redirige a ErrorGeneral.htm en vez de fallar.
  if (res.status !== 200) {
    res.body?.cancel();
    throw new Error(`la búsqueda respondió ${res.status}`);
  }
  return res.text();
}

/** Un reintento con sesión nueva, como el resto de las capas de datos. */
async function conReintento<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fn();
  }
}

/* ------------------------------------------------------------------ parseo */

/** El FileMaster mezcla texto plano con entidades numéricas y con nombre. */
function desentificar(valor: string): string {
  return valor
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function limpiar(valor: string | null | undefined): string {
  return limpiarTexto(desentificar(valor ?? ""));
}

/** `28/08/2026` → `2026-08-28`, o `null` si no tiene esa forma. */
function fechaIso(valor: string | null | undefined): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(limpiar(valor));
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export interface NumeroSenado {
  completo: string;
  secuencia: string | null;
  anio: number | null;
  /** `PLO` | `SLO` | `SLE` (extraordinaria) u otro código del origen. */
  tipoLegislatura: string | null;
}

/**
 * Descompone `01886-2026-SLO-SE`. Como en Diputados, es una **cita**, no una
 * identidad: la identidad estable es el `IdExpediente` interno por colección.
 */
export function parseNumeroSenado(numero: string | null | undefined): NumeroSenado | null {
  const completo = limpiar(numero);
  if (!completo) return null;
  const m = /^(\d+)-(\d{4})-([A-Z]{3})-SE$/i.exec(completo);
  if (!m) return { completo, secuencia: null, anio: null, tipoLegislatura: null };
  return {
    completo,
    secuencia: m[1],
    anio: Number(m[2]),
    tipoLegislatura: m[3].toUpperCase(),
  };
}

/**
 * Código de legislatura compatible con `parseLegislatura` de `lib/congreso`
 * (`2026-SLO`), o `null` para extraordinarias (`SLE`), que no tienen fechas
 * fijas de apertura y cierre.
 */
export function legislaturaDeNumero(numero: NumeroSenado | null): string | null {
  if (!numero?.anio || !numero.tipoLegislatura) return null;
  if (numero.tipoLegislatura !== "PLO" && numero.tipoLegislatura !== "SLO") return null;
  return `${numero.anio}-${numero.tipoLegislatura}`;
}

/** Tono visual del estado procesal del Senado, alineado con el de Diputados. */
export function tonoDeEstadoSenado(estado: string | null | undefined): CondicionTono {
  const e = limpiar(estado)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!e) return "neutro";
  if (e.includes("PERIMID")) return "perimido";
  if (e.includes("APROBAD") || e.includes("PROMULGAD") || e.includes("DESPACHADA")) {
    return "aprobado";
  }
  if (e.includes("RECHAZ") || e.includes("RETIR") || e.includes("DESECHA")) return "neutro";
  if (
    e.includes("DEPOSITADA") ||
    e.includes("AGENDA") ||
    e.includes("COMISION") ||
    e.includes("CONSIDERACION") ||
    e.includes("INFORME") ||
    e.includes("APLAZ") ||
    e.includes("MESA") ||
    e.includes("URGENCIA") ||
    e.includes("PLAZO")
  ) {
    return "vigente";
  }
  return "neutro";
}

export interface ExpedienteSenado {
  id: number;
  numero: NumeroSenado | null;
  tipo: string | null;
  /** Descripción del listado; el origen la trunca con `...`. */
  titulo: string;
  fechaCreacion: string | null;
  estado: string | null;
  tono: CondicionTono;
  cuatrienio: string;
}

export interface ListadoSenado {
  cuatrienio: string;
  /** Censo declarado por el origen para la consulta (no el tamaño de la página). */
  total: number;
  expedientes: ExpedienteSenado[];
}

const FILA_RE =
  /<td><a href='Ficha\.aspx\?IdExpediente=(\d+)[^']*'>([^<]*)<\/a><\/td><td><a[^>]*>([^<]*)<\/a><\/td><td><a[^>]*>([^<]*)<\/a><\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/g;

function parsearListado(html: string, cuatrienio: Cuatrienio): ListadoSenado {
  const totalM = /id="txttotalexp"[^>]*>.*?>(\d+)</s.exec(html);
  const expedientes: ExpedienteSenado[] = [];

  for (const m of html.matchAll(FILA_RE)) {
    const estado = limpiar(m[6]) || null;
    expedientes.push({
      id: Number(m[1]),
      numero: parseNumeroSenado(m[2]),
      tipo: limpiar(m[3]) || null,
      titulo: desdeMayusculas(limpiar(m[4])) || "(sin descripción)",
      fechaCreacion: fechaIso(m[5]),
      estado,
      tono: tonoDeEstadoSenado(estado),
      cuatrienio: cuatrienio.etiqueta,
    });
  }

  return {
    cuatrienio: cuatrienio.etiqueta,
    total: totalM ? Number(totalM[1]) : expedientes.length,
    expedientes,
  };
}

export interface EventoTramite {
  evento: string;
  /** ISO `yyyy-mm-dd`. */
  fecha: string | null;
}

/**
 * El historial llega como prosa: «Depositada el 11/8/2014. Enviada a Comisión
 * el 28/8/2014. …». Se separa en eventos fechados; si el texto no sigue ese
 * patrón, la ficha conserva el crudo.
 */
export function parsearHistorial(texto: string): EventoTramite[] {
  const eventos: EventoTramite[] = [];
  for (const m of texto.matchAll(/([^.]+?)\s+el\s+(\d{1,2}\/\d{1,2}\/\d{4})\.?/g)) {
    const evento = limpiarTexto(m[1]);
    if (evento) eventos.push({ evento, fecha: fechaIso(m[2]) });
  }
  return eventos;
}

export interface FichaSenado {
  id: number;
  cuatrienio: string;
  numero: NumeroSenado | null;
  titulo: string;
  tituloModificado: string | null;
  tipo: string | null;
  subtipo: string | null;
  /** Estado procesal que el consultante destaca en cabecera. */
  estadoActual: string | null;
  tono: CondicionTono;
  condicion: string | null;
  historial: EventoTramite[];
  historialCrudo: string | null;
  materia: string | null;
  comisiones: string | null;
  proponentes: string[];
  reintroducida: boolean | null;
  perimida: boolean | null;
  anotaciones: string | null;
  camaraInicial: string | null;
  poderOrigen: string | null;
  fechaRecibido: string | null;
  /** Código `2014-SLO`, apto para `parseLegislatura`. */
  legislaturaInicio: string | null;
  /** Cita del expediente gemelo en Diputados (`07162-2010-2016-CD`). */
  numeroDiputados: string | null;
  despachada: string | null;
  despachadaHacia: string | null;
  fechaPromulgacion: string | null;
  numPromulgacion: string | null;
  promulgada: boolean;
}

/** Valor de una celda de la ficha: textarea, input o la opción seleccionada. */
function valorDeCelda(celda: string): string {
  const ta = /<textarea[^>]*>([\s\S]*?)<\/textarea>/.exec(celda);
  if (ta) return limpiar(ta[1]);
  const inp = /<input[^>]*value="([^"]*)"/.exec(celda);
  if (inp) return limpiar(inp[1]);
  const sel = /<option selected="selected"[^>]*>([^<]*)<\/option>/.exec(celda);
  if (sel) {
    const v = limpiar(sel[1]);
    return v === "----------------" || v === "-1" ? "" : v;
  }
  return "";
}

/**
 * La ficha es el formulario del FileMaster en solo-lectura: filas
 * `etiqueta → control`. Se parsea por **etiqueta**, no por id de campo, porque
 * cada cuatrienio es una base distinta y los ids podrían divergir.
 */
function parsearFicha(html: string, cuatrienio: Cuatrienio, id: number): FichaSenado | null {
  const campos = new Map<string, string>();
  const FILA_FICHA_RE =
    /<tr[^>]*>\s*<td[^>]*><font face="Verdana">([^<]{2,80})<\/font><\/td>\s*<td[^>]*><font face="Verdana">([\s\S]*?)<\/font><\/td>\s*<\/tr>/g;
  for (const m of html.matchAll(FILA_FICHA_RE)) {
    const etiqueta = limpiar(m[1]);
    if (etiqueta && !campos.has(etiqueta)) campos.set(etiqueta, valorDeCelda(m[2]));
  }

  const campo = (etiqueta: string): string | null => campos.get(etiqueta) || null;

  const numero = parseNumeroSenado(campo("Número de Iniciativa"));
  if (!numero) return null; // sin número no hay expediente: id inexistente

  const spanEstado = /id="lbEstadoActual"[^>]*>([\s\S]*?)<\/span>/.exec(html);
  const estadoActual = spanEstado
    ? limpiar(spanEstado[1].replace(/<[^>]+>/g, " ")) || null
    : null;

  const { titulo, tituloModificado } = separarTitulo(
    campo("Descripción del Proyecto") ?? "(sin descripción)",
  );

  const historialCrudo = campo("Historial");
  const historial = historialCrudo ? parsearHistorial(historialCrudo) : [];

  const bool = (v: string | null): boolean | null =>
    v === null ? null : /^s[ií]$/i.test(v) ? true : /^no$/i.test(v) ? false : null;

  const fechaPromulgacion = fechaIso(campo("Promulgada"));
  const numPromulgacion = campo("Número de Promulgación");

  return {
    id,
    cuatrienio: cuatrienio.etiqueta,
    numero,
    titulo: desdeMayusculas(titulo),
    tituloModificado: tituloModificado ? desdeMayusculas(tituloModificado) : null,
    tipo: campo("Tipo de Iniciativa"),
    subtipo: campo("Subtipo de Iniciativa"),
    estadoActual,
    tono: tonoDeEstadoSenado(estadoActual ?? campo("Condición Actual")),
    condicion: campo("Condición Actual"),
    historial,
    historialCrudo,
    materia: campo("Materia") ? desdeMayusculas(campo("Materia")!) : null,
    comisiones: campo("Comisiones") ? desdeMayusculas(campo("Comisiones")!) : null,
    proponentes: (campo("Proponentes") ?? "")
      .split(/;|,(?=\s[A-ZÁÉÍÓÚÑ])/)
      .map((p) => limpiarTexto(p))
      .filter(Boolean),
    reintroducida: bool(campo("Reintroducida")),
    perimida: bool(campo("Perimida")),
    anotaciones: campo("Anotaciones Especiales"),
    camaraInicial: campo("Cámara Inicial"),
    poderOrigen: campo("Poder de Origen"),
    fechaRecibido: fechaIso(campo("Fecha de Recibido por El Senado")),
    legislaturaInicio: campo("Legislatura de Inicio"),
    numeroDiputados: campo("Número de Expediente Cámara Diputados"),
    despachada: fechaIso(campo("Despachada")),
    despachadaHacia: campo("Despachada Hacia"),
    fechaPromulgacion,
    numPromulgacion,
    promulgada: Boolean(fechaPromulgacion || numPromulgacion),
  };
}

/* --------------------------------------------------------------- consultas */

async function listarUpstream(etiqueta: string): Promise<ListadoSenado> {
  const cuatrienio = cuatrienioPorEtiqueta(etiqueta);
  if (!cuatrienio) throw new Error(`cuatrienio desconocido: ${etiqueta}`);
  return conReintento(async () => {
    const sesion = await abrirSesion(cuatrienio);
    const html = await senadoGet(sesion, sesion.listaUrl);
    return parsearListado(html, cuatrienio);
  });
}

async function buscarUpstream(etiqueta: string, q: string): Promise<ListadoSenado> {
  const cuatrienio = cuatrienioPorEtiqueta(etiqueta);
  if (!cuatrienio) throw new Error(`cuatrienio desconocido: ${etiqueta}`);
  return conReintento(async () => {
    const sesion = await abrirSesion(cuatrienio);
    const listaHtml = await senadoGet(sesion, sesion.listaUrl);
    const html = await senadoBuscarPost(sesion, listaHtml, q);
    return parsearListado(html, cuatrienio);
  });
}

async function fichaUpstream(etiqueta: string, id: number): Promise<FichaSenado | null> {
  const cuatrienio = cuatrienioPorEtiqueta(etiqueta);
  if (!cuatrienio) throw new Error(`cuatrienio desconocido: ${etiqueta}`);
  return conReintento(async () => {
    const sesion = await abrirSesion(cuatrienio);
    const html = await senadoGet(
      sesion,
      `${BASE}/Ficha.aspx?IdExpediente=${id}&Coleccion=${cuatrienio.coleccion}`,
    );
    return parsearFicha(html, cuatrienio, id);
  });
}

// Ventanas: el listado vigente se mueve a diario (15 min le sobra); búsquedas
// y fichas cambian aún menos (1 h). Los fallos lanzan y NO se cachean.
const listarCached = unstable_cache(listarUpstream, ["senado-lista"], { revalidate: 900 });
const buscarCached = unstable_cache(buscarUpstream, ["senado-busqueda"], { revalidate: 3600 });
const fichaCached = unstable_cache(fichaUpstream, ["senado-ficha"], { revalidate: 3600 });

/** Los 50 expedientes más recientes de una colección, con su censo. */
export async function listarRecientesSenado(
  etiqueta: string = CUATRIENIO_VIGENTE.etiqueta,
): Promise<ListadoSenado | null> {
  try {
    return await listarCached(etiqueta);
  } catch (err) {
    console.error(`[senado] lista ${etiqueta}: ${String(err)}`);
    return null;
  }
}

/**
 * Búsqueda del consultante: subcadena **literal y sensible a tildes** sobre la
 * descripción («código» no encuentra «codigo»). Devuelve hasta 50 filas; el
 * `total` declara cuántas hay en realidad.
 */
export async function buscarExpedientesSenado(
  etiqueta: string,
  q: string,
): Promise<ListadoSenado | null> {
  const consulta = limpiarTexto(q);
  if (!consulta) return listarRecientesSenado(etiqueta);
  try {
    return await buscarCached(etiqueta, consulta);
  } catch (err) {
    console.error(`[senado] búsqueda "${consulta}" ${etiqueta}: ${String(err)}`);
    return null;
  }
}

/** Ficha completa de un expediente. `null` si no existe o el origen no responde. */
export async function getFichaSenado(
  etiqueta: string,
  id: number,
): Promise<FichaSenado | null> {
  try {
    return await fichaCached(etiqueta, id);
  } catch (err) {
    console.error(`[senado] ficha ${etiqueta}/${id}: ${String(err)}`);
    return null;
  }
}

/** Censo de expedientes del cuatrienio vigente (comparte caché con el listado). */
export async function getCensoSenado(): Promise<number | null> {
  const listado = await listarRecientesSenado();
  return listado?.total ?? null;
}
