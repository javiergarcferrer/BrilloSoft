/**
 * La aritmética de una cifra que se muestra a un ciudadano.
 *
 * Regla importada de la doctrina de RosetSoft (§7 de su `design-system.md`):
 * **un número solo no significa nada; una comparación sí — y no puedes
 * inventarla.** «RD$1,986,088,830» es una cadena. «RD$1,986,088,830 en juego
 * en 381 procesos abiertos hoy» es un hecho sobre el que alguien puede actuar.
 *
 * En una plataforma de transparencia la segunda mitad de la regla pesa más que
 * la primera: si no tenemos el ancla, se muestra la cifra sin ella y se dice
 * por qué. Nunca se fabrica un contexto que la fuente no da.
 */

/** De dónde sale una cifra. Determina qué se puede afirmar con ella. */
export type Alcance =
  /** Censo declarado por el origen: se puede sumar, dividir y comparar. */
  | "registro"
  /** Barrido acotado: NO se puede usar como denominador de nada. */
  | "muestra"
  /** Instantánea commiteada porque el origen no responde desde la nube. */
  | "instantanea";

export interface Ancla {
  alcance: Alcance;
  /** Sobre cuántos registros se calculó, cuando es una muestra. */
  escaneados?: number;
  /** Cuántos hay en total, si el origen lo declara. */
  universo?: number;
  /** A qué momento corresponde: «jul-26», «últimos 30 días». */
  periodo?: string;
}

/**
 * La línea que acompaña a la cifra. Devuelve `null` cuando no hay nada honesto
 * que decir — y entonces la interfaz no escribe nada, que es mejor que
 * escribir un contexto inventado.
 */
export function textoAncla(ancla: Ancla | undefined): string | null {
  if (!ancla) return null;
  const partes: string[] = [];

  if (ancla.alcance === "muestra") {
    partes.push(
      ancla.escaneados && ancla.universo
        ? `muestra de ${fmt(ancla.escaneados)} de ${fmt(ancla.universo)}`
        : ancla.escaneados
          ? `muestra de ${fmt(ancla.escaneados)}`
          : "muestra acotada",
    );
  }
  if (ancla.alcance === "instantanea") partes.push("instantánea verificada");
  if (ancla.periodo) partes.push(ancla.periodo);

  return partes.length > 0 ? partes.join(" · ") : null;
}

/** ¿Esta cifra admite ser el denominador de un porcentaje? Solo el censo. */
export function comparable(ancla: Ancla | undefined): boolean {
  return ancla?.alcance === "registro";
}

/**
 * Variación entre dos períodos, con las tres cosas que la doctrina prohíbe
 * hacer mal:
 *
 *  1. **Crecer desde cero no es un porcentaje.** 0 → 40 no es +∞% ni +100%:
 *     no tiene porcentaje. Se devuelve `pct: null` y se muestra el absoluto.
 *  2. **La dirección no es valencia.** Que la deuda suba no es «bueno» porque
 *     el número creció. Quien pinta decide el tono, no esta función.
 *  3. **Una variación de un porcentaje se mide en puntos**, no en por ciento.
 */
export function variacion(
  actual: number,
  anterior: number | null | undefined,
): { abs: number; pct: number | null } | null {
  if (anterior == null || !Number.isFinite(anterior)) return null;
  const abs = actual - anterior;
  if (anterior === 0) return { abs, pct: null };
  return { abs, pct: (abs / Math.abs(anterior)) * 100 };
}

/** Variación entre dos porcentajes: se dice en puntos («pp»), nunca en «%». */
export function puntos(actualPct: number, anteriorPct: number): string {
  const d = actualPct - anteriorPct;
  return `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} pp`;
}

function fmt(n: number): string {
  return n.toLocaleString("es-DO");
}
