const BASE = "https://datosabiertos.dgcp.gob.do/api-dgcp/v1";

export interface Proceso {
  codigo_proceso: string;
  codigo_unidad_compra: number;
  unidad_compra: string;
  modalidad: string;
  tipo_excepcion: string;
  titulo: string;
  descripcion: string;
  estado_proceso: string;
  divisa: string;
  monto_estimado: number;
  fecha_publicacion: string;
  fecha_enmienda: string;
  fecha_fin_recepcion_ofertas: string;
  fecha_apertura_ofertas: string;
  fecha_estimada_adjudicacion: string;
  fecha_suscripcion: string;
  fecha_habilitacion_oferente: string;
  dirigido_mipymes: string;
  dirigido_mipymes_mujeres: string;
  proceso_lotificado: string;
  es_snip: string;
  codigo_snip: string;
  numero_proveedores_notificados: string;
  area_requiriente: string;
  url: string;
  adquisicion_planeada: string;
  justificacion_no_pacc: string;
  objeto_proceso: string;
  subobjeto_proceso: string;
  decreto_presidencial: string;
  resolucion_maxima_autoridad: string;
  organismo_financiero_externo: string;
  marco_decreto_3122: string;
  compra_verde: string;
  compra_conjunta: string;
  duracion_contrato: string;
}

export interface Articulo {
  codigo_proceso: string;
  fecha_publicacion: string;
  familia_unspsc: string;
  clase_unspsc: string;
  subclase_unspsc: string;
  descripcion_articulo: string;
  cuenta_presupuestaria: string;
  descripcion_usuario: string;
  cantidad: number;
  unidad_medida: string;
  precio_unitario_estimado: number;
  precio_total_estimado: number;
}

export interface Documento {
  nombre_documento: string;
  codigo_proceso: string;
  tipo_documento: string;
  fecha_carga_archivo: string;
  url_documento: string;
}

export interface Contrato {
  codigo_contrato: string;
  codigo_proceso: string;
  estado_contrato: string;
  estado_adjudicacion: string;
  fecha_adjudicacion: string;
  divisa: string;
  valor_contratado: number;
  metodo_pago: string;
  plazo_pago_factura: string;
  descripcion: string;
  fecha_creacion_contrato: string;
  url_contrato: string;
  unidad_compra: string;
  codigo_unidad_compra: string;
  rpe: string;
  razon_social: string;
}

export interface ContratoArticulo {
  codigo_contrato: string;
  codigo_proceso: string;
  familia: string;
  clase: string;
  subclase: string;
  cuenta_presupuestaria: string;
  descripcion_articulo: string;
  descripcion_usuario: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  itbis: number;
  otros_impuestos: number;
  descuentos: number;
  costo_total: number;
  fecha_creacion_contrato: string;
}

export interface DgcpResponse<T> {
  code: number;
  hasError: boolean;
  payload: { content: T[] };
  page?: number;
  limit?: number;
  totalResults?: number;
  pages?: number;
}

export type Params = Record<string, string | number | boolean | undefined | null>;

export async function dgcpFetch<T>(
  path: string,
  params: Params = {},
  revalidate = 300
): Promise<DgcpResponse<T>> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { next: { revalidate } });
  if (!res.ok) throw new Error(`DGCP respondió ${res.status} para ${path}`);
  const data = (await res.json()) as DgcpResponse<T>;
  if (data.hasError) throw new Error(`DGCP devolvió un error para ${path}`);
  // Cuando no hay resultados la API devuelve payload.content = null.
  if (!data.payload) data.payload = { content: [] };
  if (!Array.isArray(data.payload.content)) data.payload.content = [];
  return data;
}

