/**
 * El motor del buscador de toda la plataforma: `/buscar`, `/api/buscar` y
 * las sugerencias de la paleta ⌘K.
 *
 * Dos lecturas de la misma consulta, fundidas en una lista:
 *
 *  1. **Por palabra** — Orama (`@orama/orama`, Apache-2.0): BM25 sobre título,
 *     texto auxiliar y quién publica, con raíces del español («escuelas»
 *     encuentra «escuela»), sin palabras vacías, sin tildes, y tolerancia de
 *     una errata en palabras largas («presupusto»). Todas las palabras
 *     tienen que estar.
 *  2. **Por tema** — un embedding estático (Model2Vec
 *     `potion-multilingual-128M`, MIT, podado al español por
 *     `scripts/build-modelo-semantico.py`): la consulta se tokeniza con
 *     `@huggingface/tokenizers` y se promedia su tabla; los vectores de las
 *     36 mil entradas que lo llevan (todas menos los proveedores, cuyo
 *     nombre no dice de qué tratan) vienen hechos de
 *     `scripts/build-busqueda.py`. «Agua potable» encuentra los conjuntos de
 *     CORAMON aunque se llamen «Producción de agua».
 *
 * Se funden por **rango recíproco** (RRF), que no pide que BM25 y coseno
 * hablen en la misma escala. Cada resultado dice por qué salió: sus
 * palabras están, o solo su tema se parece. Lo segundo se declara en la
 * interfaz; no se hace pasar por una coincidencia.
 *
 * Nada de esto es una base de datos (CLAUDE.md, la invariante): el corpus,
 * los vectores, el modelo y el índice por palabra ya construido
 * (`indice.json.br`, de `scripts/build-indice-busqueda.mjs`) son archivos
 * versionados en `public/data/busqueda`, leídos una vez por instancia y
 * guardados en memoria.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { brotliDecompressSync } from "node:zlib";
import { insertMultiple, load, search, type AnyOrama } from "@orama/orama";
import { Tokenizer } from "@huggingface/tokenizers";
import { aDocumento, etiquetaCorpus, indiceVacio } from "@/lib/busqueda-esquema";
import { sinTildes } from "@/lib/raiz";
import { enlace } from "@/lib/grafo";

export type TipoResultado = "institucion" | "proveedor" | "norma" | "obra" | "documento" | "dato" | "cargo";

/** El orden en que se nombran los tipos: el de las verticales en `/buscar`. */
export const TIPOS_RESULTADO: { clave: TipoResultado; etiqueta: string; plural: string }[] = [
  { clave: "institucion", etiqueta: "Institución", plural: "Instituciones" },
  { clave: "proveedor", etiqueta: "Proveedor", plural: "Proveedores" },
  { clave: "norma", etiqueta: "Norma", plural: "Normativa" },
  { clave: "obra", etiqueta: "Obra", plural: "Obras públicas" },
  { clave: "documento", etiqueta: "Documento", plural: "Documentos" },
  { clave: "dato", etiqueta: "Datos abiertos", plural: "Datos abiertos" },
  { clave: "cargo", etiqueta: "Cargo", plural: "Cargos en la nómina" },
];

export function esTipoResultado(v: string | undefined | null): v is TipoResultado {
  return TIPOS_RESULTADO.some((t) => t.clave === v);
}

/** Una entrada del corpus tal como la escribe `scripts/build-busqueda.py`. */
interface Entrada {
  t: TipoResultado;
  ti: string;
  x?: string;
  d?: string;
  o?: number;
  h?: string;
  f?: string;
  v?: number;
  n?: number;
  m?: number;
  p?: number;
  e?: 1;
  /** Proveedores: RPE, RNC (si el cruce con la DGII lo trae), contratos y años. */
  r?: string;
  c?: string;
  k?: number;
  a?: [number, number];
}

