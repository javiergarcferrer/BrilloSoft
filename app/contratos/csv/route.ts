import { NextResponse } from "next/server";
import { contratosRecientes, type Contrato } from "@/lib/dgcp";
import { aCsv, respuestaCsv, type ColumnaCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUMNAS: ColumnaCsv<Contrato>[] = [
  ["codigo_contrato", (c) => c.codigo_contrato],
  ["codigo_proceso", (c) => c.codigo_proceso],
  ["fecha_adjudicacion", (c) => c.fecha_adjudicacion],
  ["estado_contrato", (c) => c.estado_contrato],
  ["codigo_unidad_compra", (c) => c.codigo_unidad_compra],
  ["unidad_compra", (c) => c.unidad_compra],
  ["rpe", (c) => c.rpe],
  ["razon_social", (c) => c.razon_social],
  ["valor_contratado", (c) => c.valor_contratado],
  ["divisa", (c) => c.divisa],
  ["descripcion", (c) => c.descripcion],
  ["url_contrato", (c) => c.url_contrato],
];

/**
 * La muestra de `/contratos` en CSV: los mismos contratos recientes que la
 * página agrega (seis páginas de 1000 del registro de la DGCP, la misma
 * ventana y el mismo caché), fila por fila y con todos los estados —la
 * columna `estado_contrato` permite quitar cancelados y rescindidos, que la
 * página no suma—.
 */
export async function GET() {
  try {
    const r = await contratosRecientes();
    const hoy = new Date().toISOString().slice(0, 10);
    return respuestaCsv(
      aCsv(COLUMNAS, r.contratos),
      `contratos-recientes-${hoy}-${r.contratos.length}-de-${r.totalRegistro}.csv`,
      `Muestra: los ${r.contratos.length} contratos más recientes de ${r.totalRegistro} en el registro de la DGCP.`,
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 },
    );
  }
}
