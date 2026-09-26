/**
 * El contrato de lectura de la casa (`.claude/rules/fuentes.md`), escrito una
 * vez: User-Agent identificable, 25 s de espera, **un** reintento y el
 * `content-type` validado —un 200 puede ser la cáscara de una SPA o la página
 * de un WAF—. Opcionalmente, la forma del JSON validada con `zod`.
 *
 * Estaba copiado en quince capas, cada una con su variante: unas reintentaban
 * un tipo equivocado y otras no, unas leían el cuerpo dentro del reintento y
 * otras fuera. Aquí la política es una y está dicha:
 *
 *  · se reintenta una vez un fallo de red, un plazo vencido, un estado que no
 *    es 2xx o un cuerpo que no se pudo leer;
 *  · **no** se reintenta lo que no mejora repitiendo: un `content-type`
 *    equivocado, una firma de archivo que no casa o un JSON con otra forma.
 *
 * Dos sabores: `…OLanzar` lanza `FalloLectura` (para las capas que distinguen
 * la caída dentro de un `unstable_cache`, que no guarda excepciones), y el
 * resto devuelve `null` y deja una línea en el registro.
 *
 * Fuera de aquí, a propósito: la sesión del consultante del Senado
 * (`lib/senado.ts`: redirección manual, cookie y postback con ViewState, un
 * protocolo propio) y las peticiones HEAD que solo miran el peso de un
 * documento.
 */

import type { ZodType } from "zod";

export interface Pedido {
  /** La etiqueta del registro: «deuda» → `[deuda] …`. */
  fuente: string;
  /** El User-Agent completo de la capa (`Socratico-Inteligencia/1.0 (…)`). */
  ua: string;
  /** El `content-type` que tiene que traer la respuesta. */
  tipo: RegExp;
  /** Ventana de la caché de datos de Next. Sin ella, `cache` decide. */
  revalidate?: number;
  cache?: RequestCache;
  /** Por defecto 25 s. */
  espera?: number;
  /** Por defecto 2: el intento y un reintento. */
  intentos?: number;
  metodo?: "GET" | "POST";
  cuerpo?: string;
  cabeceras?: Record<string, string>;
  /** Un XLSX (ZIP) empieza por «PK»: si no, es una página de error con 200. */
  firma?: "zip";
}

/** Una lectura que no se pudo hacer. `definitivo`: repetirla no ayudaría. */
export class FalloLectura extends Error {
  readonly definitivo: boolean;
  readonly estado: number | undefined;
  constructor(mensaje: string, definitivo = false, estado?: number) {
    super(mensaje);
    this.name = "FalloLectura";
    this.definitivo = definitivo;
    this.estado = estado;
  }
}

/**
 * El estado y, si lo hay, el veredicto de Cloudflare (`cf-mitigated:
 * challenge` es un bloqueo del WAF, no una caída —y no se rodea: se gestiona,
 * docs/AUDITORIA.md—) y el servidor que respondió.
 */
function motivo(res: Response): string {
  const cf = res.headers.get("cf-mitigated");
  const servidor = res.headers.get("server");
  return [String(res.status), cf && `cf-mitigated=${cf}`, servidor && `server=${servidor}`]
    .filter(Boolean)
    .join(" ");
}

async function conContrato<T>(url: string, p: Pedido, leer: (res: Response) => Promise<T>): Promise<T> {
  const intentos = p.intentos ?? 2;
  let ultimo: unknown;
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      const res = await fetch(url, {
        method: p.metodo ?? "GET",
        headers: { "User-Agent": p.ua, ...p.cabeceras },
        body: p.cuerpo,
        ...(p.revalidate !== undefined ? { next: { revalidate: p.revalidate } } : {}),
        ...(p.cache ? { cache: p.cache } : {}),
        signal: AbortSignal.timeout(p.espera ?? 25_000),
      });
      if (!res.ok) {
        res.body?.cancel();
        throw new FalloLectura(`respondió ${motivo(res)}`, false, res.status);
      }
      const ct = res.headers.get("content-type") ?? "";
      if (!p.tipo.test(ct)) {
        res.body?.cancel();
        throw new FalloLectura(`content-type inesperado «${ct || "ninguno"}»`, true, res.status);
      }
      return await leer(res);
    } catch (err) {
      ultimo = err;
      if (err instanceof FalloLectura && err.definitivo) break;
    }
  }
  throw ultimo instanceof FalloLectura ? ultimo : new FalloLectura(String(ultimo));
}

function validar<T>(datos: unknown, esquema: ZodType<T> | undefined): T {
  if (!esquema) return datos as T;
  const r = esquema.safeParse(datos);
  if (r.success) return r.data;
  const i = r.error.issues[0];
  throw new FalloLectura(`el JSON cambió de forma: ${i?.path.join(".") || "(raíz)"} ${i?.message ?? ""}`.trim(), true);
}

async function bytes(res: Response, p: Pedido): Promise<ArrayBuffer> {
  const buf = await res.arrayBuffer();
  if (p.firma === "zip" && new Uint8Array(buf.slice(0, 2)).join() !== "80,75") {
    throw new FalloLectura("no es un archivo XLSX (no empieza por «PK»)", true);
  }
  return buf;
}

export function pedirJsonOLanzar<T>(url: string, p: Pedido & { esquema?: ZodType<T> }): Promise<T> {
  return conContrato(url, p, async (res) => validar(await res.json(), p.esquema));
}

export function pedirTextoOLanzar(url: string, p: Pedido): Promise<string> {
  return conContrato(url, p, (res) => res.text());
}

function anotar(p: Pedido, url: string, err: unknown): null {
  console.error(`[${p.fuente}] ${url}: ${err instanceof Error ? err.message : String(err)}`);
  return null;
}

/** JSON validado, o `null` con su línea en el registro. */
export async function pedirJson<T>(url: string, p: Pedido & { esquema?: ZodType<T> }): Promise<T | null> {
  try {
    return await pedirJsonOLanzar(url, p);
  } catch (err) {
    return anotar(p, url, err);
  }
}

/** Texto (HTML, XML), o `null` con su línea en el registro. */
export async function pedirTexto(url: string, p: Pedido): Promise<string | null> {
  try {
    return await pedirTextoOLanzar(url, p);
  } catch (err) {
    return anotar(p, url, err);
  }
}

/** Bytes (un XLSX), o `null` con su línea en el registro. */
export async function pedirBytes(url: string, p: Pedido): Promise<ArrayBuffer | null> {
  try {
    return await conContrato(url, p, (res) => bytes(res, p));
  } catch (err) {
    return anotar(p, url, err);
  }
}
