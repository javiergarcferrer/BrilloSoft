/**
 * Vocabulario visual de los estados de un proceso de la DGCP y de la urgencia
 * del plazo de cierre.
 *
 * Centralizado para que la tarjeta, la cabecera del detalle y cualquier vista
 * futura hablen el mismo idioma. Las etiquetas siguen los valores de
 * `estado_proceso` de la DGCP.
 *
 * Los tonos **no** son una paleta decorativa: son los cuatro oficios de color
 * de `IDENTIDAD.md` («un color = un significado»). Antes había siete colores
 * crudos de Tailwind compitiendo entre sí; ahora un estado solo puede ser una
 * de estas cosas, y el nombre del tono lo dice.
 */

export interface Tone {
  /** Clases de la marca de estado: fondo + texto + filete. */
  badge: string;
  /** Clases del punto macizo. */
  dot: string;
}

const TONES = {
  /** Se puede actuar: aún admite ofertas. La firma. */
  accionable: {
    badge: "bg-brand-50 text-brand-700 ring-brand-600/20",
    dot: "bg-brand-500",
  },
  /** Está en curso o ya pasó: informa, no pide nada. Grafito. */
  contexto: {
    badge: "bg-canvas text-ink-soft ring-hairline",
    dot: "bg-ink-soft",
  },
  /** Ya se cumplió: adjudicado y celebrado. Verde de archivo. */
  cumplido: {
    badge: "bg-valido-50 text-valido-700 ring-valido-600/20",
    dot: "bg-valido-500",
  },
  /** Corre un plazo. Ocre de anotación al margen. */
  aviso: {
    badge: "bg-alerta-50 text-alerta-700 ring-alerta-600/20",
    dot: "bg-alerta-500",
  },
  /** Se cayó: desierto o cancelado. El sello. */
  anulado: {
    badge: "bg-sello-50 text-sello-700 ring-sello-600/20",
    dot: "bg-sello-600",
  },
} satisfies Record<string, Tone>;

type ToneName = keyof typeof TONES;

const ESTADO_TONE: Record<string, ToneName> = {
  "Proceso publicado": "accionable",
  "Sobres estan abriendose": "contexto",
  "Sobres abiertos o aperturados": "contexto",
  "Proceso con etapa cerrada": "contexto",
  "Proceso adjudicado y celebrado": "cumplido",
  "Proceso desierto": "anulado",
  Cancelado: "anulado",
};

export interface EstadoMeta extends Tone {
  label: string;
  abierto: boolean;
}

export function estadoMeta(estado: string): EstadoMeta {
  const tone = TONES[ESTADO_TONE[estado] ?? "contexto"];
  return { ...tone, label: estado || "—", abierto: estado === "Proceso publicado" };
}

export interface CierreMeta extends Tone {
  texto: string;
  urgente: boolean;
}

/**
 * Marca del plazo de cierre a partir de los días que quedan (negativo = ya
 * cerró). Un plazo **avisa**: es ocre mientras corre y grafito cuando ya no
 * hay nada que hacer. Antes un cierre a dos días salía en rojo —que en esta
 * identidad significa «derogado»— y uno a veinte en verde, que significa «ya
 * cumplido»: justo lo contrario de lo que pasaba.
 */
export function cierreMeta(dias: number | null): CierreMeta | null {
  if (dias === null) return null;
  if (dias < 0) return { ...TONES.contexto, texto: "Recepción cerrada", urgente: false };
  if (dias === 0) return { ...TONES.aviso, texto: "Cierra hoy", urgente: true };
  if (dias === 1) return { ...TONES.aviso, texto: "Cierra mañana", urgente: true };
  if (dias <= 7) return { ...TONES.aviso, texto: `Cierra en ${dias} días`, urgente: true };
  return { ...TONES.contexto, texto: `Cierra en ${dias} días`, urgente: false };
}
