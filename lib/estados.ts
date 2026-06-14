/**
 * Visual metadata for DGCP process states and closing-deadline urgency.
 * Centralized so cards, the detail header and any future view render the same
 * vocabulary and color language. Labels track the DGCP `estado_proceso` values.
 */

export interface Tone {
  /** classes for a soft pill: background + text + ring */
  badge: string;
  /** classes for a solid status dot */
  dot: string;
}

const TONES = {
  emerald: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  sky: { badge: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dot: "bg-indigo-500" },
  slate: { badge: "bg-slate-100 text-slate-600 ring-slate-300", dot: "bg-slate-400" },
  violet: { badge: "bg-violet-50 text-violet-700 ring-violet-600/20", dot: "bg-violet-500" },
  amber: { badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  rose: { badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
} satisfies Record<string, Tone>;

type ToneName = keyof typeof TONES;

const ESTADO_TONE: Record<string, ToneName> = {
  "Proceso publicado": "emerald",
  "Sobres estan abriendose": "sky",
  "Sobres abiertos o aperturados": "indigo",
  "Proceso con etapa cerrada": "slate",
  "Proceso adjudicado y celebrado": "violet",
  "Proceso desierto": "rose",
  "Cancelado": "rose",
};

export interface EstadoMeta extends Tone {
  label: string;
  abierto: boolean;
}

export function estadoMeta(estado: string): EstadoMeta {
  const tone = TONES[ESTADO_TONE[estado] ?? "slate"];
  return { ...tone, label: estado || "—", abierto: estado === "Proceso publicado" };
}

export interface CierreMeta extends Tone {
  texto: string;
  urgente: boolean;
}

/** Closing-deadline pill from a day count (negative = already closed). */
export function cierreMeta(dias: number | null): CierreMeta | null {
  if (dias === null) return null;
  if (dias < 0) return { ...TONES.slate, texto: "Recepción cerrada", urgente: false };
  if (dias === 0) return { ...TONES.rose, texto: "Cierra hoy", urgente: true };
  if (dias === 1) return { ...TONES.rose, texto: "Cierra mañana", urgente: true };
  if (dias <= 2) return { ...TONES.rose, texto: `Cierra en ${dias} días`, urgente: true };
  if (dias <= 7) return { ...TONES.amber, texto: `Cierra en ${dias} días`, urgente: true };
  return { ...TONES.emerald, texto: `Cierra en ${dias} días`, urgente: false };
}
