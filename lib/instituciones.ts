/**
 * La institución — el nodo que une las verticales.
 *
 * El mismo ministerio es una unidad de compra en la DGCP, un capítulo en el
 * SIGEF, un código en la nómina y una etiqueta en la Consultoría Jurídica.
 * `public/data/instituciones.json` (generado por `scripts/build-instituciones.py`)
 * es el cruce versionado entre los cuatro: un archivo, no una base de datos.
 * La entidad es la **unidad de compra** —la más fina con código estable— y su
 * presupuesto es el del capítulo al que la DGCP la adscribe.
 *
 * Este módulo solo lee el cruce y compone; cada dato sigue viniendo de su
 * capa (`lib/dgcp.ts`, `lib/fiscal.ts`, `lib/nomina-server.ts`,
 * `lib/normativa.ts`). Ver docs/PLAN-ACCESO.md §2 (1.1) y §3 (2.3).
 */

import datos from "@/public/data/instituciones.json";
import { unstable_cache } from "next/cache";
import { dgcpFetch, normalize, type Contrato, type Proceso } from "@/lib/dgcp";

export interface Institucion {
  /** Código de unidad de compra de la DGCP. */
  id: number;
  nombre: string;
  acronimo: string;
  /** «Institución», «Gobierno local», «Hospital»… (tipo de la DGCP). */
  tipo: string;
  /** Capítulo presupuestario (SIGEF) al que la adscribe la DGCP. */
  capitulo: string | null;
  /** Código en `public/data/nomina.json`, si su nómina está en la foto. */
  nomina: string | null;
  /** Etiquetas de la Consultoría Jurídica que la nombran. */
  consultoria: string[];
}

export const INSTITUCIONES: Institucion[] = (
  datos as { instituciones: Institucion[] }
).instituciones;

const POR_ID = new Map(INSTITUCIONES.map((i) => [i.id, i]));

/** Tramo legible de la URL: `/instituciones/5-mopc`. El número manda. */
export function slugInstitucion(i: Institucion): string {
  const base = normalize(i.acronimo || i.nombre)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base ? `${i.id}-${base}` : String(i.id);
}

export function hrefInstitucion(i: Institucion): string {
  return `/instituciones/${slugInstitucion(i)}`;
}

/** La institución de un tramo de URL (`5-mopc` o `5`), o `null`. */
export function institucionDeSlug(slug: string): Institucion | null {
  const m = /^(\d{1,6})(?:-|$)/.exec(slug);
  return m ? (POR_ID.get(Number(m[1])) ?? null) : null;
}

export function institucionPorId(id: number | string): Institucion | null {
  return POR_ID.get(Number(id)) ?? null;
}

/** Las unidades de compra adscritas a un capítulo presupuestario. */
export function institucionesDelCapitulo(capitulo: string): Institucion[] {
  return INSTITUCIONES.filter((i) => i.capitulo === capitulo);
}

const VACIAS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "para", "a", "al", "en", "rep", "dom"]);

/** Las palabras con contenido de un nombre, sin siglas entre paréntesis y sin plural. */
function palabrasDeNombre(v: string): Set<string> {
  return new Set(
    normalize(v.replace(/\([^)]*\)/g, " "))
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1 && !VACIAS.has(w))
      .map((w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)),
  );
}

/**
 * La unidad de compra que **encabeza** un capítulo: la que lleva su nombre
 * —el Ministerio de Educación en el capítulo «Ministerio de Educación»—, no
 * el INABIE ni la ARS de los maestros que la DGCP adscribe al mismo capítulo.
 *
 * El cruce no trae ese dato, así que se deduce del nombre: la unidad cuyo
 * nombre comparte con el del capítulo al menos la mitad de sus palabras con
 * contenido, contadas sobre las de los dos (así «Dirección de Proyectos
 * Estratégicos de la Presidencia» no encabeza «Presidencia de la República»
 * por contener sus dos palabras). Si ninguna llega, no hay cabeza —el
 * capítulo «Administración de obligaciones del Tesoro» no es la DGII aunque
 * sea su única unidad— y quien llama no enlaza el capítulo a ninguna ficha:
 * un enlace adivinado es peor que ninguno.
 */
