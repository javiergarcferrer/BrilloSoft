/**
 * El buscador de toda la plataforma (`/buscar`).
 *
 * No hay índice propio ni lo habrá —ninguna base de datos fuera de
 * `/democracia`—, así que «buscar en todo» es dos cosas honestas:
 *
 *  1. **Reconocer la forma** de lo tecleado y llevar directo: un RNC o una
 *     cédula es un proveedor; «Ley 47-20» es una norma; `MOPC-CCC-LPN-2025-0010`
 *     es un proceso; unas siglas exactas son una institución.
 *  2. **Juntar lo que se puede leer sin salir**: el cruce de instituciones y
 *     las instantáneas de normativa y nómina, más una consulta en vivo al SIL.
 *     Lo que exige barrer una API entera (licitaciones, Senado) se ofrece como
 *     enlace con su alcance, no se finge.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { INSTITUCIONES, hrefInstitucion } from "@/lib/instituciones";
import { normalize } from "@/lib/dgcp";
import { filtrarObras, getObras, type Obra } from "@/lib/obras";

/** Obras de MapaInversiones por nombre, entidad o SNIP, de mayor valor. */
export async function buscarObras(q: string, limite = 6): Promise<{ obras: Obra[]; total: number }> {
  const inst = await getObras();
  if (!inst) return { obras: [], total: 0 };
  const todas = filtrarObras(inst.proyectos, { q }).sort((a, b) => b.valor - a.valor);
  return { obras: todas.slice(0, limite), total: todas.length };
}

const RUTA_NORMA: Record<string, string> = {
  ley: "ley",
  decreto: "decreto",
  reglamento: "reglamento",
  resolucion: "resolucion",
};

/** Si lo tecleado tiene una forma inequívoca, la ruta a la que lleva. */
export function rutaDirecta(consulta: string): string | null {
  const q = consulta.trim();
  const digitos = q.replace(/[\s-]/g, "");

  // RNC (9 dígitos) o cédula (11): el registro de proveedores busca por ambos.
  if (/^\d{9}$|^\d{11}$/.test(digitos)) return `/proveedores?q=${digitos}`;

  // «Ley 47-20», «decreto núm. 606-26», «Resolución No. 12-2025».
  const cita = /^(ley|decreto|reglamento|resoluci[oó]n)\s*(?:n[uú]m(?:ero)?\.?|no\.?|n\.?\s*[oº°]\.?)?\s*(\d{1,4}-\d{2,4})$/i.exec(
    q,
  );
  if (cita) return `/normativa/${RUTA_NORMA[normalize(cita[1])]}/${cita[2]}`;

  // Código de proceso de la DGCP: SIGLAS-XXX-MOD-AAAA-NNNN.
  if (/^[A-Z0-9]{2,15}(-[A-Z0-9]{1,10}){2,4}-\d{4}-\d{3,5}$/i.test(q)) {
    return `/procesos/${q.toUpperCase()}`;
  }

  // Siglas exactas de una sola institución, solo si son siglas de verdad.
  // Varias unidades de compra usan una palabra como «acrónimo» —TRABAJO,
  // CULTURA, PASAPORTES—: quien teclea «trabajo» busca leyes o plazas, no
  // necesariamente el ministerio. Si las «siglas» son una palabra de su propio
  // nombre, no se salta: la institución sale primera en los resultados.
  const siglas = INSTITUCIONES.filter(
    (i) => i.acronimo && normalize(i.acronimo) === normalize(q),
  );
  const esPalabraDelNombre = (i: (typeof siglas)[number]) =>
    normalize(i.nombre).split(/[^a-z0-9]+/).includes(normalize(i.acronimo));
  if (siglas.length === 1 && q.length >= 2 && !esPalabraDelNombre(siglas[0])) {
    return hrefInstitucion(siglas[0]);
  }

  return null;
}

/** ¿Están todas las palabras de `q` en `texto`? Sin tildes ni mayúsculas. */
function coincide(q: string, texto: string): boolean {
  const heno = normalize(texto);
  return normalize(q)
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .every((p) => heno.includes(p));
}

export interface NormaEncontrada {
  tipo: string;
  numero: string;
  titulo: string;
  fecha: string | null;
  href: string | null;
}

const TIPO: Record<number, string> = { 1: "Ley", 3: "Decreto", 4: "Reglamento", 7: "Resolución" };

interface FilaInstantanea {
  TipoDocumento?: number;
  Numero?: string;
  Titulo?: string;
  FechaPromulgacion?: string | null;
}

/** Normas de la instantánea cuyo título contiene todas las palabras. */
export async function buscarNormas(
  q: string,
  limite = 12,
): Promise<{ normas: NormaEncontrada[]; total: number; generadoEn: string | null }> {
  try {
    const crudo = JSON.parse(
      await readFile(path.join(process.cwd(), "public", "data", "normativa.json"), "utf8"),
    ) as { generadoEn: string; busquedas: Record<string, FilaInstantanea[]> };
    const hallazgos: NormaEncontrada[] = [];
    // El origen repite algunas normas (fe de erratas, la misma ley dos veces):
    // una norma es su tipo, su número y su fecha.
    const vistas = new Set<string>();
    for (const filas of Object.values(crudo.busquedas)) {
      for (const f of filas) {
        if (!f.Titulo || !coincide(q, `${f.Titulo} ${f.Numero ?? ""}`)) continue;
        const tipo = TIPO[f.TipoDocumento ?? 0] ?? "Norma";
        const numero = (f.Numero ?? "").trim();
        const clave = `${tipo}|${numero}|${f.FechaPromulgacion?.slice(0, 10) ?? ""}`;
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        const ruta = RUTA_NORMA[normalize(tipo)];
        hallazgos.push({
          tipo,
          numero,
          titulo: f.Titulo,
          fecha: f.FechaPromulgacion?.slice(0, 10) ?? null,
          href: ruta && /^\d{1,4}-\d{2,4}$/.test(numero) ? `/normativa/${ruta}/${numero}` : null,
        });
      }
    }
    hallazgos.sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
    return { normas: hallazgos.slice(0, limite), total: hallazgos.length, generadoEn: crudo.generadoEn };
  } catch (err) {
    console.error(`[buscar] normativa: ${String(err)}`);
    return { normas: [], total: 0, generadoEn: null };
  }
}

export interface CargoEncontrado {
  cargo: string;
  plazas: number;
  instituciones: number;
}

/** Cargos de la foto de nómina que contienen todas las palabras. */
export async function buscarCargos(q: string, limite = 8): Promise<CargoEncontrado[]> {
  try {
    const data = JSON.parse(
      await readFile(path.join(process.cwd(), "public", "data", "nomina.json"), "utf8"),
    ) as { cargos: string[]; rows: [number, number, number, number][] };
    const indices = new Set(
      data.cargos.flatMap((c, i) => (coincide(q, c) ? [i] : [])),
    );
    if (indices.size === 0) return [];
    const porCargo = new Map<number, { plazas: number; inst: Set<number> }>();
    for (const [inst, , cargo] of data.rows) {
      if (!indices.has(cargo)) continue;
      const a = porCargo.get(cargo) ?? { plazas: 0, inst: new Set<number>() };
      a.plazas += 1;
      a.inst.add(inst);
      porCargo.set(cargo, a);
    }
    return [...porCargo.entries()]
      .map(([c, a]) => ({ cargo: data.cargos[c], plazas: a.plazas, instituciones: a.inst.size }))
      .sort((a, b) => b.plazas - a.plazas)
      .slice(0, limite);
  } catch (err) {
    console.error(`[buscar] nómina: ${String(err)}`);
    return [];
  }
}