interface Corpus {
  generado: string;
  /** Huella de las entradas: ata el índice guardado a este corpus. */
  huella?: string;
  instantaneas: Partial<Record<TipoResultado, string>>;
  dimensiones: number;
  piezas: number;
  /** Las primeras `vectorizados` entradas llevan vector; los proveedores, no. */
  vectorizados?: number;
  origenes: string[];
  docs: Entrada[];
}

/** Cómo se encontró un resultado. */
export type Via = "palabra" | "tema" | "ambas";

export interface Resultado {
  tipo: TipoResultado;
  /** El título tal como lo publica la fuente (puede venir en MAYÚSCULAS). */
  titulo: string;
  /** Lo que la fuente dice al lado: siglas, número, estado, formatos. */
  detalle: string | null;
  /** Quién publica o ejecuta, si se sabe. */
  origen: string | null;
  href: string | null;
  /** Un archivo o una ficha en el sitio de otra institución. */
  externo: boolean;
  fecha: string | null;
  /** Obras: su valor en pesos. */
  valor: number | null;
  /** Cargos: plazas y en cuántas instituciones. */
  plazas: number | null;
  instituciones: number | null;
  /** Proveedores: contratos desde 2015 en la instantánea. */
  contratos: number | null;
  via: Via;
}


/* --------------------------------------------------------------- carga */

const DIR = path.join(process.cwd(), "public", "data", "busqueda");

interface Motor {
  corpus: Corpus;
  db: AnyOrama;
  tokenizer: Tokenizer;
  especiales: Set<number>;
  dim: number;
  /** Cuántas entradas, desde la primera, tienen vector. */
  vectorizados: number;
  /** Tabla del modelo: filas int8 × su escala. */
  tabla: Int8Array;
  escalaTabla: Float32Array;
  /** Vectores de las entradas, unitarios: filas int8 × su escala. */
  vectores: Int8Array;
  escalaVectores: Float32Array;
}

/** Filas int8 (n × dim) seguidas de una escala float32 por fila. */
function partir(buf: Buffer, n: number, dim: number): [Int8Array, Float32Array] {
  const filas = new Int8Array(buf.buffer, buf.byteOffset, n * dim);
  // Copia alineada: un Float32Array exige desplazamiento múltiplo de 4.
  const escalas = new Float32Array(n);
  new Uint8Array(escalas.buffer).set(buf.subarray(n * dim, n * dim + n * 4));
  return [filas, escalas];
}

/**
 * El índice por palabra: el guardado si es de este corpus, o construido aquí.
 * Cargar el guardado cuesta ~0.7 s; construirlo, ~3.8 s (68 mil entradas).
 * Si falta, está roto o su etiqueta no es la del corpus —alguien regeneró el
 * corpus y no el índice—, se construye: más lento, nunca distinto.
 */
async function indicePorPalabra(corpus: Corpus): Promise<AnyOrama> {
  const guardado = await readFile(path.join(DIR, "indice.json.br")).catch(() => null);
  if (guardado) {
    try {
      const texto = brotliDecompressSync(guardado).toString("utf8");
      const corte = texto.indexOf("\n");
      if (texto.slice(0, corte) === etiquetaCorpus(corpus)) {
        const db = indiceVacio();
        load(db, JSON.parse(texto.slice(corte + 1)));
        return db;
      }
      console.warn("[busqueda] indice.json.br es de otro corpus: se construye en memoria (corre scripts/build-indice-busqueda.mjs)");
    } catch (err) {
      console.warn(`[busqueda] indice.json.br no se pudo leer: se construye en memoria (${String(err)})`);
    }
  }
  const db = indiceVacio();
  await insertMultiple(
    db,
    corpus.docs.map((d, i) => aDocumento(d, i, corpus.origenes)),
    2000,
  );
  return db;
}

