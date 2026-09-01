/**
 * Lectura de una iniciativa: de metadatos a lenguaje llano.
 *
 * Ni el SIL de Diputados ni el consultante del Senado publican una sinopsis:
 * el único texto descriptivo es el **título** —que en la técnica legislativa
 * dominicana es autodescriptivo— más el historial de trámites. Este módulo
 * exprime ese título sin inventar nada:
 *
 *  1. Lo parte en **objeto** («Ley General de Alianzas Público-Privada») y
 *     **efectos** («mediante la cual se deroga la Ley núm. 47-20»), que es la
 *     forma canónica del enunciado: `<instrumento> <objeto>, <cláusula>`.
 *  2. Extrae las **normas citadas** con su relación (deroga / modifica / …).
 *     Ahí está la carga informativa real: qué del ordenamiento vigente toca
 *     esta pieza. `lib/normativa.ts` resuelve esas citas al texto oficial.
 *  3. Traduce el **instrumento** y la **condición** procesal a una frase que
 *     se entienda sin ser abogado.
 *
 * Nada de esto es interpretación editorial: son reglas sobre la propia
 * redacción oficial, y el título original queda siempre a la vista.
 */

import { limpiarTexto } from "@/lib/congreso";

/* ------------------------------------------------------------ referencias */

export type RelacionNorma =
  | "deroga"
  | "modifica"
  | "sustituye"
  | "adiciona"
  | "reforma"
  | "cita";

export interface ReferenciaNorma {
  /** Qué le hace la iniciativa a esa norma, según el propio título. */
  relacion: RelacionNorma;
  /** «Ley», «Decreto», «Reglamento», «Resolución», «Código», «Constitución». */
  tipo: string;
  /** Número normativo dominicano: `47-20`, `176-07`. `null` en la Constitución. */
  numero: string | null;
  /** Etiqueta lista para mostrar: «Ley 47-20». */
  etiqueta: string;
}

const VERBOS: Array<{ re: RegExp; relacion: RelacionNorma }> = [
  { re: /\b(deroga|abroga|derogatoria|deroguen?)\b/i, relacion: "deroga" },
  { re: /\b(modifica|modificatoria|modifiquen?|enmienda)\b/i, relacion: "modifica" },
  { re: /\b(sustituy[ea]|reemplaza)\b/i, relacion: "sustituye" },
  { re: /\b(adiciona|agrega|a[ñn]ade|incorpora)\b/i, relacion: "adiciona" },
  { re: /\b(reforma)\b/i, relacion: "reforma" },
];

/** Cómo se lee cada relación en la ficha. */
export const ETIQUETA_RELACION: Record<RelacionNorma, string> = {
  deroga: "Deroga",
  modifica: "Modifica",
  sustituye: "Sustituye",
  adiciona: "Adiciona",
  reforma: "Reforma",
  cita: "Cita",
};

const TIPOS_NORMA = "Ley|Leyes|Decreto|Reglamento|Resoluci[oó]n|C[oó]digo";

/**
 * Normas citadas en el texto, con la relación que el propio enunciado declara.
 *
 * El verbo se busca **hacia atrás** desde la cita porque la fórmula dominicana
 * lo antepone: «…, mediante la cual se **deroga** la Ley núm. 47-20». Si no hay
 * verbo en esa ventana, la relación queda en `cita` — nunca se supone.
 */
