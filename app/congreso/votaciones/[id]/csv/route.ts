import { NextResponse } from "next/server";
import { ETIQUETA_SENTIDO, getVotacion, type VotoNominal } from "@/lib/congreso";
import { aCsv, respuestaCsv, type ColumnaCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNAS: ColumnaCsv<VotoNominal>[] = [
  ["legislador_id", (v) => v.legisladorId],
  ["nombre", (v) => v.nombre],
  ["partido_siglas", (v) => v.partidoSiglas],
  ["voto", (v) => ETIQUETA_SENTIDO[v.sentido]],
];

/** El voto nominal de una votación del pleno, uno por fila. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) {
    return NextResponse.json({ error: "Votación no válida" }, { status: 400 });
  }
  const detalle = await getVotacion(Number(id));
  if (!detalle) {
    return NextResponse.json({ error: "El SIL de la Cámara no respondió" }, { status: 502 });
  }
  const incompleta =
    detalle.votos.length < detalle.totalVotos
      ? ` Faltan ${detalle.totalVotos - detalle.votos.length} filas que el SIL no entregó.`
      : "";
  return respuestaCsv(
    aCsv(COLUMNAS, detalle.votos),
    `votacion-${id}-${detalle.votos.length}.csv`,
    `${detalle.votacion.titulo}: ${detalle.votos.length} votos nominales.${incompleta}`,
  );
}
