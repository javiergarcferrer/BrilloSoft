/**
 * CSV de descarga: lo que una página ya calcula, en un archivo que abre Excel.
 *
 * No es un adaptador de fuente —no lee nada del Estado—: solo serializa filas
 * que ya trajo `lib/dgcp.ts` o `lib/normativa.ts`. Tres decisiones:
 *
 *  - BOM UTF-8 y fin de línea CRLF, para que Excel en español lea las tildes
 *    sin preguntar.
 *  - Una celda que empieza por `=`, `+`, `-` o `@` se antepone con `'`: un
 *    título del registro no se ejecuta como fórmula en la hoja de nadie.
 *  - El alcance viaja en la cabecera `X-Alcance` y en el nombre del archivo;
 *    el contenido es solo la tabla, para que cualquier programa la lea.
 */

export type ColumnaCsv<T> = [
  encabezado: string,
  valor: (fila: T) => string | number | null | undefined,
];

function celda(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function aCsv<T>(columnas: ColumnaCsv<T>[], filas: T[]): string {
  const lineas = [
    columnas.map(([h]) => celda(h)).join(","),
    ...filas.map((f) => columnas.map(([, v]) => celda(v(f))).join(",")),
  ];
  return "﻿" + lineas.join("\r\n") + "\r\n";
}

/** Respuesta de descarga con el alcance declarado en una cabecera legible. */
export function respuestaCsv(cuerpo: string, archivo: string, alcance: string): Response {
  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${archivo}"`,
      // Una cabecera HTTP no admite tildes: el alcance viaja sin ellas.
      "X-Alcance": alcance
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^\x20-\x7e]/g, ""),
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