export function referenciasNormativas(texto: string): ReferenciaNorma[] {
  const limpio = limpiarTexto(texto);
  if (!limpio) return [];

  const vistas = new Set<string>();
  const refs: ReferenciaNorma[] = [];

  const re = new RegExp(
    `\\b(${TIPOS_NORMA})\\b[\\s,]*(?:n[uú]m(?:ero|\\.)?|no\\.?|n[°º])?\\s*(\\d{1,4}\\s*-\\s*\\d{2,4})`,
    "gi",
  );

  for (const m of limpio.matchAll(re)) {
    const numero = m[2].replace(/\s+/g, "");
    const tipo = normalizarTipoNorma(m[1]);
    const clave = `${tipo}|${numero}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);

    refs.push({
      relacion: relacionAntesDe(limpio, m.index),
      tipo,
      numero,
      etiqueta: `${tipo} ${numero}`,
    });
  }

  // La Constitución se cita sin número.
  if (/\bConstituci[oó]n\b/i.test(limpio) && !vistas.has("Constitución|")) {
    const idx = limpio.search(/\bConstituci[oó]n\b/i);
    refs.push({
      relacion: relacionAntesDe(limpio, idx),
      tipo: "Constitución",
      numero: null,
      etiqueta: "Constitución de la República",
    });
  }

  return refs;
}

/**
 * Verbo que gobierna una cita: el **más cercano** hacia atrás, no el primero
 * de la lista. «…deroga la Ley 189-11 y modifica el Decreto 95-12» tiene dos
 * verbos y cada cita se queda con el suyo.
 */
function relacionAntesDe(texto: string, posicion: number): RelacionNorma {
  const antes = texto.slice(Math.max(0, posicion - 90), posicion);
  let mejor: RelacionNorma = "cita";
  let mejorPos = -1;
  for (const { re, relacion } of VERBOS) {
    const global = new RegExp(re.source, "gi");
    for (const m of antes.matchAll(global)) {
      if (m.index > mejorPos) {
        mejorPos = m.index;
        mejor = relacion;
      }
    }
  }
  return mejor;
}

function normalizarTipoNorma(bruto: string): string {
  const t = bruto.toLowerCase();
  if (t.startsWith("ley")) return "Ley";
  if (t.startsWith("decreto")) return "Decreto";
  if (t.startsWith("reglamento")) return "Reglamento";
  if (t.startsWith("resoluci")) return "Resolución";
  if (t.startsWith("c")) return "Código";
  return bruto;
}

/**
 * Número normativo dentro de un texto libre.
 *
 * Cada cámara escribe la promulgación a su manera —el Senado guarda `136-15`
 * pelado y Diputados `Ley núm. 43-26`—, así que se extrae la forma canónica
 * antes de buscarla en la Consultoría.
 */
export function numeroDeNorma(valor: string | null | undefined): string | null {
  const m = /(\d{1,4})\s*-\s*(\d{2,4})/.exec(valor ?? "");
  return m ? `${m[1]}-${m[2]}` : null;
}

/* ------------------------------------------------- instrumento y condición */

/** Qué es la pieza, en una frase. */
export function queEs(tipo: string | null | undefined): string | null {
  const t = (tipo ?? "").toLowerCase();
  if (!t) return null;
  if (t.includes("ley")) {
    return "Una propuesta de ley. Para convertirse en ley de la República debe aprobarla el Senado, aprobarla la Cámara de Diputados en los mismos términos y promulgarla el Presidente.";
  }
  if (t.includes("resoluci")) {
    return "Una resolución: un pronunciamiento de la cámara —reconocimientos, solicitudes de información al Ejecutivo, aprobación de contratos o acuerdos internacionales—. No crea normas de alcance general.";
  }
  if (t.includes("observaci")) {
    return "Una observación del Poder Ejecutivo: el Presidente devolvió la pieza a la cámara con reparos en lugar de promulgarla. El Congreso puede acogerlos o insistir.";
  }
  if (t.includes("contrato") || t.includes("acuerdo") || t.includes("convenio")) {
    return "Un contrato o acuerdo sometido a aprobación congresual: sin ese voto no puede ejecutarse.";
  }
  return null;
}

/**
 * Qué significa el estado procesal y qué viene después. Solo se traduce lo que
 * la propia taxonomía dice; los estados que no reconocemos se muestran crudos.
 */
export function queSigue(condicion: string | null | undefined): string | null {
  const c = (condicion ?? "").toLowerCase();
  if (!c) return null;

  // Terminales primero: ganan a cualquier estado intermedio que las contenga.
  if (c.includes("promulgad")) return "Completó el trámite: es ley vigente.";
  if (c.includes("perimid")) {
    return "Perimió: se agotaron las dos legislaturas de vigencia sin completar el trámite. Para revivirla hay que volver a depositarla desde cero.";
  }
  if (c.includes("retirad")) return "Fue retirada por quien la propuso.";
  if (c.includes("rechazad")) return "Fue rechazada.";
  if (c.includes("archivad")) return "Fue archivada: el trámite se cerró sin convertirla en ley.";

  if (c.includes("depositad")) {
    return "Fue registrada en la secretaría. El siguiente paso es su lectura en sesión y el envío a comisión.";
  }
  if (c.includes("agenda") || c.includes("consideraci")) {
    return "Está en la agenda de la sesión: la cámara debe tomarla en consideración antes de enviarla a comisión.";
  }
  if (c.includes("comisi")) {
    return "Está en comisión: es la etapa donde se estudia, se convoca a las partes y se redacta el informe. La mayoría de las piezas muere aquí, sin informe.";
  }
  if (c.includes("informe")) {
    return "La comisión ya rindió informe. Vuelve al pleno, que decide si lo acoge y la vota.";
  }
  if (c.includes("mesa")) {
    return "Quedó sobre la mesa: el pleno aplazó la decisión sin rechazarla.";
  }
  if (c.includes("primera lectura") || c.includes("primera con") || c.includes("1ra")) {
    return "Pasó su primera lectura. Falta la segunda en esta misma cámara antes de viajar a la otra.";
  }
  if (c.includes("segunda lectura") || c.includes("segunda con") || c.includes("2da")) {
    return "Aprobada en segunda lectura por esta cámara. Pasa a la otra, que puede aprobarla igual, modificarla o dejarla morir.";
  }
  if (c.includes("devuelt")) {
    return "La otra cámara la devolvió con modificaciones: esta debe decidir si las acoge.";
  }
  if (c.includes("despachad")) {
    return "Ya salió de esta cámara: siguió hacia la otra o hacia el Poder Ejecutivo.";
  }
  if (c.includes("transcripci") || c.includes("auditor") || c.includes("firmas")) {
    return "Está en trámite administrativo interno —transcripción, revisión y firmas— antes de despacharla.";
  }
  if (c.includes("observ")) {
    return "El Poder Ejecutivo la observó: vuelve al Congreso, que decide si acoge los reparos o insiste.";
  }
  if (c.includes("aprobad")) {
    return "Aprobada en esta cámara. Todavía necesita el voto de la otra en los mismos términos y la promulgación del Presidente.";
  }
  return null;
}