export function cabezaDelCapitulo(nombreCapitulo: string, unidades: Institucion[]): Institucion | null {
  const buscadas = palabrasDeNombre(nombreCapitulo);
  if (buscadas.size === 0) return null;
  let mejor: { i: Institucion; puntos: number } | null = null;
  for (const i of unidades) {
    const suyas = palabrasDeNombre(i.nombre);
    const comunes = [...buscadas].filter((w) => suyas.has(w)).length;
    const puntos = comunes / (buscadas.size + suyas.size - comunes);
    // A igualdad, la de tipo «Institución» y luego la de nombre más corto.
    const gana =
      !mejor ||
      puntos > mejor.puntos ||
      (puntos === mejor.puntos &&
        (Number(i.tipo === "Institución") - Number(mejor.i.tipo === "Institución") ||
          mejor.i.nombre.length - i.nombre.length) > 0);
    if (gana) mejor = { i, puntos };
  }
  return mejor && mejor.puntos >= 0.5 ? mejor.i : null;
}

/** La institución cuya nómina lleva ese código, si está en el cruce. */
export function institucionDeNomina(codigo: string): Institucion | null {
  return INSTITUCIONES.find((i) => i.nomina === codigo) ?? null;
}

/**
 * Coincidencia por nombre o acrónimo, sin tildes. Los ministerios y las
 * instituciones centrales van antes que hospitales y ayuntamientos, que son
 * muchos y rara vez lo que se busca por un nombre corto.
 */
export function buscarInstituciones(q: string, limite = 30): Institucion[] {
  const needle = normalize(q.trim());
  if (!needle) return [];
  const peso = (i: Institucion) =>
    (normalize(i.acronimo) === needle ? 0 : 10) +
    (i.tipo === "Institución" ? 0 : i.tipo === "Gobierno local" ? 2 : 1);
  return INSTITUCIONES.filter(
    (i) => normalize(i.nombre).includes(needle) || normalize(i.acronimo).includes(needle),
  )
    .sort((a, b) => peso(a) - peso(b) || a.nombre.localeCompare(b.nombre, "es"))
    .slice(0, limite);
}

/**
 * Instituciones nombradas **por su nombre completo** en un texto oficial —el
 * enunciado de un proyecto de ley—. Solo nombres largos (de 18 letras o más)
 * y sin hospitales ni ayuntamientos, que se repiten entre sí: un puente
 * adivinado es peor que ninguno, así que «Ministerio de Salud Pública y
 * Asistencia Social» entra y «Salud» no.
 */
export function institucionesNombradasEn(texto: string, limite = 5): Institucion[] {
  const plano = (v: string) => ` ${normalize(v).replace(/[^a-z0-9]+/g, " ").trim()} `;
  const heno = plano(texto);
  return INSTITUCIONES.filter((i) => {
    if (i.tipo === "Hospital" || i.tipo === "Gobierno local") return false;
    const aguja = plano(i.nombre.replace(/\([^)]*\)/g, " "));
    return aguja.trim().length >= 18 && heno.includes(aguja);
  }).slice(0, limite);
}

/* --------------------------------------------------------------- compras */

export interface ProveedorDeInstitucion {
  rpe: string;
  nombre: string;
  n: number;
  monto: number;
}

export interface ComprasDeInstitucion {
  /** Contratos en todo el registro (censo del origen). */
  totalContratos: number;
  /** Contratos leídos: los más recientes, hasta 1.000. */
  leidos: number;
  desde: string | null;
  hasta: string | null;
  /** Monto vigente en pesos de los contratos leídos. */
  montoDop: number;
  proveedores: ProveedorDeInstitucion[];
  /** Cuota del primer proveedor sobre el monto leído (0–1). */
  concentracion: number | null;
  recientes: Contrato[];
  senales: SenalesDeCompra | null;
}

/**
 * Señales de los procesos de los últimos doce meses, contadas sobre lo que el
 * origen publica. No son acusaciones: son las preguntas que un ciudadano
 * haría primero. La ley permite la excepción; lo que se mira es cuánta.
 */
export interface SenalesDeCompra {
  procesos: number;
  /** Censo del año que declara el origen. */
  universo: number;
  /** El censo del origen superó lo leído (más de 1.000 en el año). */
  truncado: boolean;
  excepcion: number;
  emergencia: number;
  proveedorUnico: number;
  noPlaneada: number;
  desiertos: number;
  abiertos: number;
}

