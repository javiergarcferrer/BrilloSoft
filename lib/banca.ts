/**
 * Indicadores del sistema financiero de la Superintendencia de Bancos:
 * morosidad, cartera de créditos, índice de solvencia y la tasa de los
 * préstamos nuevos.
 *
 * Mecánica verificada en docs/AUDITORIA.md §G.13 (SIMBAD, 2026-09-24; primer
 * registro en §G.5): el tablero público de la portada de SIMBAD
 * (`simbad.sb.gob.do`) es un Apache Superset abierto sin sesión, y cada una de
 * sus tarjetas se lee con
 *
 *   GET https://simbad.sb.gob.do/api/v1/chart/{id}/data/?format=json&type=results
 *   → 200 `application/json`, ~1–3 KB: `{ result: [{ colnames, coltypes, data }] }`,
 *     `data` = `[{ __timestamp: <ms UTC del día 1 del mes>, <métrica>: n }]`.
 *
 * **Nota de seguridad.** La API pública de ese Superset expone también el SQL
 * de cada gráfico y usuarios del personal de la SB (hallazgo del
 * reconocimiento, notificado a la SB, AUDITORIA §G.5). Esta capa lee
 * **solo** los endpoints de datos de las tarjetas que el propio tablero pinta
 * —nunca los de usuarios, SQL, bases de datos ni datasets— y pide
 * `type=results`, que devuelve solo `colnames`/`coltypes`/`data`: el SQL no
 * viaja en la respuesta y por eso tampoco queda en la caché de `fetch`. No se
 * registra ni se guarda ningún otro campo.
 *
 * Tarjetas (ids del tablero «inicio», estables desde su publicación):
 *   1467 Morosidad (%) · 1466 Saldo de la cartera de créditos (DOP millones) ·
 *   1464 Índice de solvencia (%) · 1423 Tasa activa promedio de nuevos créditos
 *   del sistema (%). Ventana: **24 meses** que calcula SIMBAD; los meses sin
 *   publicar no vienen (morosidad y cartera llegan a julio de 2026, solvencia a
 *   mayo). ⚠️ La 1423 tiene la ventana **fija** hasta el 5 de agosto de 2026
 *   (las demás usan «now»): si la SB no la mueve, se queda en julio 2026, y
 *   la tarjeta lo dice con su mes.
 *
 * No hay datos de depósitos en el tablero público. Cada indicador se degrada
 * solo a `null`; nunca se fabrica una comparación que la ventana no trae.
 * Serie mensual, caché diaria.
 */

const BASE = "https://simbad.sb.gob.do/api/v1/chart";
export const URL_SIMBAD = "https://simbad.sb.gob.do/";
const USER_AGENT = "Socratico-Inteligencia/1.0 (banca y subastas; herramienta independiente)";

export interface IndicadorBanca {
  /** AAAA-MM del último mes publicado. */
  periodo: string;
  valor: number;
  unidad: string;
  /** El mismo mes un año antes, solo si la ventana de 24 meses lo trae. */
  anterior: { periodo: string; valor: number } | null;
  /** Primer mes de la ventana que devolvió SIMBAD. */
  desde: string;
  meses: number;
}

export interface Banca {
  morosidad: IndicadorBanca | null;
  cartera: IndicadorBanca | null;
  solvencia: IndicadorBanca | null;
  tasaNuevos: IndicadorBanca | null;
}

type Punto = [periodo: string, valor: number];

/** Lee una tarjeta del tablero: solo `data`, validada. */
async function serie(id: number): Promise<Punto[] | null> {
  const url = `${BASE}/${id}/data/?format=json&type=results`;
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`SIMBAD respondió ${res.status}`);
      const tipo = res.headers.get("content-type") ?? "";
      // Un 200 puede ser la página de un WAF o la de error de Superset.
      if (!/application\/json/i.test(tipo)) {
        console.error(`[banca] tarjeta ${id}: ${res.status} ${tipo}`);
        return null;
      }
      const cuerpo = (await res.json()) as { result?: { colnames?: unknown; data?: unknown }[] };
      const r = cuerpo.result?.[0];
      const cols = Array.isArray(r?.colnames) ? (r.colnames as string[]) : [];
      const metrica = cols.find((c) => c !== "__timestamp");
      if (!metrica || !Array.isArray(r?.data)) return null;
      const puntos: Punto[] = [];
      for (const fila of r.data as Record<string, unknown>[]) {
        const ts = fila.__timestamp;
        const v = fila[metrica];
        if (typeof ts !== "number" || typeof v !== "number" || !Number.isFinite(v)) continue;
        puntos.push([new Date(ts).toISOString().slice(0, 7), v]);
      }
      puntos.sort((a, b) => a[0].localeCompare(b[0]));
      return puntos.length ? puntos : null;
    } catch (err) {
      if (intento === 2) {
        console.error(`[banca] tarjeta ${id}: ${String(err)}`);
        return null;
      }
    }
  }
  return null;
}

const mismoMesAnterior = (p: string) => `${Number(p.slice(0, 4)) - 1}${p.slice(4)}`;

async function indicador(
  id: number,
  unidad: string,
  plausible: (v: number) => boolean,
): Promise<IndicadorBanca | null> {
  const puntos = await serie(id);
  if (!puntos) return null;
  const [periodo, valor] = puntos.at(-1)!;
  if (!plausible(valor)) {
    console.error(`[banca] tarjeta ${id}: valor implausible ${valor}`);
    return null;
  }
  const previo = puntos.find(([p]) => p === mismoMesAnterior(periodo));
  return {
    periodo,
    valor,
    unidad,
    anterior: previo && plausible(previo[1]) ? { periodo: previo[0], valor: previo[1] } : null,
    desde: puntos[0][0],
    meses: puntos.length,
  };
}

export async function getBanca(): Promise<Banca> {
  const [morosidad, cartera, solvencia, tasaNuevos] = await Promise.all([
    indicador(1467, "% de la cartera", (v) => v > 0 && v < 20),
    indicador(1466, "millones de RD$", (v) => v > 100_000 && v < 100_000_000),
    indicador(1464, "%", (v) => v > 5 && v < 60),
    indicador(1423, "% nominal anual", (v) => v > 3 && v < 40),
  ]);
  return { morosidad, cartera, solvencia, tasaNuevos };
}
