import { ORIGENES_DOCUMENTO, esUrlDeDocumento } from "@/lib/documentos";

export const dynamic = "force-dynamic";

const LIMITE_BYTES = 25 * 1024 * 1024;

/**
 * Lectura de un documento público cuyo origen impide leerlo en su sitio.
 *
 * Los pliegos de la DGCP son PDF públicos, pero su servidor los manda con
 * `Content-Disposition: attachment` y un `frame-ancestors` que solo admite a
 * comprasdominicana: el navegador los descarga en vez de mostrarlos y no se
 * pueden incrustar. Esta ruta vuelve a servir **los mismos bytes** con
 * disposición `inline` para que se puedan leer sin descargar nada.
 *
 * Restricciones deliberadas:
 *  - Solo orígenes de la lista blanca (`lib/documentos.ts`): no es un proxy
 *    abierto.
 *  - Tope de tamaño; lo que pase de ahí se lee en el origen.
 *  - Sin cookies ni cabeceras del visitante hacia el origen.
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

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Socratico-Inteligencia/1.0 (lectura de documento público; herramienta independiente)",
      },
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
  if (Number.isFinite(largo) && largo > LIMITE_BYTES) {
    return Response.json(
      { error: "el documento excede el tope de lectura", bytes: largo },
      { status: 413 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": tipo,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
