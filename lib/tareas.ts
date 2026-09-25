/**
 * Las seis tareas: qué viene a **hacer** quien abre la plataforma.
 *
 * El menú agrupa por tema (el dinero, las leyes, el Estado) porque así se
 * explora. Pero quien llega con prisa no piensa en temas, piensa en verbos:
 * «quiero ver qué está pasando», «quiero encontrar a este proveedor»,
 * «quiero comparar». La tarea es el segundo eje del índice (`lib/indice.ts`)
 * y es el que ordena la paleta.
 *
 * Seis y no más: por debajo de siete opciones se elige de un vistazo (Hick);
 * por encima, se lee la lista entera. Cada una se nombra por lo que hace el
 * lector, nunca por quién publica el dato. El orden es el de la pregunta más
 * frecuente a la menos.
 */

export type Tarea = "vigilar" | "buscar" | "comparar" | "leer" | "participar" | "entender";

export interface DefinicionTarea {
  /** Encabezado del grupo en la paleta: una acción, en infinitivo llano. */
  etiqueta: string;
  /** Qué resuelve, en una línea. */
  nota: string;
  /** Las palabras con que alguien la teclea sin saber cómo se llama. */
  claves: string[];
}

export const TAREAS: Record<Tarea, DefinicionTarea> = {
  vigilar: {
    etiqueta: "Ver qué pasa ahora",
    nota: "Lo abierto, lo que vence y lo que cambió hoy",
    claves: ["ahora", "hoy", "abierto", "vigente", "en curso", "vigilar", "vence"],
  },
  buscar: {
    etiqueta: "Encontrar a alguien",
    nota: "Una institución, un proveedor, un legislador, un dato",
    claves: ["buscar", "encontrar", "quién", "rnc", "nombre"],
  },
  comparar: {
    etiqueta: "Medir y comparar",
    nota: "Cuánto, desde cuándo y comparado con qué",
    claves: ["comparar", "cuánto", "ranking", "serie", "evolución", "medir", "cifras"],
  },
  leer: {
    etiqueta: "Leer lo decidido",
    nota: "Leyes, decretos, sentencias e informes, enteros",
    claves: ["leer", "documento", "texto", "sentencia", "informe", "ley", "decreto"],
  },
  participar: {
    etiqueta: "Seguir y opinar",
    nota: "Lo que sigues y tu voto",
    claves: ["seguir", "seguimiento", "votar", "opinar", "voto", "alerta"],
  },
  entender: {
    etiqueta: "Entender cómo funciona",
    nota: "Guías en llano, las fuentes y cómo tratamos tus datos",
    claves: ["guía", "cómo", "qué es", "aprender", "explicación", "fuentes"],
  },
};

/** El orden de los grupos en la paleta. */
export const ORDEN_TAREAS: Tarea[] = ["vigilar", "buscar", "comparar", "leer", "participar", "entender"];