async function cargar(): Promise<Motor> {
  const [crudoCorpus, crudoTok, crudoMeta, bufModelo, bufVectores] = await Promise.all([
    readFile(path.join(DIR, "corpus.json"), "utf8"),
    readFile(path.join(DIR, "tokenizer.json"), "utf8"),
    readFile(path.join(DIR, "modelo.json"), "utf8"),
    readFile(path.join(DIR, "modelo.bin")),
    readFile(path.join(DIR, "vectores.bin")),
  ]);
  const corpus = JSON.parse(crudoCorpus) as Corpus;
  const meta = JSON.parse(crudoMeta) as { piezas: number; dimensiones: number; especiales: number[] };
  if (meta.piezas !== corpus.piezas || meta.dimensiones !== corpus.dimensiones) {
    // Vectores de otro modelo: compararlos daría ruido con apariencia de tema.
    throw new Error("corpus y modelo no coinciden: vuelve a correr scripts/build-busqueda.py");
  }
  const dim = meta.dimensiones;
  const vectorizados = corpus.vectorizados ?? corpus.docs.length;
  if (bufVectores.length !== vectorizados * (dim + 4)) {
    throw new Error("corpus y vectores no coinciden: vuelve a correr scripts/build-busqueda.py");
  }
  const [tabla, escalaTabla] = partir(bufModelo, meta.piezas, dim);
  const [vectores, escalaVectores] = partir(bufVectores, vectorizados, dim);

  return {
    corpus,
    db: await indicePorPalabra(corpus),
    tokenizer: new Tokenizer(JSON.parse(crudoTok), {}),
    especiales: new Set(meta.especiales),
    dim,
    vectorizados,
    tabla,
    escalaTabla,
    vectores,
    escalaVectores,
  };
}

let memo: Promise<Motor> | null = null;
function motor(): Promise<Motor> {
  memo ??= cargar().catch((err) => {
    memo = null;
    throw err;
  });
  return memo;
}

/* ------------------------------------------------------------- lecturas */

/** El vector unitario de un texto: promedio de las filas de sus piezas. */
function embeber(m: Motor, texto: string): Float32Array | null {
  const ids = m.tokenizer
    .encode(texto.toLowerCase(), { add_special_tokens: false })
    .ids.filter((id) => !m.especiales.has(id));
  if (ids.length === 0) return null;
  const v = new Float32Array(m.dim);
  for (const id of ids) {
    const s = m.escalaTabla[id];
    const base = id * m.dim;
    for (let k = 0; k < m.dim; k++) v[k] += m.tabla[base + k] * s;
  }
  let norma = 0;
  for (let k = 0; k < m.dim; k++) norma += v[k] * v[k];
  norma = Math.sqrt(norma);
  if (!norma) return null;
  for (let k = 0; k < m.dim; k++) v[k] /= norma;
  return v;
}

/**
 * Por debajo de este coseno el parecido es ruido: medido sobre el corpus,
 * «corrupción» contra «CORONEL» da 0,46 y «agua potable» contra «Producción
 * de agua potable» 0,80. Un resultado solo por tema tiene que pasarlo.
 */
const UMBRAL_TEMA = 0.55;
/** Cuántos vecinos por tema entran a la fusión. */
const VECINOS = 150;

function porTema(m: Motor, v: Float32Array | null, tipo?: TipoResultado): { i: number; s: number }[] {
  if (!v) return [];
  const docs = m.corpus.docs;
  const mejores: { i: number; s: number }[] = [];
  let piso = UMBRAL_TEMA;
  // Los proveedores van al final y sin vector: el tema no los alcanza.
  for (let i = 0; i < m.vectorizados; i++) {
    if (tipo && docs[i].t !== tipo) continue;
    const base = i * m.dim;
    let s = 0;
    for (let k = 0; k < m.dim; k++) s += v[k] * m.vectores[base + k];
    s *= m.escalaVectores[i];
    if (s < piso) continue;
    mejores.push({ i, s });
    if (mejores.length > VECINOS * 2) {
      mejores.sort((a, b) => b.s - a.s).length = VECINOS;
      piso = mejores[VECINOS - 1].s;
    }
  }
  return mejores.sort((a, b) => b.s - a.s).slice(0, VECINOS);
}

/** Tope de coincidencias por palabra que entran a la fusión. */
const TOPE_PALABRA = 20_000;

