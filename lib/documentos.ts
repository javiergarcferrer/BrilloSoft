/**
 * Orígenes cuyos documentos la plataforma puede volver a servir para lectura.
 *
 * `/api/documento` no es un proxy abierto: solo repite bytes de estos hosts
 * del Estado dominicano, y solo porque publican documentos públicos de una
 * forma que el navegador no deja leer en el sitio (descarga forzada o
 * `frame-ancestors` cerrado). Añadir un host aquí es una decisión consciente.
 */
export const ORIGENES_DOCUMENTO = [
  "comunidad.comprasdominicana.gob.do",
  "www.consultoria.gov.do",
  "consultoria.gov.do",
] as const;

export function esUrlDeDocumento(valor: string): boolean {
  try {
    const url = new URL(valor);
    return (
      url.protocol === "https:" &&
      (ORIGENES_DOCUMENTO as readonly string[]).includes(url.hostname)
    );
  } catch {
    return false;
  }
}

/** URL de lectura para un documento de un origen permitido. */
export function urlDeLectura(url: string): string {
  return `/api/documento?url=${encodeURIComponent(url)}`;
}

/**
 * Peso y tipo declarados por el origen, para no abrir un visor a ciegas.
 * Degrada a `null`: un documento sin cabeceras se muestra igual, sin peso.
 */
export async function pesoDocumento(
  url: string,
): Promise<{ tipo: string | null; bytes: number | null } | null> {
  if (!esUrlDeDocumento(url)) return null;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "GobiernoRD-Inteligencia/1.0 (lectura de documento público; herramienta independiente)",
      },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const largo = Number(res.headers.get("content-length"));
    return {
      tipo: res.headers.get("content-type"),
      bytes: Number.isFinite(largo) && largo > 0 ? largo : null,
    };
  } catch {
    return null;
  }
}
