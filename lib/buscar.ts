/**
 * El atajo del buscador de toda la plataforma (`/buscar`): **reconocer la
 * forma** de lo tecleado y llevar directo. Un RNC o una cédula es un
 * proveedor; «Ley 47-20» es una norma; `MOPC-CCC-LPN-2025-0010` es un
 * proceso; unas siglas exactas son una institución.
 *
 * Lo que no tiene forma lo ordena el índice de `lib/busqueda.ts` (por palabra
 * y por tema, sobre las instantáneas); lo que exige barrer una API entera
 * (licitaciones, Senado) se ofrece como enlace con su alcance, no se finge.
 */

import { INSTITUCIONES, hrefInstitucion } from "@/lib/instituciones";
import { normalize } from "@/lib/dgcp";
import { enlace } from "@/lib/grafo";

const RUTA_NORMA: Record<string, string> = {
  ley: "ley",
  decreto: "decreto",
  reglamento: "reglamento",
  resolucion: "resolucion",
};

/** Si lo tecleado tiene una forma inequívoca, la ruta a la que lleva. */
export function rutaDirecta(consulta: string): string | null {
  const q = consulta.trim();
  const digitos = q.replace(/[\s-]/g, "");

  // RNC (9 dígitos) o cédula (11): el registro de proveedores busca por ambos.
  if (/^\d{9}$|^\d{11}$/.test(digitos)) return `/proveedores?q=${digitos}`;

  // «Ley 47-20», «decreto núm. 606-26», «Resolución No. 12-2025».
  const cita = /^(ley|decreto|reglamento|resoluci[oó]n)\s*(?:n[uú]m(?:ero)?\.?|no\.?|n\.?\s*[oº°]\.?)?\s*(\d{1,4}-\d{2,4})$/i.exec(
    q,
  );
  if (cita) return enlace.norma(RUTA_NORMA[normalize(cita[1])], cita[2]);

  // Código de proceso de la DGCP: SIGLAS-XXX-MOD-AAAA-NNNN.
  if (/^[A-Z0-9]{2,15}(-[A-Z0-9]{1,10}){2,4}-\d{4}-\d{3,5}$/i.test(q)) {
    return enlace.proceso(q.toUpperCase());
  }

  // Siglas exactas de una sola institución, solo si son siglas de verdad.
  // Varias unidades de compra usan una palabra como «acrónimo» —TRABAJO,
  // CULTURA, PASAPORTES—: quien teclea «trabajo» busca leyes o plazas, no
  // necesariamente el ministerio. Si las «siglas» son una palabra de su propio
  // nombre, no se salta: la institución sale primera en los resultados.
  const siglas = INSTITUCIONES.filter(
    (i) => i.acronimo && normalize(i.acronimo) === normalize(q),
  );
  const esPalabraDelNombre = (i: (typeof siglas)[number]) =>
    normalize(i.nombre).split(/[^a-z0-9]+/).includes(normalize(i.acronimo));
  if (siglas.length === 1 && q.length >= 2 && !esPalabraDelNombre(siglas[0])) {
    return hrefInstitucion(siglas[0]);
  }

  return null;
}
