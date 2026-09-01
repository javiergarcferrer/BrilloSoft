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
  // La API pública a veces tarda o falla de forma transitoria: un timeout
  // de 25s por intento y un único reintento.
  let ultimo: unknown;
  for (let intento = 0; intento < 2; intento++) {
    try {
      const res = await fetch(url.toString(), {
        next: { revalidate },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`DGCP respondió ${res.status} para ${path}`);
      const data = (await res.json()) as DgcpResponse<T>;
      if (data.hasError) throw new Error(`DGCP devolvió un error para ${path}`);
      // Cuando no hay resultados la API devuelve payload.content = null.
      if (!data.payload) data.payload = { content: [] };
      if (!Array.isArray(data.payload.content)) data.payload.content = [];
      return data;
    } catch (e) {
      ultimo = e;
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error(`DGCP no disponible para ${path}`);
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
  unidad_compra?: number;
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
    unidad_compra: opts.unidad_compra,
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

export interface UnidadCompra {
  codigo: number;
  nombre: string;
  acronimo: string;
}

interface UnidadCompraRaw {
  codigo_unidad_compra: number;
  unidad_compra: string;
  acronimo: string;
  estado: string;
}

export async function getUnidadesCompra(): Promise<UnidadCompra[]> {
  const data = await dgcpFetch<UnidadCompraRaw>(
    "/unidades_compra",
    { limit: 1000 },
    86400
  );
  return data.payload.content
    .filter((u) => u.estado === "ACTIVA")
    .map((u) => ({
      codigo: u.codigo_unidad_compra,
      nombre: u.unidad_compra,
      acronimo: u.acronimo,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
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

/* --------------------------------------------------- histórico de contratos */

/**
 * El endpoint `/contratos` **ignora los filtros de fecha**: sirve siempre los
 * contratos de más reciente a más antiguo (1000 por página, ~8 días por
 * página). Solo `proceso` y `rpe` filtran de verdad. Así que el análisis del
 * histórico se hace, como la búsqueda de procesos, escaneando un número
 * acotado de páginas recientes y agregando del lado del servidor, declarando
 * siempre que es una muestra y no el corpus completo (714k+ contratos).
 */
const MAX_CONTRATOS_PAGES = 6;

/** Estados de contrato que cuentan como adjudicación en firme. */
const ESTADOS_VIGENTES = new Set(["Activo", "Modificado", "Cerrado"]);

export interface AgregadoContrato {
  clave: string;
  n: number;
  monto: number;
  /** Datos extra según el agregado (rpe del proveedor, etc.). */
  rpe?: string;
}

export interface PuntoMensual {
  /** `YYYY-MM`. */
  mes: string;
  n: number;
  monto: number;
}

export interface ResumenContratos {
  /** Contratos realmente recorridos upstream. */
  escaneados: number;
  /** Censo declarado por la API (todo el registro, no la muestra). */
  totalRegistro: number;
  /** true si el registro es mayor que lo escaneado (siempre, en la práctica). */
  truncado: boolean;
  /** Ventana temporal cubierta por la muestra. */
  desde: string | null;
  hasta: string | null;
  montoTotal: number;
  conMonto: number;
  topAdjudicatarios: AgregadoContrato[];
  topInstituciones: AgregadoContrato[];
  porMes: PuntoMensual[];
  porEstado: AgregadoContrato[];
  /** Los más recientes, ya ordenados, para una tabla de detalle. */
  recientes: Contrato[];
}

/**
 * `YYYY-MM-DD` con mes 01-12 y día 01-31, o `null`. El registro de la DGCP
 * trae fechas corruptas (mes `00`, días fuera de rango) que envenenarían la
 * ventana temporal y la tendencia mensual si se colaran.
 */
function fechaValida(iso: string | null | undefined): string | null {
  const f = (iso ?? "").slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f);
  if (!m) return null;
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return f;
}

function acumular(mapa: Map<string, AgregadoContrato>, clave: string, monto: number, rpe?: string) {
  const k = clave || "—";
  const a = mapa.get(k) ?? { clave: k, n: 0, monto: 0, rpe };
  a.n += 1;
  a.monto += monto;
  mapa.set(k, a);
}

/**
 * Muestra agregada de los contratos adjudicados más recientes. `paginas`
 * controla la profundidad (cada una son 1000 contratos, ~8 días).
 */
export async function muestrearContratos(
  paginas = MAX_CONTRATOS_PAGES,
): Promise<ResumenContratos> {
  const first = await dgcpFetch<Contrato>("/contratos", { page: 1, limit: 1000 }, 1800);
  const totalRegistro = first.totalResults ?? first.payload.content.length;
  const upstreamPages = first.pages ?? 1;
  const aEscanear = Math.min(upstreamPages, Math.max(1, paginas));

  let todos = first.payload.content;
  if (aEscanear > 1) {
    const rest = await Promise.all(
      Array.from({ length: aEscanear - 1 }, (_, i) =>
        dgcpFetch<Contrato>("/contratos", { page: i + 2, limit: 1000 }, 1800).catch(
          () => null,
        ),
      ),
    );
    for (const r of rest) if (r) todos = todos.concat(r.payload.content);
  }

  const adjudicatarios = new Map<string, AgregadoContrato>();
  const instituciones = new Map<string, AgregadoContrato>();
  const meses = new Map<string, PuntoMensual>();
  const estados = new Map<string, AgregadoContrato>();

  let montoTotal = 0;
  let conMonto = 0;
  let desde: string | null = null;
  let hasta: string | null = null;

  for (const c of todos) {
    const monto = c.valor_contratado || 0;
    // Solo montos de adjudicaciones vigentes entran en los totales; los
    // cancelados/rescindidos se cuentan aparte y no inflan el gasto.
    const cuenta = ESTADOS_VIGENTES.has(c.estado_contrato);
    if (cuenta && monto > 0) {
      montoTotal += monto;
      conMonto += 1;
      acumular(adjudicatarios, c.razon_social, monto, c.rpe);
      acumular(instituciones, c.unidad_compra, monto);
    }
    acumular(estados, c.estado_contrato || "—", monto);

    const fecha = fechaValida(c.fecha_adjudicacion);
    if (fecha) {
      if (!desde || fecha < desde) desde = fecha;
      if (!hasta || fecha > hasta) hasta = fecha;
      const mes = fecha.slice(0, 7);
      const p = meses.get(mes) ?? { mes, n: 0, monto: 0 };
      p.n += 1;
      if (cuenta && monto > 0) p.monto += monto;
      meses.set(mes, p);
    }
  }

  // Solo meses con presencia real: un puñado de contratos mal fechados no debe
  // pintar una barra fantasma en la tendencia.
  const minMes = Math.max(3, Math.round(todos.length * 0.002));
  const porMes = [...meses.values()]
    .filter((m) => m.n >= minMes)
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const top = (m: Map<string, AgregadoContrato>, n: number) =>
    [...m.values()].sort((a, b) => b.monto - a.monto).slice(0, n);

  const recientes = [...todos]
    .sort(
      (a, b) =>
        new Date(b.fecha_adjudicacion).getTime() -
        new Date(a.fecha_adjudicacion).getTime(),
    )
    .slice(0, 40);

  return {
    escaneados: todos.length,
    totalRegistro,
    truncado: upstreamPages > aEscanear,
    desde,
    hasta,
    montoTotal,
    conMonto,
    topAdjudicatarios: top(adjudicatarios, 12),
    topInstituciones: top(instituciones, 12),
    porMes,
    porEstado: [...estados.values()].sort((a, b) => b.n - a.n),
    recientes,
  };
}

export interface HistorialProveedor {
  rpe: string;
  razonSocial: string | null;
  totalRegistro: number;
  contratos: Contrato[];
  montoTotal: number;
  /** Adjudicaciones vigentes (sin canceladas/rescindidas). */
  montoVigente: number;
  instituciones: number;
  porAnio: { anio: string; n: number; monto: number }[];
}

/**
 * Historial de contratos de un proveedor. A diferencia del histórico general,
 * `rpe` **sí filtra** en la API, así que esto es el registro completo del
 * proveedor (hasta 1000 contratos), no una muestra.
 */
export async function getHistorialProveedor(rpe: string): Promise<HistorialProveedor | null> {
  const data = await dgcpFetch<Contrato>("/contratos", { rpe, limit: 1000 }, 3600);
  const contratos = data.payload.content;
  if (contratos.length === 0) return null;

  let montoTotal = 0;
  let montoVigente = 0;
  const insts = new Set<string>();
  const anios = new Map<string, { anio: string; n: number; monto: number }>();

  for (const c of contratos) {
    const monto = c.valor_contratado || 0;
    montoTotal += monto;
    if (ESTADOS_VIGENTES.has(c.estado_contrato)) montoVigente += monto;
    if (c.unidad_compra) insts.add(c.unidad_compra);
    const anio = fechaValida(c.fecha_adjudicacion)?.slice(0, 4) ?? "Sin fecha";
    const a = anios.get(anio) ?? { anio, n: 0, monto: 0 };
    a.n += 1;
    a.monto += monto;
    anios.set(anio, a);
  }

  return {
    rpe,
    razonSocial: contratos[0].razon_social ?? null,
    totalRegistro: data.totalResults ?? contratos.length,
    contratos,
    montoTotal,
    montoVigente,
    instituciones: insts.size,
    porAnio: [...anios.values()].sort((a, b) => b.anio.localeCompare(a.anio)),
  };
}

/* --------------------------------------------------- ofertas: la competencia */

/**
 * Una oferta presentada a un proceso. El endpoint `/ofertas` (1.46 M de
 * registros) responde a `proceso`, igual que `/contratos`, así que la
 * competencia de un proceso concreto **no es una muestra**: es el registro.
 *
 * Advertencia de campo (AUDITORIA.md §A.3): `estado_evaluacion` viene
 * mayoritariamente en «Pendiente» o vacío incluso en procesos ya adjudicados.
 * Esta capa expone quién ofertó y por cuánto; **quién ganó lo dicen los
 * contratos**, no la evaluación.
 */
export interface Oferta {
  id_oferta: string;
  codigo_proceso: string;
  codigo_unidad_compra: string;
  unidad_compra: string;
  rpe: string;
  razon_social: string;
  nombre_oferta: string;
  valor_oferta: string;
  estado_oferta: string;
  estado_evaluacion: string | null;
  tipo_oferta: string;
  fecha_creacion: string;
  fecha_entrega_oferta: string;
  fecha_evaluacion: string | null;
}

export interface Oferente {
  rpe: string;
  razonSocial: string;
  /** Suma de las ofertas de ese oferente en el proceso (puede ofertar por lote). */
  monto: number;
  ofertas: number;
  digital: boolean;
}

export interface Competencia {
  /** Oferentes distintos, de menor a mayor monto ofertado. */
  oferentes: Oferente[];
  /** Ofertas individuales registradas (un oferente puede presentar varias). */
  totalOfertas: number;
  /** Nadie más se presentó: la señal que hay que mirar. */
  oferenteUnico: boolean;
  /** Menor y mayor oferta con monto declarado, para dar rango. */
  menor: number | null;
  mayor: number | null;
  /** Cuántas ofertas llegaron sin monto legible en el registro. */
  sinMonto: number;
}

/**
 * Quién compitió por un proceso. Devuelve `null` cuando el registro no tiene
 * ofertas cargadas — que no es lo mismo que «no hubo competencia»: hay
 * modalidades que no publican ofertas, y la UI debe decirlo así.
 */
export async function getCompetencia(codigoProceso: string): Promise<Competencia | null> {
  const data = await dgcpFetch<Oferta>(
    "/ofertas",
    { proceso: codigoProceso, limit: 1000 },
    1800
  ).catch(() => null);
  const ofertas = data?.payload.content ?? [];
  if (ofertas.length === 0) return null;

  const porOferente = new Map<string, Oferente>();
  let sinMonto = 0;
  const montos: number[] = [];

  for (const o of ofertas) {
    const monto = Number(o.valor_oferta);
    const valido = Number.isFinite(monto) && monto > 0;
    if (valido) montos.push(monto);
    else sinMonto += 1;

    const rpe = String(o.rpe ?? "").trim();
    const clave = rpe || o.razon_social || o.id_oferta;
    const acc = porOferente.get(clave) ?? {
      rpe,
      razonSocial: o.razon_social || "Oferente sin nombre en el registro",
      monto: 0,
      ofertas: 0,
      digital: false,
    };
    acc.ofertas += 1;
    if (valido) acc.monto += monto;
    if (/digital/i.test(o.tipo_oferta || "")) acc.digital = true;
    porOferente.set(clave, acc);
  }

  montos.sort((a, b) => a - b);
  const oferentes = [...porOferente.values()].sort((a, b) => {
    if (a.monto && b.monto) return a.monto - b.monto;
    return b.monto - a.monto;
  });

  return {
    oferentes,
    totalOfertas: ofertas.length,
    oferenteUnico: oferentes.length === 1,
    menor: montos[0] ?? null,
    mayor: montos[montos.length - 1] ?? null,
    sinMonto,
  };
}

/* ------------------------------------------ registro de proveedores del Estado */

/**
 * Ficha del Registro de Proveedores del Estado (RPE).
 *
 * El endpoint `/proveedores` trae 35 campos, entre ellos teléfonos, correos y
 * nombre del contacto comercial. **Este tipo los omite a propósito**: son
 * públicos por registro, pero replicarlos convertiría la plataforma en un
 * directorio de contactos, que no es lo que hace falta para vigilar al Estado
 * (AUDITORIA.md §A.3). Lo que sí importa es la identidad institucional: quién
 * es, desde cuándo existe y en qué condición está inscrito.
 */
export interface ProveedorRegistro {
  rpe: string;
  razonSocial: string;
  /** «RNC» o «Cédula». */
  tipoDocumento: string;
  /** El RNC: la llave con el registro tributario de la DGII. */
  numeroDocumento: string;
  /** «Activo» · «Inactivo» · «Desactualizado». */
  estado: string;
  tipoPersona: string;
  formaJuridica: string;
  /** Constitución de la empresa (no su inscripción como proveedor). */
  fechaCreacion: string | null;
  /** Alta en el registro de proveedores del Estado. */
  fechaRegistroRpe: string | null;
  registroMercantil: string | null;
  esMipyme: boolean;
  certificacionMicm: boolean;
  productorNacional: boolean;
  /** «Gran empresa», «Mediana empresa», «No clasificada»… */
  clasificacion: string | null;
  /** «Bienes», «Servicios», «Obras». */
  provee: string | null;
  provincia: string | null;
  municipio: string | null;
}

interface ProveedorRaw {
  rpe: number | string;
  razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  estado: string;
  tipo_persona: string;
  forma_juridica: string;
  fecha_creacion_empresa: string | null;
  fecha_registro_rpe: string | null;
  numero_registro_mercantil: string | null;
  es_mipyme: string | null;
  certificacion_micm: string | null;
  productor_nacional: string | null;
  clasificacion: string | null;
  provee: string | null;
  provincia: string | null;
  municipio: string | null;
}

const esSi = (v: string | null | undefined) => /^s[ií]$/i.test((v ?? "").trim());

/** Fecha ISO del registro, o `null` si viene vacía o corrupta. */
function fechaRegistro(iso: string | null | undefined): string | null {
  return fechaValida(iso) ? iso!.slice(0, 10) : null;
}

/**
 * Ficha de registro de un proveedor. `rpe` filtra de verdad en la API, así que
 * es una consulta directa. Degrada a `null` si el proveedor no está en el
 * registro (o si la API falla): la página del proveedor sigue funcionando con
 * su historial de contratos.
 */
export async function getProveedorRegistro(rpe: string): Promise<ProveedorRegistro | null> {
  const data = await dgcpFetch<ProveedorRaw>("/proveedores", { rpe, limit: 5 }, 86400).catch(
    () => null
  );
  const p = data?.payload.content.find((x) => String(x.rpe) === String(rpe));
  if (!p) return null;
  return {
    rpe: String(p.rpe),
    razonSocial: p.razon_social,
    tipoDocumento: p.tipo_documento,
    numeroDocumento: p.numero_documento,
    estado: p.estado,
    tipoPersona: p.tipo_persona,
    formaJuridica: p.forma_juridica,
    fechaCreacion: fechaRegistro(p.fecha_creacion_empresa),
    fechaRegistroRpe: fechaRegistro(p.fecha_registro_rpe),
    registroMercantil: p.numero_registro_mercantil || null,
    esMipyme: esSi(p.es_mipyme),
    certificacionMicm: esSi(p.certificacion_micm),
    productorNacional: esSi(p.productor_nacional),
    clasificacion: p.clasificacion || null,
    provee: p.provee || null,
    provincia: p.provincia || null,
    municipio: p.municipio || null,
  };
}

/* ------------------------------------------------------------ catálogo UNSPSC */

export interface Subclase {
  subclase: string;
  descripcion: string;
  clase: string;
  descripcionClase: string;
  familia: string;
  descripcionFamilia: string;
  definicion: string | null;
}

interface SubclaseRaw {
  segmento: string;
  descripcion_segmento: string;
  familia: string;
  descripcion_familia: string;
  clase: string;
  descripcion_clase: string;
  subclase: string;
  descripcion_subclase: string;
  definicion_subclase: string | null;
}

/** Nombre y árbol de una subclase UNSPSC: da lenguaje llano a un código. */
export async function getSubclase(subclase: string): Promise<Subclase | null> {
  const data = await dgcpFetch<SubclaseRaw>("/catalogo", { subclase, limit: 5 }, 86400).catch(
    () => null
  );
  const s = data?.payload.content.find((x) => x.subclase === subclase);
  if (!s) return null;
  const limpiar = (t: string) => t.replace(/\s+/g, " ").trim();
  return {
    subclase: s.subclase,
    descripcion: limpiar(s.descripcion_subclase),
    clase: s.clase,
    descripcionClase: limpiar(s.descripcion_clase),
    familia: s.familia,
    descripcionFamilia: limpiar(s.descripcion_familia),
    definicion: s.definicion_subclase ? limpiar(s.definicion_subclase) : null,
  };
}

/* -------------------------------------- PACC: lo que el Estado planea comprar */

/**
 * Plan Anual de Compras y Contrataciones de una unidad de compra. Es la
 * intención declarada **antes** de que exista un proceso: la señal más
 * temprana que publica el Estado.
 *
 * Límite verificado: `/pacc` **ignora el filtro `periodo`** (devuelve 2026
 * aunque se pida 2025); `unidad_compra` sí filtra. Por eso el filtrado por
 * período se hace aquí, del lado del servidor.
 */
export interface Pacc {
  uid: string;
  codigoUnidadCompra: string;
  unidadCompra: string;
  periodo: number;
  fechaPublicacion: string | null;
  /** Cada revisión del plan sube la versión: 55 versiones es un plan movido. */
  version: string;
  url: string;
}

interface PaccRaw {
  uid_pacc: string;
  codigo_unidad_compra: string;
  unidad_compra: string;
  periodo: number | string;
  fecha_publicacion: string | null;
  version: string;
  responsable: string;
  correo_responsable: string;
  url: string;
}

export async function listPacc(opts: {
  periodo?: number;
  unidad_compra?: number | string;
  limit?: number;
} = {}): Promise<Pacc[]> {
  const data = await dgcpFetch<PaccRaw>(
    "/pacc",
    { unidad_compra: opts.unidad_compra, limit: opts.limit ?? 1000 },
    3600
  ).catch(() => null);
  const planes = (data?.payload.content ?? []).map((p) => ({
    uid: p.uid_pacc,
    codigoUnidadCompra: String(p.codigo_unidad_compra),
    unidadCompra: p.unidad_compra,
    periodo: Number(p.periodo),
    fechaPublicacion: fechaRegistro(p.fecha_publicacion),
    version: String(p.version ?? ""),
    url: p.url,
  }));
  const filtrados = opts.periodo
    ? planes.filter((p) => p.periodo === opts.periodo)
    : planes;
  return filtrados.sort((a, b) =>
    (b.fechaPublicacion ?? "").localeCompare(a.fechaPublicacion ?? "")
  );
}
