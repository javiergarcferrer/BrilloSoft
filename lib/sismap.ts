import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * SISMAP — el ranking de gestión pública del Ministerio de Administración
 * Pública, para instituciones del Gobierno central, ayuntamientos y juntas de
 * distrito municipal.
 *
 * Mecánica verificada en docs/AUDITORIA.md §A.7: tablas HTML servidas, tres
 * páginas. `scripts/build-sismap.py` las lee y las cruza por nombre con las
 * fichas de institución; este módulo sirve `public/data/sismap.json`. El SISMAP
 * no publica fecha de corte en esas páginas: lo que se declara es el día en que
 * se consultó (`consultado`).
 *
 * Módulo de servidor (`node:fs`), memoizado por instancia.
 */

export interface FilaSismap {
  posicion: number;
  nombre: string;
  /** Sector de gobierno; solo en la tabla de instituciones. */
  sector: string | null;
  /** Valoración 0–100. */
  valor: number;
  /** Ficha de evidencias del organismo en el SISMAP. */
  ficha: string | null;
  /** Unidad de compra de la DGCP (ficha de institución), si el nombre casa. */
  uc: number | null;
}

export type TablaSismap = "instituciones" | "ayuntamientos" | "juntas";

export const TABLAS_SISMAP: { clave: TablaSismap; nombre: string; singular: string }[] = [
  { clave: "instituciones", nombre: "Instituciones", singular: "institución del Gobierno central" },
  { clave: "ayuntamientos", nombre: "Ayuntamientos", singular: "ayuntamiento" },
  { clave: "juntas", nombre: "Juntas de distrito", singular: "junta de distrito municipal" },
];

export interface Sismap extends Record<TablaSismap, FilaSismap[]> {
  consultado: string;
  fuente: string;
}

let memo: Promise<Sismap | null> | null = null;

export function getSismap(): Promise<Sismap | null> {
  memo ??= readFile(join(process.cwd(), "public", "data", "sismap.json"), "utf8")
    .then((t) => JSON.parse(t) as Sismap)
    .catch((err) => {
      console.error("[sismap]", err);
      memo = null;
      return null;
    });
  return memo;
}

/** La fila del SISMAP de una institución, con el tamaño de su tabla. */
export async function sismapDeInstitucion(uc: number): Promise<{
  fila: FilaSismap;
  tabla: TablaSismap;
  total: number;
  consultado: string;
} | null> {
  const d = await getSismap();
  if (!d) return null;
  for (const { clave } of TABLAS_SISMAP) {
    const fila = d[clave].find((f) => f.uc === uc);
    if (fila) return { fila, tabla: clave, total: d[clave].length, consultado: d.consultado };
  }
  return null;
}