const ESTADOS_VIGENTES = new Set(["Activo", "Modificado", "Cerrado"]);
const ABIERTOS = /publicado|sobres/i;

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * El resumen de compras de una institución, cacheado una hora **ya calculado**.
 * Las respuestas crudas de un ministerio grande pasan de 2 MB (MINERD:
 * 1.000 procesos del año ≈ 2,2 MB) y el caché de datos de Next no guarda
 * nada por encima de eso: sin este envoltorio, cada visita volvía a pedir a
 * la DGCP. El resumen pesa unos kilobytes. Un fallo no se cachea.
 */
const comprasCacheadas = unstable_cache(
  async (id: number) => {
    const r = await calcularCompras(id);
    if (!r) throw new Error("la DGCP no respondió");
    return r;
  },
  ["compras-de-institucion"],
  { revalidate: 3600 },
);

export async function getComprasDeInstitucion(id: number): Promise<ComprasDeInstitucion | null> {
  try {
    return await comprasCacheadas(id);
  } catch (err) {
    console.error(`[instituciones] compras ${id}: ${String(err)}`);
    return null;
  }
}

async function calcularCompras(id: number): Promise<ComprasDeInstitucion | null> {
  const hoy = new Date();
  const haceUnAnio = new Date(hoy);
  haceUnAnio.setFullYear(hoy.getFullYear() - 1);

  const [contratos, procesos] = await Promise.all([
    dgcpFetch<Contrato>("/contratos", { unidad_compra: id, page: 1, limit: 1000 }, 0).catch(
      () => null,
    ),
    dgcpFetch<Proceso>(
      "/procesos",
      { unidad_compra: id, startdate: isoDia(haceUnAnio), enddate: isoDia(hoy), limit: 1000 },
      0,
    ).catch(() => null),
  ]);
  // Las dos lecturas o ninguna: con una sola, la ficha diría «0 contratos»
  // de un ministerio cuya consulta de contratos simplemente falló, y ese
  // resumen quedaría cacheado una hora.
  if (!contratos || !procesos) return null;

  const lista = contratos?.payload.content ?? [];
  const porProveedor = new Map<string, ProveedorDeInstitucion>();
  let montoDop = 0;
  let desde: string | null = null;
  let hasta: string | null = null;
  for (const c of lista) {
    const f = (c.fecha_adjudicacion ?? "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) {
      if (!desde || f < desde) desde = f;
      if (!hasta || f > hasta) hasta = f;
    }
    if (!ESTADOS_VIGENTES.has(c.estado_contrato) || c.divisa !== "DOP") continue;
    const monto = c.valor_contratado || 0;
    if (monto <= 0) continue;
    montoDop += monto;
    const clave = c.rpe || c.razon_social;
    const p = porProveedor.get(clave) ?? { rpe: c.rpe, nombre: c.razon_social, n: 0, monto: 0 };
    p.n += 1;
    p.monto += monto;
    porProveedor.set(clave, p);
  }
  const proveedores = [...porProveedor.values()].sort((a, b) => b.monto - a.monto);

  let senales: SenalesDeCompra | null = null;
  if (procesos) {
    const ps = procesos.payload.content;
    const cuenta = (f: (p: Proceso) => boolean) => ps.filter(f).length;
    senales = {
      procesos: ps.length,
      universo: procesos.totalResults ?? ps.length,
      truncado: (procesos.totalResults ?? ps.length) > ps.length,
      excepcion: cuenta((p) => /excepci/i.test(p.modalidad)),
      emergencia: cuenta((p) => /emergencia|urgencia/i.test(p.tipo_excepcion ?? "")),
      proveedorUnico: cuenta((p) => /proveedor .nico|exclusividad/i.test(p.tipo_excepcion ?? "")),
      noPlaneada: cuenta((p) => p.adquisicion_planeada === "No"),
      desiertos: cuenta((p) => /desierto/i.test(p.estado_proceso)),
      abiertos: cuenta((p) => ABIERTOS.test(p.estado_proceso)),
    };
  }

  return {
    totalContratos: contratos?.totalResults ?? lista.length,
    leidos: lista.length,
    desde,
    hasta,
    montoDop,
    proveedores: proveedores.slice(0, 8),
    concentracion: montoDop > 0 && proveedores[0] ? proveedores[0].monto / montoDop : null,
    recientes: lista.slice(0, 8),
    senales,
  };
}