interface PorPalabra {
  ids: number[];
  total: number;
  tolerancia: number;
  /** Todos los que llevan todas las palabras, más allá del tope de `ids`. */
  todos: Set<number>;
}

/** ¿Se puede perdonar una errata? Ver `porPalabra`. */
function admiteErrata(q: string): boolean {
  const palabras = q.split(/\s+/).filter(Boolean);
  return palabras.length <= 2 && palabras.every((w) => /^\p{L}{6,}$/u.test(w));
}

/** Sin tope práctico: el corpus entero cabe. */
const TODOS = 50_000;

interface Arbol {
  node: { find(p: { term: string; exact?: boolean; tolerance?: number }): Record<string, number[]> };
}

/**
 * Los documentos que llevan **esa palabra**, leídos del árbol del índice.
 *
 * `search` de Orama busca cada raíz como **prefijo**: «agua» es `agu`, y
 * `agu` empieza `aguj`, `agustin` y `aguilar`, así que «agua» traía a
 * «Zaglul Aguirreurreta» y a la Industria Nacional de la Aguja; «100», los
 * RPE que empiezan por 100. Aquí la raíz tiene que ser la del documento. El
 * prefijo solo se admite en la **última** palabra, si el lematizador no la
 * tocó y no es un número: es la que se está escribiendo («minis» →
 * ministerio). Con tolerancia, la distancia de edición de Orama.
 */
function documentosCon(m: Motor, palabra: string, tolerancia: number, ultima: boolean): Set<string> {
  const db = m.db as unknown as {
    data: { index: { indexes: Record<string, Arbol> } };
    internalDocumentIDStore: { internalIdToId: string[] };
  };
  const externo = db.internalDocumentIDStore.internalIdToId;
  const salida = new Set<string>();
  const w = palabra.toLowerCase();
  for (const raiz of m.db.tokenizer.tokenize(palabra, "spanish")) {
    const prefijo = ultima && tolerancia === 0 && raiz === sinTildes(w) && !/\d/.test(raiz) && raiz.length >= 3;
    for (const prop of ["ti", "x", "o"]) {
      const arbol = db.data.index.indexes[prop];
      if (!arbol) continue;
      const hallado = arbol.node.find({ term: raiz, exact: !prefijo && tolerancia === 0, tolerance: tolerancia });
      for (const ids of Object.values(hallado)) for (const id of ids) salida.add(externo[id - 1]);
    }
  }
  return salida;
}

async function porPalabra(m: Motor, q: string, tipo?: TipoResultado, tolerancia?: number): Promise<PorPalabra> {
  const donde = tipo ? { where: { t: { eq: tipo } } } : {};
  const buscarCon = (term: string, t: number, limit: number, threshold: number) =>
    search(m.db, {
      term,
      properties: ["ti", "x", "o"],
      boost: { ti: 3, x: 1, o: 0.5 },
      threshold,
      tolerance: t,
      limit,
      ...donde,
    });

  /*
    Todas las palabras tienen que estar: «agua potable» no es «agua» o
    «potable». El `threshold: 0` de Orama lo exige **dentro de un mismo
    campo** y contando variantes por prefijo, así que «agua CORAMON» (una en
    el título, otra en quién publica) no salía y «ministerio trabajo» traía
    todos los ministerios. Se hace a mano: cada palabra por separado, se
    cruzan los conjuntos, y el orden es el BM25 de la consulta entera.
  */
  const conPalabras = async (t: number): Promise<PorPalabra> => {
    const palabras = q
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w && m.db.tokenizer.tokenize(w, "spanish").length > 0);
    // Solo palabras vacías o signos («de la», «¿?»): no hay nada que buscar
    // por palabra, y el tema de «de la» es ruido.
    if (palabras.length === 0) return { ids: [], total: 0, tolerancia: t, todos: new Set() };
    const conjuntos = palabras.map((w, n) => documentosCon(m, w, t, n === palabras.length - 1));
    const todas = new Set([...conjuntos[0]].filter((id) => conjuntos.every((c) => c.has(id))));
    if (todas.size === 0) return { ids: [], total: 0, tolerancia: t, todos: new Set() };
    // El orden es el BM25 de la consulta entera, entre los que llevan todas.
    const r = await buscarCon(q, t, TODOS, 1);
    const ids = r.hits.filter((h) => todas.has(h.id)).map((h) => Number(h.id));
    return { ids: ids.slice(0, TOPE_PALABRA), total: ids.length, tolerancia: t, todos: new Set(ids) };
  };

  if (tolerancia !== undefined) return conPalabras(tolerancia);
  const exacta = await conPalabras(0);
  // Una errata solo se perdona cuando lo exacto no trajo nada, y solo en
  // consultas de una o dos palabras largas. La tolerancia se aplica a la
  // raíz: «agua» es «agu», y a distancia uno de «agr» salían los cargos de
  // agricultura. En una frase larga, mejor que conteste el tema.
  if (exacta.total === 0 && admiteErrata(q)) return conPalabras(1);
  return exacta;
}

