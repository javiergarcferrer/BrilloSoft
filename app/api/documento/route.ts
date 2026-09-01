import { ORIGENES_DOCUMENTO, esUrlDeDocumento } from "@/lib/documentos";

export const dynamic = "force-dynamic";

/** Tope para una lectura completa. Con `Range` no aplica: se pide a trozos. */
const LIMITE_BYTES = 40 * 1024 * 1024;

/**
 * Lectura de un documento público cuyo origen impide leerlo en su sitio.
 *
 * Ninguna de las fuentes envía CORS, así que el lector —que dibuja el PDF en
 * un canvas para que se vea igual en móvil y en escritorio— no puede leerlas
 * directamente. Esta ruta vuelve a servir **los mismos bytes** desde el mismo
 * origen, con disposición `inline`.
 *
 * Soporta `Range`: el SIL del Senado responde 206, así que un escaneo de 30 MB
 * se lee por trozos y el lector solo descarga las páginas que se miran.
 *
 * Restricciones deliberadas:
 *  - Solo orígenes de la lista blanca (`lib/documentos.ts`): no es un proxy
 *    abierto.
 *  - Tope de tamaño en la lectura completa; sin cookies ni cabeceras del
 *    visitante hacia el origen.
 *
 * Los enlaces de «abrir» y «descargar» de la interfaz siguen apuntando al
 * archivo original: esto es una ayuda de lectura, no una copia autoritativa.
 */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";

  if (!esUrlDeDocumento(url)) {
    return Response.json(
      { error: "origen no permitido", origenes: ORIGENES_DOCUMENTO },
      { status: 400 },
    );
  }

  // El `Range` del lector se reenvía tal cual; nada más del visitante viaja.
  const rango = request.headers.get("range");
  const cabeceras: Record<string, string> = {
    "User-Agent":
      "Socratico-Inteligencia/1.0 (lectura de documento público; herramienta independiente)",
  };
  if (rango) cabeceras.Range = rango;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: cabeceras,
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[documento] ${url}: ${String(err)}`);
    return Response.json({ error: "el origen no respondió" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { error: `el origen respondió ${upstream.status}` },
      { status: 502 },
    );
  }

  const tipo = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!/^(application\/pdf|image\/|text\/plain)/i.test(tipo)) {
    return Response.json({ error: `tipo no legible: ${tipo}` }, { status: 415 });
  }

  const largo = Number(upstream.headers.get("content-length"));
  if (upstream.status !== 206 && Number.isFinite(largo) && largo > LIMITE_BYTES) {
    return Response.json(
      { error: "el documento excede el tope de lectura", bytes: largo },
      { status: 413 },
    );
  }

  const salida: Record<string, string> = {
    "Content-Type": tipo,
    "Content-Disposition": "inline",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
    "X-Content-Type-Options": "nosniff",
    // Sin esto el lector no puede pedir trozos y se traga el archivo entero.
    "Accept-Ranges": upstream.headers.get("accept-ranges") ?? "none",
  };
  const rangoRespuesta = upstream.headers.get("content-range");
  if (rangoRespuesta) salida["Content-Range"] = rangoRespuesta;
  if (Number.isFinite(largo) && largo > 0) salida["Content-Length"] = String(largo);

  return new Response(upstream.body, { status: upstream.status, headers: salida });
}
