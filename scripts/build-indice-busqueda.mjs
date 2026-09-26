#!/usr/bin/env node
/**
 * Genera public/data/busqueda/indice.json.br: el índice por palabra del
 * buscador (Orama) **ya construido**, para que el servidor no lo arme en cada
 * arranque en frío.
 *
 * Armarlo es insertar las ~68 mil entradas del corpus una por una: ~3.8 s en
 * esta máquina, la mayor parte del primer `/buscar` de cada instancia.
 * Cargarlo hecho es leer este archivo, descomprimirlo y `JSON.parse`: ~0.65 s.
 *
 * Lo que se guarda es `save(db)` de `@orama/orama` —la misma estructura que
 * serializa `@orama/plugin-data-persistence`, sin el plugin, por lo medido el
 * 2026-09-26 (docs/PLAN-ACCESO.md §6 bis)—, con dos recortes que no cambian
 * ningún resultado (se comprueba abajo, consulta por consulta):
 *
 *  - sin el índice de orden (`sort: { enabled: false }` en el esquema): nadie
 *    ordena por un campo;
 *  - sin la copia de los documentos: el servidor solo usa el id de cada
 *    acierto y lee la entrada del corpus, que ya tiene en memoria.
 *
 * El texto va precedido de una línea con la etiqueta del corpus (fecha,
 * huella y número de entradas): si alguien regenera el corpus y no esto, el
 * servidor no la reconoce y construye el índice en memoria, como antes.
 *
 * El esquema y el tokenizador vienen de `lib/busqueda-esquema.ts`, el mismo
 * módulo que usa el servidor: si discreparan, las raíces guardadas no serían
 * las de la consulta.
 *
 * Se corre **después** de `python3 scripts/build-busqueda.py`. Sin red.
 *
 * Uso:
 *     node --no-warnings scripts/build-indice-busqueda.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { insertMultiple, load, save, search } from "@orama/orama";
import { aDocumento, etiquetaCorpus, indiceVacio } from "../lib/busqueda-esquema.ts";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "data", "busqueda");
const corpus = JSON.parse(readFileSync(path.join(DIR, "corpus.json"), "utf8"));

let t = performance.now();
const db = indiceVacio();
await insertMultiple(
  db,
  corpus.docs.map((d, i) => aDocumento(d, i, corpus.origenes)),
  2000,
);
const msInsertar = performance.now() - t;

const crudo = save(db);
crudo.docs = { docs: {}, count: crudo.docs.count };
const etiqueta = etiquetaCorpus(corpus);
const texto = `${etiqueta}\n${JSON.stringify(crudo)}`;
const br = zlib.brotliCompressSync(Buffer.from(texto), {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: texto.length,
  },
});
const destino = path.join(DIR, "indice.json.br");
writeFileSync(destino, br);

// Lo que el servidor hará: descomprimir, leer la etiqueta, cargar.
t = performance.now();
const leido = zlib.brotliDecompressSync(readFileSync(destino)).toString("utf8");
const corte = leido.indexOf("\n");
if (leido.slice(0, corte) !== etiqueta) throw new Error("la etiqueta no sobrevivió al viaje");
const cargado = indiceVacio();
load(cargado, JSON.parse(leido.slice(corte + 1)));
const msCargar = performance.now() - t;

// Mismos aciertos y mismas puntuaciones, con y sin tipo, con y sin errata.
const CONSULTAS = [
  ["agua potable"], ["ministerio de trabajo"], ["educacion"], ["escuelas"], ["plaza lama"],
  ["constructora"], ["chofer", "cargo"], ["presupusto"], ["ley 47-20"], ["101786159"],
  ["hospital", "institucion"], ["corrupcion"], ["salud mental", "norma"], ["carretera", "obra"],
];
const firma = (d) =>
  CONSULTAS.map(([q, tipo]) =>
    [0, 1]
      .map((tolerance) =>
        search(d, {
          term: q,
          properties: ["ti", "x", "o"],
          boost: { ti: 3, x: 1, o: 0.5 },
          threshold: 0,
          tolerance,
          limit: 200,
          ...(tipo ? { where: { t: { eq: tipo } } } : {}),
        })
          .hits.map((h) => `${h.id}:${h.score.toFixed(9)}`)
          .join(","),
      )
      .join("/"),
  );
const antes = firma(db);
const despues = firma(cargado);
const distintas = CONSULTAS.filter((_, i) => antes[i] !== despues[i]).map(([q]) => q);
if (distintas.length) {
  console.error(`El índice guardado no responde igual que el construido: ${distintas.join(", ")}`);
  process.exit(1);
}

console.error(
  `${corpus.docs.length} entradas · ${(br.length / 1e6).toFixed(2)} MB (${(texto.length / 1e6).toFixed(1)} MB sin comprimir) · ` +
    `construir ${Math.round(msInsertar)} ms, cargar ${Math.round(msCargar)} ms · ${CONSULTAS.length} consultas idénticas`,
);