/* --------------------------------------------------------------- fusión */

/** La constante de RRF de la literatura (Cormack et al., 2009). */
const K_RRF = 60;
/** El tema pesa menos que la palabra: acompaña, no manda. */
const PESO_TEMA = 0.6;

export const POR_PAGINA = 20;
/** Cuántos de cada tipo enseña la vista «Todo». */
const POR_GRUPO = 4;

function plano(s: string): string {
  return sinTildes(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/** «Decreto 38 25», «decreto núm. 38-25» y «Decreto 38-25» son la misma cita. */
function sinGuiones(s: string): string {
  return plano(s)
    .replace(/\b(n[uú]m(ero)?|no)\b\.?/g, " ")
    .replace(/[-.\s]+/g, " ")
    .trim();
}

export interface Grupo {
  tipo: TipoResultado;
  total: number;
  resultados: Resultado[];
}

export interface Hallazgos {
  /** La página pedida del tipo filtrado, o de todo mezclado. */
  resultados: Resultado[];
  /** Vista «Todo»: los mejores de cada tipo, en el orden de su mejor resultado. */
  grupos: Grupo[];
  /** Resultados del filtro actual que la lista puede recorrer. */
  total: number;
  /** Por tipo, sin el filtro de tipo: lo que dicen los filtros. */
  porTipo: Record<TipoResultado, number>;
  /**
   * Hubo más coincidencias por palabra que las que se ordenan (el tope de la
   * fusión): las cuentas son las del índice y la lista recorre las más
   * pertinentes.
   */
  truncado: boolean;
  /** Cuántos salieron solo por tema, en el filtro actual. */
  soloTema: number;
  /** Se perdonó una errata por palabra para encontrar algo. */
  conErrata: boolean;
  pagina: number;
  paginas: number;
  generado: string;
  instantaneas: Partial<Record<TipoResultado, string>>;
}

interface Fusion {
  /** Índices del corpus, del más pertinente al menos, sin copias. */
  orden: number[];
  via: Map<number, Via>;
  /** Documentos: los formatos en que se publicó el mismo archivo. */
  formatos: Map<number, string[]>;
}

/**
 * El archivo sin su extensión ni su copia: `…/Informe-2026.pdf`,
 * `…/Informe-2026.xlsx` y el `…/2026/03/Informe-2026-1.pdf` que WordPress
 * crea al subir otra vez lo mismo son un documento. La clave es el sitio, el
 * nombre del archivo y el título: «Tomo-1» y «Tomo-2» se titulan distinto y
 * no se juntan.
 */
function mismoArchivo(d: Entrada): string | null {
  if (d.t !== "documento" || !d.h) return null;
  const sitio = /^https?:\/\/([^/]+)/i.exec(d.h)?.[1] ?? "";
  const nombre = (d.h.split("/").pop() ?? "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/-\d{1,2}$/, "")
    .toLowerCase();
  return `${sitio}|${nombre}|${plano(d.ti)}`;
}

function fundir(m: Motor, consulta: string, palabra: PorPalabra, tema: { i: number }[]): Fusion {
  const docs = m.corpus.docs;
  const puntos = new Map<number, number>();
  const via = new Map<number, Via>();
  palabra.ids.forEach((i, rango) => {
    puntos.set(i, 1 / (K_RRF + rango));
    via.set(i, "palabra");
  });
  tema.forEach(({ i }, rango) => {
    puntos.set(i, (puntos.get(i) ?? 0) + PESO_TEMA / (K_RRF + rango));
    // Lleva todas las palabras aunque quedara fuera del tope: no es «por tema».
    via.set(i, via.has(i) || palabra.todos.has(i) ? "ambas" : "tema");
  });
  const exacta = plano(consulta);
  for (const [i, p] of puntos) {
    const d = docs[i];
    // Lo tecleado es el nombre, las siglas o la cita exactas («Ley 80-25»):
    // eso va primero.
    const nombrado =
      plano(d.ti) === exacta ||
      (d.t === "institucion" && plano(d.x ?? "") === exacta) ||
      (d.t === "norma" && sinGuiones(d.x ?? "") === sinGuiones(consulta));
    // Un ministerio antes que un hospital que se llama parecido.
    puntos.set(i, (nombrado ? p + 1 : p) / (1 + 0.15 * (d.p ?? 0)));
  }

  // Solo se juntan copias de verdad: el **mismo archivo** publicado en PDF y
  // en XLSX. Dos decretos «Que otorga exequátur» o dos obras con el mismo
  // nombre y distinto SNIP son resultados distintos aunque se titulen igual.
  const orden: number[] = [];
  const formatos = new Map<number, string[]>();
  const primero = new Map<string, number>();
  for (const i of [...puntos.keys()].sort((a, b) => puntos.get(b)! - puntos.get(a)!)) {
    const d = docs[i];
    const clave = mismoArchivo(d);
    const ya = clave === null ? undefined : primero.get(clave);
    if (ya === undefined) {
      if (clave !== null) primero.set(clave, i);
      orden.push(i);
      if (d.t === "documento" && d.d) formatos.set(i, [d.d]);
      continue;
    }
    const f = formatos.get(ya);
    if (f && d.d && !f.includes(d.d)) f.push(d.d);
    if (via.get(i) !== via.get(ya)) via.set(ya, "ambas");
  }
  return { orden, via, formatos };
}

/**
 * Busca `q` en todo el corpus. `tipo` filtra —y entonces la búsqueda por
 * palabra y por tema se hace dentro de ese tipo, para que su lista llegue
 * tan lejos como su cuenta—; las cuentas por tipo se dan siempre sin ese
 * filtro, para que los filtros digan cuánto hay en cada uno. Devuelve `null`
 * si el índice no se pudo cargar o la búsqueda falló: «no pudimos mirar» no
 * es «no hay nada».
 */
export async function buscarEnTodo(
  q: string,
  opts: { tipo?: TipoResultado; pagina?: number; porPagina?: number } = {},
): Promise<Hallazgos | null> {
  try {
    const m = await motor();
    const docs = m.corpus.docs;
    const consulta = q.trim().slice(0, 120);
    // Sin una palabra con contenido («de la», «¿?», «--») no hay tema: el
    // vector de las palabras vacías se parece a todo y traía 146 filas.
    const conContenido = m.db.tokenizer.tokenize(consulta, "spanish").length > 0;
    // Una cita («Ley 80-25», «decreto 38 25») busca una norma, no un tema: el
    // vector de «ley» y un número se parece a cualquier otra ley.
    const esCita = /\b\d{1,4}[-\s]\d{2,4}\b/.test(consulta);
    const vector = conContenido && !esCita ? embeber(m, consulta) : null;

    // Todo, sin filtro: las cuentas de los filtros y la vista «Todo».
    const palabra = await porPalabra(m, consulta);
    const tema = porTema(m, vector);
    const todo = fundir(m, consulta, palabra, tema);
    const porTipo = Object.fromEntries(TIPOS_RESULTADO.map((t) => [t.clave, 0])) as Record<TipoResultado, number>;
    for (const i of todo.orden) porTipo[docs[i].t] += 1;
    let truncado = palabra.total > palabra.ids.length;
    if (truncado) {
      // Más allá del tope, BM25 solo cuenta: cada tipo, dentro de su tipo.
      for (const t of TIPOS_RESULTADO) {
        const r = await porPalabra(m, consulta, t.clave, palabra.tolerancia);
        const solo = todo.orden.filter((i) => docs[i].t === t.clave && todo.via.get(i) === "tema").length;
        porTipo[t.clave] = Math.max(porTipo[t.clave], r.total + solo);
      }
    }

    // Un tipo elegido se busca dentro de ese tipo, con la misma tolerancia.
    // Los vecinos por tema son los mismos que contaron los filtros, para que
    // «Normativa 93» abra una lista de 93 y no de 150.
    let lista = todo;
    if (opts.tipo) {
      const soloTipo = await porPalabra(m, consulta, opts.tipo, palabra.tolerancia);
      truncado = soloTipo.total > soloTipo.ids.length;
      lista = fundir(m, consulta, soloTipo, tema.filter(({ i }) => docs[i].t === opts.tipo));
    }

    const resultado = (i: number) => aResultado(m.corpus, docs[i], lista.via.get(i)!, lista.formatos.get(i));
    const porPagina = opts.porPagina ?? POR_PAGINA;
    const paginas = Math.max(1, Math.ceil(lista.orden.length / porPagina));
    const pagina = Math.min(Math.max(1, opts.pagina ?? 1), paginas);

    const grupos: Grupo[] = [];
    for (const i of todo.orden) {
      const t = docs[i].t;
      let g = grupos.find((x) => x.tipo === t);
      if (!g) grupos.push((g = { tipo: t, total: porTipo[t], resultados: [] }));
      if (g.resultados.length < POR_GRUPO) {
        g.resultados.push(aResultado(m.corpus, docs[i], todo.via.get(i)!, todo.formatos.get(i)));
      }
    }

    return {
      resultados: lista.orden.slice((pagina - 1) * porPagina, pagina * porPagina).map(resultado),
      grupos,
      total: lista.orden.length,
      porTipo,
      truncado,
      soloTema: lista.orden.filter((i) => lista.via.get(i) === "tema").length,
      conErrata: palabra.tolerancia > 0 && palabra.total > 0,
      pagina,
      paginas,
      generado: m.corpus.generado,
      instantaneas: m.corpus.instantaneas,
    };
  } catch (err) {
    console.error(`[busqueda] ${String(err)}`);
    return null;
  }
}

const ENTERO = new Intl.NumberFormat("es-DO");

/** «RNC 101786159 · 37 contratos, 2015–2022»: lo que el corpus no escribe. */
function detalleProveedor(d: Entrada): string {
  const contratos = d.k ? `${ENTERO.format(d.k)} ${d.k === 1 ? "contrato" : "contratos"}` : null;
  const anios = d.a ? (d.a[0] === d.a[1] ? `${d.a[0]}` : `${d.a[0]}–${d.a[1]}`) : null;
  return [d.c && `RNC ${d.c}`, [contratos, anios].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
}

function aResultado(c: Corpus, d: Entrada, via: Via, formatos?: string[]): Resultado {
  const proveedor = d.t === "proveedor";
  return {
    tipo: d.t,
    titulo: d.ti,
    detalle: (formatos ? formatos.join(" · ") : proveedor ? detalleProveedor(d) : d.d) || null,
    origen: d.o === undefined ? null : c.origenes[d.o],
    href: proveedor && d.r ? enlace.proveedor(d.r) : (d.h ?? null),
    externo: d.e === 1,
    fecha: d.f ?? null,
    valor: d.v ?? null,
    plazas: d.n ?? null,
    instituciones: d.m ?? null,
    contratos: proveedor ? (d.k ?? null) : null,
    via,
  };
}
