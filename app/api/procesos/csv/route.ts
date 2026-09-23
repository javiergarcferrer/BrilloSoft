import { NextRequest, NextResponse } from "next/server";
import { descargarProcesos, MAX_FILAS_DESCARGA, type Proceso } from "@/lib/dgcp";
import { aCsv, respuestaCsv, type ColumnaCsv } from "@/lib/csv";
import { filtrosDeQuery } from "../filtros";

export const dynamic = "force-dynamic";
/* Seis páginas de 1000 en paralelo, cada una con 25 s y un reintento. */
export const maxDuration = 60;

const COLUMNAS: ColumnaCsv<Proceso>[] = [
  ["codigo_proceso", (p) => p.codigo_proceso],
  ["titulo", (p) => p.titulo],
  ["codigo_unidad_compra", (p) => p.codigo_unidad_compra],
  ["unidad_compra", (p) => p.unidad_compra],
  ["modalidad", (p) => p.modalidad],
  ["tipo_excepcion", (p) => p.tipo_excepcion],
  ["estado", (p) => p.estado_proceso],
  ["monto_estimado", (p) => p.monto_estimado],
  ["divisa", (p) => p.divisa],
  ["fecha_publicacion", (p) => p.fecha_publicacion],
  ["fecha_fin_recepcion_ofertas", (p) => p.fecha_fin_recepcion_ofertas],
  ["dirigido_mipymes", (p) => p.dirigido_mipymes],
  ["planificado_en_pacc", (p) => p.adquisicion_planeada],
  ["url_portal", (p) => p.url],
];

/**
 * El barrido entero de una búsqueda de `/licitaciones` en CSV: los mismos
 * filtros que el listado, sin paginar. Acotado a `MAX_FILAS_DESCARGA`
 * registros leídos del origen —lo mismo que el listado declara—; si el rango
 * es mayor, el archivo lo dice en su nombre y en `X-Alcance`.
 */
export async function GET(req: NextRequest) {
  try {
    const d = await descargarProcesos(filtrosDeQuery(req.nextUrl.searchParams));
    const hoy = new Date().toISOString().slice(0, 10);
    const archivo = d.truncated
      ? `licitaciones-${hoy}-barrido-${d.scanned}-de-${d.censo}.csv`
      : `licitaciones-${hoy}.csv`;
    const alcance = d.truncated
      ? `${d.filas.length} filas halladas entre los ${d.scanned} registros más recientes del rango; el origen declara ${d.censo} (tope de la descarga: ${MAX_FILAS_DESCARGA}).`
      : `${d.filas.length} filas: todo el rango pedido (${d.scanned} registros leídos).`;
    return respuestaCsv(aCsv(COLUMNAS, d.filas), archivo, alcance);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error consultando la API de la DGCP" },
      { status: 502 },
    );
  }
}
