/**
 * Muertes en las vías — Observatorio Permanente de Seguridad Vial (OPSEVI) del
 * INTRANT.
 *
 * Mecánica verificada en docs/AUDITORIA.md §G.7 (2026-09-24): el tablero
 * `opsevi.intrant.gob.do` (Next.js, sin robots) se alimenta de una API JSON
 * interna, sin clave, que su propio JavaScript llama («la vitrina no es la
 * fuente», §E.1):
 *
 *  - `GET /api/national?years=2026` → `monthly` [{month: «Enero»|«agosto»…,
 *    fatalities}] (sin orden, mayúsculas al azar), `vehicle-types`.
 *  - `GET /api/fatalities/provinces?year=2026` → [{provinceName, deaths}].
 *  - `GET /api/summary?years=2026` → fatalities, injuries, population.
 *
 * **No está documentada**: puede cambiar sin aviso y sus cifras se revisan
 * (son registros de fallecidos del año, preliminares). Si cambia de forma, la
 * lectura da `null` y la interfaz dice que no contestó.
 *
 * La comparación con el año anterior se hace **sobre los mismos meses
 * cerrados**: el mes en curso se descarta, y el año en curso no se compara con
 * un año entero. Aun así, el año en curso es preliminar y el registro llega
 * con retraso (los heridos de 2026 van muy por debajo del ritmo de 2025): la
 * interfaz lo dice en la misma frase que la comparación. Caché de un día; cuatro peticiones por lectura.
 */

import { provinciaDeTexto, type Provincia } from "./provincias";

const BASE = "https://opsevi.intrant.gob.do/api";
const USER_AGENT = "Socratico-Inteligencia/1.0 (muertes en las vias; herramienta independiente)";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre"];

export interface Siniestralidad {
  anio: number;
  /** Meses del año con datos (1–12), en orden. */
  meses: number[];
  muertes: number;
  /** Mismos meses del año anterior; null si el origen no los da. */
  muertesAnterior: number | null;
  heridos: number | null;
  /** Fallecidos por cada 100 mil habitantes, con la población que declara el origen. */
  tasa: number | null;
  motocicleta: { muertes: number; pct: number } | null;
  provincias: { nombre: string; muertes: number; provincia: Provincia | null }[];
  fuente: string;
}

async function pedir<T>(ruta: string): Promise<T | null> {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(`${BASE}${ruta}`, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`respondió ${res.status}`);
      if (!/application\/json/i.test(res.headers.get("content-type") ?? "")) return null;
      return (await res.json()) as T;
    } catch (err) {
      if (intento === 2) {
        console.error(`[siniestralidad] ${ruta}: ${String(err)}`);
        return null;
      }
    }
  }
  return null;
}

interface Nacional {
  monthly?: { month: string; fatalities: number }[];
  "vehicle-types"?: { vehicleType: string; fatalities: number }[];
}

function porMes(n: Nacional | null): Map<number, number> | null {
  if (!n?.monthly?.length) return null;
  const m = new Map<number, number>();
  for (const f of n.monthly) {
    const i = MESES.indexOf(f.month.trim().toLowerCase());
    if (i >= 0 && Number.isFinite(f.fatalities)) m.set(i + 1, (m.get(i + 1) ?? 0) + f.fatalities);
  }
  return m.size ? m : null;
}

export async function getSiniestralidad(): Promise<Siniestralidad | null> {
  const anio = Number(
    new Date().toLocaleString("en-CA", { timeZone: "America/Santo_Domingo", year: "numeric" }),
  );
  const [actual, anterior, provincias, resumen] = await Promise.all([
    pedir<Nacional>(`/national?years=${anio}`),
    pedir<Nacional>(`/national?years=${anio - 1}`),
    pedir<{ provinceName: string; deaths: number }[]>(`/fatalities/provinces?year=${anio}`),
    pedir<{ fatalities?: number; injuries?: number; population?: number }>(`/summary?years=${anio}`),
  ]);
  const mesesActual = porMes(actual);
  if (!mesesActual) return null;
  // El mes en curso (y cualquier mes futuro mal fechado) no entra: compararía un
  // mes a medias con el mes entero del año anterior e inventaría una caída.
  const mesHoy = Number(
    new Date().toLocaleString("en-CA", { timeZone: "America/Santo_Domingo", month: "numeric" }),
  );
  for (const m of [...mesesActual.keys()]) if (m >= mesHoy) mesesActual.delete(m);
  if (mesesActual.size === 0) return null;
  const meses = [...mesesActual.keys()].sort((a, b) => a - b);
  const muertes = meses.reduce((s, m) => s + (mesesActual.get(m) ?? 0), 0);
  const mesesAnterior = porMes(anterior);
  const muertesAnterior =
    mesesAnterior && meses.every((m) => mesesAnterior.has(m))
      ? meses.reduce((s, m) => s + (mesesAnterior.get(m) ?? 0), 0)
      : null;
  const moto = actual?.["vehicle-types"]?.find((v) => /motocicleta/i.test(v.vehicleType));
  const totalVehiculos = actual?.["vehicle-types"]?.reduce((s, v) => s + (v.fatalities || 0), 0) ?? 0;
  const poblacion = resumen?.population && resumen.population > 1_000_000 ? resumen.population : null;

  return {
    anio,
    meses,
    muertes,
    muertesAnterior,
    heridos: typeof resumen?.injuries === "number" && resumen.injuries > 0 ? resumen.injuries : null,
    tasa: poblacion ? (muertes / poblacion) * 100_000 : null,
    motocicleta:
      moto && totalVehiculos > 0 ? { muertes: moto.fatalities, pct: (moto.fatalities / totalVehiculos) * 100 } : null,
    provincias: (Array.isArray(provincias) ? provincias : [])
      .filter((p) => p && typeof p.deaths === "number" && p.provinceName)
      .sort((a, b) => b.deaths - a.deaths)
      .map((p) => ({ nombre: p.provinceName, muertes: p.deaths, provincia: provinciaDeTexto(p.provinceName) })),
    fuente: "https://opsevi.intrant.gob.do/",
  };
}

/** «enero–agosto» */
export function tramoDeMeses(meses: number[]): string {
  if (meses.length === 0) return "";
  const a = MESES[meses[0] - 1];
  const b = MESES[meses[meses.length - 1] - 1];
  return a === b ? a : `${a}–${b}`;
}
