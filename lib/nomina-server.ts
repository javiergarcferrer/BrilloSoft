import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { COL, periodKey, periodLabel, type NominaData } from "./nomina";

/**
 * Resumen de la nómina calculado en el servidor.
 *
 * Vive aparte de `lib/nomina.ts` a propósito: ese módulo lo importa el explorador,
 * que es un Client Component, y arrastrar `node:fs` hasta el bundle del navegador
 * rompe la compilación con webpack. Importar este módulo desde el cliente vuelve
 * a romperla: es deliberado, y el sufijo `-server` lo anuncia.
 */

export interface ResumenNomina {
  /** Puestos presupuestados en el mes más reciente. */
  plazas: number;
  /** Gasto del mes más reciente, en DOP. */
  gastoMensual: number;
  /** Etiqueta del mes más reciente, p. ej. "Mayo 2026". */
  ultimoPeriodo: string;
  /** Filas totales del conjunto (todas las instantáneas mensuales). */
  registros: number;
  localidades: number;
}

/**
 * `loadNomina` usa una URL relativa y solo sirve en el cliente; el panorama es
 * un Server Component, así que lee el mismo archivo desde disco. La lectura es
 * cara (~2 MB), pero corre una vez por ventana de `revalidate`.
 */
export async function getResumenNomina(): Promise<ResumenNomina | null> {
  try {
    const crudo = await readFile(
      join(process.cwd(), "public", "data", "nomina.json"),
      "utf8",
    );
    const data = JSON.parse(crudo) as NominaData;

    let maxPeriodo = -1;
    for (const r of data.rows) {
      const k = periodKey(r[COL.ANIO], r[COL.MES]);
      if (k > maxPeriodo) maxPeriodo = k;
    }

    let plazas = 0;
    let gastoMensual = 0;
    for (const r of data.rows) {
      if (periodKey(r[COL.ANIO], r[COL.MES]) !== maxPeriodo) continue;
      plazas += 1;
      gastoMensual += r[COL.SUELDO];
    }

    return {
      plazas,
      gastoMensual,
      ultimoPeriodo: periodLabel(Math.floor(maxPeriodo / 100), maxPeriodo % 100),
      registros: data.rows.length,
      localidades: data.localidades.length,
    };
  } catch (err) {
    console.error("[nomina] resumen:", err);
    return null;
  }
}
