/**
 * LicitaRD — domain model for Dominican public procurement (licitaciones).
 *
 * Modeled on the data published by the DGCP Portal Transaccional
 * (comprasdominicana.gob.do): procurement processes, awarding institutions,
 * procedure types, UNSPSC-style categories, schedules and award records.
 */

/** Lifecycle status of a procurement process. */
export type Estado =
  | "abierta" // receiving offers
  | "por_cerrar" // closing within 5 days
  | "cerrada" // closed, under evaluation
  | "adjudicada" // awarded
  | "desierta"; // declared void / no award

/** Procedure types recognized by Ley 340-06 / DGCP. */
export type Procedimiento =
  | "Licitación Pública Nacional"
  | "Licitación Pública Internacional"
  | "Licitación Restringida"
  | "Comparación de Precios"
  | "Compra Menor"
  | "Sorteo de Obras"
  | "Subasta Inversa"
  | "Procedimiento de Excepción";

export type TipoInstitucion =
  | "Ministerio"
  | "Ayuntamiento"
  | "Empresa Pública"
  | "Dirección General"
  | "Institución Autónoma";

export interface Institucion {
  id: string;
  nombre: string;
  sigla: string;
  tipo: TipoInstitucion;
}

export interface Categoria {
  id: string;
  nombre: string;
  /** UNSPSC segment code (2-digit family). */
  unspsc: string;
  /** lucide-react icon name used across the UI. */
  icon: string;
}

export interface DocumentoPliego {
  nombre: string;
  tipo: "PDF" | "XLSX" | "DOCX" | "ZIP";
  tamano: string;
}

export interface EtapaCronograma {
  etapa: string;
  fecha: string; // ISO date
  estado: "completado" | "actual" | "pendiente";
}

export interface Adjudicacion {
  proveedor: string;
  rnc: string;
  monto: number;
  fecha: string; // ISO date
}

export interface Licitacion {
  /** DGCP-style reference, e.g. "MSP-CCC-LPN-2026-0012". */
  id: string;
  titulo: string;
  descripcion: string;
  institucionId: string;
  categoriaId: string;
  procedimiento: Procedimiento;
  estado: Estado;
  provincia: string;
  montoEstimado: number;
  moneda: "DOP" | "USD";
  publicada: string; // ISO date
  cierre: string; // ISO date — deadline to submit offers
  apertura: string; // ISO date — public opening of offers
  /** Seriousness guarantee, as a % of the offer. */
  garantia: number;
  documentos: DocumentoPliego[];
  cronograma: EtapaCronograma[];
  contacto: { nombre: string; email: string; telefono: string };
  /** Number of registered bidders, when disclosed. */
  oferentes?: number;
  adjudicacion?: Adjudicacion;
  destacada?: boolean;
}

/** Workflow stages for a tender a user is actively tracking. */
export type Etapa =
  | "interesada"
  | "evaluando"
  | "preparando"
  | "presentada"
  | "ganada"
  | "perdida";

export interface SeguimientoItem {
  licitacionId: string;
  etapa: Etapa;
  nota?: string;
  agregada: string; // ISO timestamp
}

/** Persisted saved search with alert preferences. */
export interface BusquedaGuardada {
  id: string;
  nombre: string;
  filtros: FiltrosBusqueda;
  alerta: boolean;
  creada: string; // ISO timestamp
}

export interface FiltrosBusqueda {
  texto: string;
  categorias: string[];
  instituciones: string[];
  procedimientos: Procedimiento[];
  estados: Estado[];
  provincias: string[];
  montoMin: number | null;
  montoMax: number | null;
}

/**
 * Buyer-side capability profile used to score how well an opportunity fits.
 * Mirrors the "capability profile + semantic match score 0-100" pattern used
 * by leading platforms (Stotles, OpenOpps).
 */
export interface PerfilCapacidad {
  nombre: string;
  /** Category id -> weight (0-1) reflecting strength in that category. */
  categorias: Record<string, number>;
  provinciasPreferidas: string[];
  montoMin: number;
  montoMax: number;
}