export function normalize(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Máximo de páginas de 1000 registros a escanear en una búsqueda por texto. */
const MAX_SEARCH_PAGES = 6;

export interface SearchResult {
  content: Proceso[];
  totalResults: number;
  pages: number;
  page: number;
  /** Cantidad de registros escaneados upstream (solo en modo búsqueda). */
  scanned?: number;
  /** true si la búsqueda no alcanzó a escanear todos los registros del rango. */
  truncated?: boolean;
}

/**
 * Lista procesos. Sin `q` es un passthrough paginado a la API de la DGCP.
 * Con `q` escanea hasta MAX_SEARCH_PAGES páginas de 1000 registros dentro de
 * los filtros dados y filtra por texto en título, descripción, unidad de
 * compra y código.
 */
export async function listProcesos(opts: {
  q?: string;
  proceso?: string;
  estado?: string;
  modalidad?: string;
  startdate?: string;
  enddate?: string;
  mipyme?: string;
  mipyme_mujer?: string;
  page?: number;
  limit?: number;
}): Promise<SearchResult> {
  const common: Params = {
    proceso: opts.proceso,
    estado: opts.estado,
    modalidad: opts.modalidad,
    startdate: opts.startdate,
    enddate: opts.enddate,
    mipyme: opts.mipyme,
    mipyme_mujer: opts.mipyme_mujer,
  };

  const q = opts.q?.trim();
  if (!q) {
    const data = await dgcpFetch<Proceso>("/procesos", {
      ...common,
      page: opts.page ?? 1,
      limit: opts.limit ?? 24,
    });
    return {
      content: data.payload.content,
      totalResults: data.totalResults ?? data.payload.content.length,
      pages: data.pages ?? 1,
      page: data.page ?? opts.page ?? 1,
    };
  }

  const first = await dgcpFetch<Proceso>("/procesos", { ...common, page: 1, limit: 1000 });
  const upstreamPages = first.pages ?? 1;
  const pagesToScan = Math.min(upstreamPages, MAX_SEARCH_PAGES);
  let all = first.payload.content;
  if (pagesToScan > 1) {
    const rest = await Promise.all(
      Array.from({ length: pagesToScan - 1 }, (_, i) =>
        dgcpFetch<Proceso>("/procesos", { ...common, page: i + 2, limit: 1000 })
      )
    );
    all = all.concat(...rest.map((r) => r.payload.content));
  }

  const needle = normalize(q);
  const matches = all.filter((p) =>
    normalize(
      `${p.titulo} ${p.descripcion} ${p.unidad_compra} ${p.codigo_proceso} ${p.area_requiriente}`
    ).includes(needle)
  );

  return {
    content: matches.slice(0, 300),
    totalResults: matches.length,
    pages: 1,
    page: 1,
    scanned: all.length,
    truncated: upstreamPages > pagesToScan,
  };
}

export async function getProceso(codigo: string): Promise<{
  proceso: Proceso | null;
  articulos: Articulo[];
  documentos: Documento[];
  contratos: Contrato[];
}> {
  const [proc, arts, docs, ctos] = await Promise.all([
    dgcpFetch<Proceso>("/procesos", { proceso: codigo, limit: 5 }).catch(() => null),
    dgcpFetch<Articulo>("/procesos/articulos", { proceso: codigo, limit: 200 }).catch(
      () => null
    ),
    dgcpFetch<Documento>("/procesos/documentos", { proceso: codigo }).catch(() => null),
    dgcpFetch<Contrato>("/contratos", { proceso: codigo, limit: 50 }).catch(() => null),
  ]);
  return {
    proceso: proc?.payload.content[0] ?? null,
    articulos: arts?.payload.content ?? [],
    documentos: docs?.payload.content ?? [],
    contratos: ctos?.payload.content ?? [],
  };
}

export interface PreciosStats {
  subclase: string;
  muestras: number;
  min: number;
  mediana: number;
  max: number;
  ejemplos: ContratoArticulo[];
}

/**
 * Estadísticas de precios unitarios realmente contratados para una subclase
 * UNSPSC, sobre los últimos ~1000 artículos de contrato registrados.
 */
export async function getPreciosSubclase(subclase: string): Promise<PreciosStats> {
  const data = await dgcpFetch<ContratoArticulo>(
    "/contratos/articulos",
    { subclase, limit: 1000 },
    3600
  );
  const items = data.payload.content;
  const precios = items
    .map((a) => a.precio_unitario)
    .filter((v) => typeof v === "number" && v > 0)
    .sort((a, b) => a - b);
  const mediana =
    precios.length === 0
      ? 0
      : precios.length % 2
        ? precios[(precios.length - 1) / 2]
        : (precios[precios.length / 2 - 1] + precios[precios.length / 2]) / 2;
  const ejemplos = [...items]
    .filter((a) => a.precio_unitario > 0)
    .sort(
      (a, b) =>
        new Date(b.fecha_creacion_contrato).getTime() -
        new Date(a.fecha_creacion_contrato).getTime()
    )
    .slice(0, 8);
  return {
    subclase,
    muestras: precios.length,
    min: precios[0] ?? 0,
    mediana,
    max: precios[precios.length - 1] ?? 0,
    ejemplos,
  };
}
