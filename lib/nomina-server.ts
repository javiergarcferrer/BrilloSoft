import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { COL, median, periodLabel, type InstitucionNomina, type NominaData } from "./nomina";

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

/*
  La instantánea es fija en cada despliegue: se lee y resume una vez por
  instancia. Antes, cada ficha de institución sin nómina parseaba los 750 KB
  de nomina.json solo para decir de cuántas se lee. Una lectura fallida no se
  recuerda, para que la siguiente lo vuelva a intentar.
*/
let resumenMemo: Promise<ResumenNomina | null> | null = null;

/**
 * `loadNomina` usa una URL relativa y solo sirve en el cliente; el panorama es
 * un Server Component, así que lee el mismo archivo desde disco.
 */
export function getResumenNomina(): Promise<ResumenNomina | null> {
  resumenMemo ??= leerResumenNomina().then((r) => {
    if (!r) resumenMemo = null;
    return r;
  });
  return resumenMemo;
}

async function leerResumenNomina(): Promise<ResumenNomina | null> {
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

export interface NominaDeInstitucion {
  codigo: string;
  nombre: string;
  periodo: string;
  anio: number;
  mes: number;
  plazas: number;
  masa: number;
  mediana: number;
  /** Los cargos con más plazas: cargo, plazas y sueldo mediano. */
  cargos: { cargo: string; plazas: number; mediana: number }[];
}

/** La foto de nómina de una institución, por su código de `nomina.json`. */
export async function getNominaDeInstitucion(
  codigo: string,
): Promise<NominaDeInstitucion | null> {
  try {
    const data = JSON.parse(
      await readFile(join(process.cwd(), "public", "data", "nomina.json"), "utf8"),
    ) as NominaData;
    const indice = data.instituciones.findIndex((i) => i.codigo === codigo);
    if (indice < 0) return null;
    const inst = data.instituciones[indice];
    const filas = data.rows.filter((r) => r[COL.INST] === indice);
    const porCargo = new Map<number, number[]>();
    for (const r of filas) {
      const lista = porCargo.get(r[COL.CARGO]) ?? [];
      lista.push(r[COL.SUELDO]);
      porCargo.set(r[COL.CARGO], lista);
    }
    const cargos = [...porCargo.entries()]
      .map(([c, sueldos]) => ({ cargo: data.cargos[c], plazas: sueldos.length, mediana: median(sueldos) }))
      .sort((a, b) => b.plazas - a.plazas)
      .slice(0, 8);
    return {
      codigo: inst.codigo,
      nombre: inst.nombre,
      periodo: periodLabel(inst.anio, inst.mes),
      anio: inst.anio,
      mes: inst.mes,
      plazas: inst.plazas,
      masa: inst.masa,
      mediana: median(filas.map((r) => r[COL.SUELDO])),
      cargos,
    };
  } catch (err) {
    console.error("[nomina] institución:", err);
    return null;
  }
}

/**
 * Las instituciones de la foto, con su período: lo que `/nomina` pinta en el
 * servidor para declarar la cobertura y la antigüedad de cada una sin esperar
 * a que el explorador baje el JSON entero.
 */
export async function getInstitucionesNomina(): Promise<{
  generatedAt: string;
  plazas: number;
  instituciones: InstitucionNomina[];
} | null> {
  try {
    const data = JSON.parse(
      await readFile(join(process.cwd(), "public", "data", "nomina.json"), "utf8"),
    ) as NominaData;
    return {
      generatedAt: data.generatedAt,
      plazas: data.rows.length,
      instituciones: data.instituciones,
    };
  } catch (err) {
    console.error("[nomina] instituciones:", err);
    return null;
  }
}
