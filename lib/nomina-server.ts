import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { periodLabel, type NominaData } from "./nomina";

/**
 * Resumen de la nómina calculado en el servidor.
 *
 * Vive aparte de `lib/nomina.ts` a propósito: ese módulo lo importa el explorador,
 * que es un Client Component, y arrastrar `node:fs` hasta el bundle del navegador
 * rompe la compilación con webpack. Importar este módulo desde el cliente vuelve
 * a romperla: es deliberado, y el sufijo `-server` lo anuncia.
 */

export interface ResumenNomina {
  /** Plazas en la foto transversal (último mes publicado por institución). */
  plazas: number;
  /** Σ masa salarial mensual de la foto, en DOP. */
  gastoMensual: number;
  /** Cuántas instituciones cubre la foto. */
  instituciones: number;
  /** Período más reciente entre las fotos, p. ej. "Jul '26". */
  periodoReciente: string;
}

/**
 * `loadNomina` usa una URL relativa y solo sirve en el cliente; el panorama es
 * un Server Component, así que lee el mismo archivo desde disco. Corre una vez
 * por ventana de `revalidate`.
 */
export async function getResumenNomina(): Promise<ResumenNomina | null> {
  try {
    const crudo = await readFile(
      join(process.cwd(), "public", "data", "nomina.json"),
      "utf8",
    );
    const data = JSON.parse(crudo) as NominaData;

    let plazas = 0;
    let gastoMensual = 0;
    let max = { anio: 0, mes: 1 };
    for (const i of data.instituciones) {
      plazas += i.plazas;
      gastoMensual += i.masa;
      if (i.anio * 100 + i.mes > max.anio * 100 + max.mes) max = i;
    }

    return {
      plazas,
      gastoMensual,
      instituciones: data.instituciones.length,
      periodoReciente: periodLabel(max.anio, max.mes),
    };
  } catch (err) {
    console.error("[nomina] resumen:", err);
    return null;
  }
}
