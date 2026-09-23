/**
 * Tasa de cambio del dólar — referencia del mercado spot del Banco Central.
 *
 * Sin credenciales: la API del BCRD (`api.bancentral.gov.do`) exige clave y es
 * decisión del dueño (docs/AUDITORIA.md §8.3); esto lee el **archivo público
 * del CDN** que el propio BCRD publica (§A.6), verificado el 2026-09-23:
 *
 *   https://cdn.bancentral.gov.do/documents/estadisticas/mercado-cambiario/documents/TASA_DOLAR_REFERENCIA_MC.xlsx
 *
 * → 200, 357 KB, `last-modified` del día hábil anterior. Hoja «Diaria»
 * (`xl/worksheets/sheet1.xml`): Año | Mes («Ene»…) | Día | Compra | Venta, desde
 * 1991. **Ojo**: el `.xls` del mismo nombre que citaba la auditoría también
 * responde 200, pero está congelado desde el 19-jul-2022; el vigente es el
 * `.xlsx`.
 *
 * Fuente viva, caché de 1 h (precio). Solo servidor: reutiliza el lector de
 * XLSX de `lib/deuda.ts` (`node:zlib`).
 */

import { leerZip } from "./deuda";

export const URL_TASA =
  "https://cdn.bancentral.gov.do/documents/estadisticas/mercado-cambiario/documents/TASA_DOLAR_REFERENCIA_MC.xlsx";
const USER_AGENT = "Socratico-Inteligencia/1.0 (tasa de cambio de referencia; herramienta independiente)";

export interface PuntoTasa {
  /** Fecha ISO del día hábil. */
  fecha: string;
  compra: number;
  venta: number;
}

export interface Tasa {
  ultimo: PuntoTasa;
  /** El día hábil más cercano a 30 días antes, para comparar con la misma serie. */
  haceUnMes: PuntoTasa | null;
  fuente: string;
}

const MESES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9,
  oct: 10, nov: 11, dic: 12, dec: 12, jan: 1, apr: 4,
};

async function bajar(): Promise<ArrayBuffer | null> {
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(URL_TASA, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(25_000),
      });
      // Un 5xx se reintenta una vez (el contrato de las capas); un tipo que no
      // es una hoja no mejora reintentando.
      if (!res.ok) throw new Error(`el CDN respondió ${res.status}`);
      const tipo = res.headers.get("content-type") ?? "";
      if (!/octet-stream|spreadsheetml|excel/i.test(tipo)) {
        console.error(`[tasa] ${res.status} ${tipo}`);
        return null;
      }
      const buf = await res.arrayBuffer();
      // Un 200 puede ser una página de error: un XLSX empieza por «PK».
      if (new Uint8Array(buf.slice(0, 2)).join() !== "80,75") return null;
      return buf;
    } catch (err) {
      if (intento === 2) {
        console.error(`[tasa] ${String(err)}`);
        return null;
      }
    }
  }
  return null;
}

export async function getTasa(): Promise<Tasa | null> {
  const buf = await bajar();
  if (!buf) return null;
  try {
    const archivos = await leerZip(buf);
    const hoja = archivos.find((a) => a.nombre === "xl/worksheets/sheet1.xml");
    const compartidas = archivos.find((a) => a.nombre === "xl/sharedStrings.xml");
    if (!hoja) return null;
    const strs = compartidas
      ? [...compartidas.datos.toString("utf8").matchAll(/<si>(.*?)<\/si>/gs)].map((m) =>
          m[1].replace(/<[^>]+>/g, ""),
        )
      : [];
    const xml = hoja.datos.toString("utf8");
    // Solo la cola: las últimas ~60 filas bastan para el último día y el de
    // hace un mes, y evitan recorrer 9,000 filas desde 1991.
    const filas = [...xml.slice(-40_000).matchAll(/<row[^>]*>(.*?)<\/row>/gs)];
    const puntos: PuntoTasa[] = [];
    for (const f of filas) {
      const celdas = new Map<string, string>();
      for (const c of f[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(.*?)<\/c>)/gs)) {
        const v = /<v>([^<]*)<\/v>/.exec(c[3] ?? "")?.[1] ?? "";
        celdas.set(c[1], /t="s"/.test(c[2]) && v ? (strs[Number(v)] ?? "") : v);
      }
      const anio = Number(celdas.get("A"));
      const mes = MESES[(celdas.get("B") ?? "").trim().slice(0, 3).toLowerCase()];
      const dia = Number(celdas.get("C"));
      const compra = Number(celdas.get("D"));
      const venta = Number(celdas.get("E"));
      if (!anio || !mes || !dia || !(compra > 0) || !(venta > 0)) continue;
      puntos.push({
        fecha: `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
        compra: Math.round(compra * 10_000) / 10_000,
        venta: Math.round(venta * 10_000) / 10_000,
      });
    }
    puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
    const ultimo = puntos.at(-1);
    if (!ultimo) return null;
    const objetivo = new Date(`${ultimo.fecha}T12:00:00Z`);
    objetivo.setUTCDate(objetivo.getUTCDate() - 30);
    const iso = objetivo.toISOString().slice(0, 10);
    const haceUnMes = [...puntos].reverse().find((p) => p.fecha <= iso) ?? null;
    return { ultimo, haceUnMes, fuente: URL_TASA };
  } catch (err) {
    console.error(`[tasa] parseo: ${String(err)}`);
    return null;
  }
}
