import { NextResponse } from "next/server";
import {
  CUENTA_UNICA,
  CUENTA_UNICA_CLIENT_ID,
  RUTA_CALLBACK,
  cuentaUnicaHabilitada,
} from "../cliente";

/**
 * Canje del código de autorización por el ID token, en el servidor.
 *
 * Es el único salto servidor → Cuenta Única, y existe por una razón de
 * transporte, no de confianza: el endpoint de token de Hydra no está
 * verificado para CORS desde el navegador. No hay secreto que guardar (cliente
 * público, auth `none`); lo que se envía es exactamente lo que el navegador
 * enviaría. Devuelve **solo** el `id_token`: el access y el refresh token no
 * se necesitan y no se reenvían. La verificación criptográfica del ID token
 * ocurre en la Edge Function, nunca aquí.
 */

export const dynamic = "force-dynamic";

const UA = "Socratico-Inteligencia/1.0 (identidad ciudadana; herramienta independiente)";
const CODIGO = /^[A-Za-z0-9._~-]{8,2048}$/;
const VERIFICADOR = /^[A-Za-z0-9._~-]{43,128}$/;

function fallo(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  if (!cuentaUnicaHabilitada()) return fallo("cliente_no_configurado", 503);

  let cuerpo: { code?: unknown; code_verifier?: unknown; redirect_uri?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return fallo("parametros", 400);
  }
  const { code, code_verifier: verificador, redirect_uri: redirectUri } = cuerpo;
  if (typeof code !== "string" || !CODIGO.test(code)) return fallo("parametros", 400);
  if (typeof verificador !== "string" || !VERIFICADOR.test(verificador)) return fallo("parametros", 400);
  if (typeof redirectUri !== "string" || !redirectUriValida(redirectUri, origenDe(req))) return fallo("parametros", 400);

  const forma = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: CUENTA_UNICA_CLIENT_ID,
    code_verifier: verificador,
  });

  try {
    const res = await fetch(CUENTA_UNICA.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": UA,
      },
      body: forma,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const datos = (await res.json().catch(() => null)) as
      | { id_token?: unknown; error?: unknown }
      | null;
    if (!res.ok || typeof datos?.id_token !== "string") {
      // Solo el código de error de OAuth, nunca el cuerpo entero.
      const codigo = typeof datos?.error === "string" ? datos.error : "canje_rechazado";
      return fallo(codigo.replace(/[^a-z_]/gi, "").slice(0, 40) || "canje_rechazado", 502);
    }
    return NextResponse.json({ ok: true, id_token: datos.id_token });
  } catch {
    return fallo("emisor_no_contesto", 502);
  }
}

/** El origen con el que el navegador nos ve (Vercel pone el host en `x-forwarded-host`). */
function origenDe(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Solo la ruta de vuelta de **este** origen. Hydra ya rechaza cualquier
 * `redirect_uri` no registrada; esto evita además que la ruta sirva de relé
 * para el cliente de otro sitio.
 */
function redirectUriValida(valor: string, origen: string): boolean {
  try {
    const u = new URL(valor);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) return false;
    if (u.origin !== origen) return false;
    return u.pathname === RUTA_CALLBACK && u.search === "" && u.hash === "";
  } catch {
    return false;
  }
}
