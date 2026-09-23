import { NextResponse } from "next/server";
import { getDirectorioLegisladores, type Legislador } from "@/lib/congreso";
import { aCsv, respuestaCsv, type ColumnaCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUMNAS: ColumnaCsv<Legislador>[] = [
  ["legislador_id", (l) => l.id],
  ["nombre", (l) => l.nombre],
  ["funcion", (l) => l.funcion],
  ["camara", (l) => l.camara],
  ["provincia", (l) => l.provincia],
  ["circunscripcion", (l) => l.circunscripcion],
  ["partido_siglas", (l) => l.partidoSiglas],
  ["partido", (l) => l.partidoNombre],
];

/**
 * El directorio de legisladores del período en CSV: el mismo que pinta
 * `/congreso/legisladores`, leído entero del SIL por demarcación. Si alguna
 * demarcación no contestó, el alcance lo dice.
 */
export async function GET() {
  const dir = await getDirectorioLegisladores();
  if (!dir) {
    return NextResponse.json({ error: "El SIL de la Cámara no respondió" }, { status: 502 });
  }
  const hoy = new Date().toISOString().slice(0, 10);
  const faltan = dir.fallidas.length > 0 ? ` Faltan: ${dir.fallidas.join(", ")}.` : "";
  return respuestaCsv(
    aCsv(COLUMNAS, dir.legisladores),
    `legisladores-${hoy}-${dir.legisladores.length}.csv`,
    `Directorio del SIL: ${dir.legisladores.length} legisladores de ${dir.demarcaciones} demarcaciones.${faltan}`,
  );
}
