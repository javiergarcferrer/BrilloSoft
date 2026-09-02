import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-config";

/**
 * Lecturas server-side de la vertical `/democracia`.
 *
 * Los agregados de voto son **públicos** (la vista `agregados_publicos` solo
 * expone conteos, nunca quién votó), así que se leen con la clave publicable
 * vía REST, con caché de Next. El voto nominal jamás se lee desde el servidor:
 * es privado y solo el propio usuario lo ve, autenticado, desde el navegador.
 */

const REST = `${SUPABASE_URL}/rest/v1`;

async function rest<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${REST}/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Accept-Profile": "democracia",
      },
      next: { revalidate },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`Supabase respondió ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[democracia] ${path}: ${String(err)}`);
    return null;
  }
}

export type Camara = "diputados" | "senado";

export interface Agregado {
  camara: Camara;
  ref: string;
  a_favor: number;
  en_contra: number;
  total: number;
  /** Votos de votantes con identidad verificada por Cuenta Única (PLAN §9). */
  verificados: number;
}

/** Referencia estable de una iniciativa para votar. */
export function refIniciativa(camara: Camara, id: string | number, cuatrienio?: string): string {
  return camara === "senado" && cuatrienio ? `${cuatrienio}:${id}` : String(id);
}

/** Agregado de una sola iniciativa (para el widget de voto en la ficha). */
export async function getAgregado(camara: Camara, ref: string): Promise<Agregado | null> {
  const filtro = `camara=eq.${camara}&ref=eq.${encodeURIComponent(ref)}`;
  const rows = await rest<Agregado[]>(`agregados_publicos?${filtro}&select=*`, 30);
  return rows?.[0] ?? { camara, ref, a_favor: 0, en_contra: 0, total: 0, verificados: 0 };
}

export interface RankingItem extends Agregado {
  numero: string | null;
  titulo: string | null;
  grupo: string | null;
  /** a_favor − en_contra. */
  balance: number;
  /** a_favor / total, 0..1. */
  apoyo: number;
}

/**
 * Ranking de iniciativas votadas. Cruza los agregados con el espejo
 * denormalizado de iniciativas (título/número), ambos leídos por REST.
 */
export async function getRanking(limite = 60): Promise<RankingItem[]> {
  const [agg, inis] = await Promise.all([
    rest<Agregado[]>(`agregados_publicos?select=*&order=total.desc&limit=${limite}`, 60),
    rest<
      { camara: Camara; ref: string; numero: string | null; titulo: string | null; grupo: string | null }[]
    >(`iniciativas?select=camara,ref,numero,titulo,grupo`, 60),
  ]);
  if (!agg) return [];

  const meta = new Map(inis?.map((i) => [`${i.camara}:${i.ref}`, i]) ?? []);
  return agg.map((a) => {
    const m = meta.get(`${a.camara}:${a.ref}`);
    return {
      ...a,
      numero: m?.numero ?? null,
      titulo: m?.titulo ?? null,
      grupo: m?.grupo ?? null,
      balance: a.a_favor - a.en_contra,
      apoyo: a.total > 0 ? a.a_favor / a.total : 0,
    };
  });
}

export interface ResumenDemocracia {
  votos: number;
  iniciativas: number;
}

/** Cifras de cabecera para el panorama y la landing. */
export async function getResumenDemocracia(): Promise<ResumenDemocracia | null> {
  const agg = await rest<Agregado[]>(`agregados_publicos?select=total`, 60);
  if (!agg) return null;
  return {
    votos: agg.reduce((s, a) => s + a.total, 0),
    iniciativas: agg.length,
  };
}
