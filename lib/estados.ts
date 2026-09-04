/**
 * El lenguaje de color del estado — **de toda la plataforma**, no solo de la
 * DGCP.
 *
 * Los tonos no son una paleta decorativa: son los oficios de color de
 * `docs/IDENTIDAD.md` («un color = un significado, en toda la plataforma»), y
 * por eso se nombran por **lo que significan** y nunca por el estado concreto
 * de una fuente. Un estado del origen se traduce a uno de estos cinco; los
 * nombres del Estado no entran aquí.
 *
 * Esta regla se había roto en silencio. `components/iniciativa-card.tsx`
 * mantenía una segunda tabla —que en su comentario decía estar «alineada con
 * lib/estados.ts»— con los dos colores que más pesan invertidos respecto a
 * esta: el verde de archivo, que aquí significa *ya se cumplió*, marcaba en el
 * Congreso una pieza recién **depositada**, y el azul de la firma, que en toda
 * la plataforma significa *se puede actuar*, marcaba una ley ya **promulgada**.
 * A dos clics de distancia el mismo verde decía «terminado» y «acaba de
 * empezar», y un listado del Senado entero en verde se leía como un archivo
 * cerrado. Ahora la tabla vive una sola vez y las dos cámaras la importan.
 */

export interface Tone {
  /** Clases de la marca de estado: fondo + texto + filete. */
  badge: string;
  /** Clases del punto macizo. */
  dot: string;
}

/**
 * Los cinco oficios. Clases literales: el escáner de Tailwind lee el fuente.
 */
export const TONOS = {
  /** Sigue abierto a que alguien haga algo: admite ofertas, admite trámite. La firma. */
  accionable: {
    badge: "bg-brand-50 text-brand-700 ring-brand-600/20",
    dot: "bg-brand-500",
  },
  /** Informa y no pide nada: en curso, ya pasó, o el origen no lo dice. Grafito. */
  contexto: {
    badge: "bg-canvas text-ink-soft ring-hairline",
    dot: "bg-ink-soft",
  },
  /** Llegó al final de su trámite: adjudicado, promulgado. Verde de archivo. */
  cumplido: {
    badge: "bg-valido-50 text-valido-700 ring-valido-600/20",
    dot: "bg-valido-500",
  },
  /** Corre un plazo y todavía se puede perder. Ocre de anotación al margen. */
  aviso: {
    badge: "bg-alerta-50 text-alerta-700 ring-alerta-600/20",
    dot: "bg-alerta-500",
  },
  /** Se cayó sin llegar a nada: desierto, cancelado, perimido. El sello. */
  anulado: {
    badge: "bg-sello-50 text-sello-700 ring-sello-600/20",
    dot: "bg-sello-600",
  },
} satisfies Record<string, Tone>;

/**
 * El nombre de un oficio de color. Es el tipo que cruza la plataforma: una
 * fuente traduce su vocabulario a esto y la interfaz solo conoce esto.
 */
export type Tono = keyof typeof TONOS;

const ESTADO_TONO: Record<string, Tono> = {
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
  const tono = TONOS[ESTADO_TONO[estado] ?? "contexto"];
  return { ...tono, label: estado || "—", abierto: estado === "Proceso publicado" };
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
  if (dias < 0) return { ...TONOS.contexto, texto: "Recepción cerrada", urgente: false };
  if (dias === 0) return { ...TONOS.aviso, texto: "Cierra hoy", urgente: true };
  if (dias === 1) return { ...TONOS.aviso, texto: "Cierra mañana", urgente: true };
  if (dias <= 7) return { ...TONOS.aviso, texto: `Cierra en ${dias} días`, urgente: true };
  return { ...TONOS.contexto, texto: `Cierra en ${dias} días`, urgente: false };
}
