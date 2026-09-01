/**
 * Arquitectura de información de la plataforma — fuente única de verdad.
 *
 * Gobiername.data cubre tres verticales (licitaciones, congreso, nómina) y un
 * panorama transversal. Todo el chrome —nav global, barra de sección, tab bar
 * móvil, agrupación del pie— se deriva de este módulo para que la separación
 * entre verticales sea estructural y no una convención repetida a mano.
 *
 * Reglas de ergonomía que este módulo hace cumplir:
 *  - Cada ruta pertenece a lo sumo a una vertical (`seccionDe` es determinista).
 *  - Cada vertical tiene un matiz propio, usado SOLO para orientación (estado
 *    activo del nav, acento de la barra de sección, chip del panorama) — nunca
 *    para el contenido, que conserva su color semántico (vigente, perimido…).
 *  - Las etiquetas del nav son las mismas en global, sección, tab bar y pie:
 *    un solo vocabulario.
 *
 * Las clases de Tailwind viven aquí como literales para que el escáner las vea.
 */

export type SeccionId = "licitaciones" | "congreso" | "normativa" | "nomina" | "democracia";

export interface VistaSeccion {
  href: string;
  label: string;
  /** Activa solo con match exacto (si no, por prefijo). */
  exact?: boolean;
  /** La vista de seguimiento muestra el contador de procesos seguidos. */
  seguimiento?: boolean;
}

export interface Seccion {
  id: SeccionId;
  nombre: string;
  /** Ruta raíz de la vertical (a donde lleva el nav global). */
  href: string;
  /** Qué describe la vertical, para subtítulos y tarjetas. */
  descriptor: string;
  /** Prefijos de ruta que pertenecen a la vertical. */
  rutas: string[];
  /** Vistas internas (subnav). Una sola vista ⇒ la barra no pinta tabs. */
  vistas: VistaSeccion[];
  /** ¿El buscador de licitaciones del header aplica en esta vertical? */
  conBuscadorGlobal: boolean;
  hue: {
    /** Texto/acento del estado activo sobre fondo claro. */
    activo: string;
    /** Subrayado / indicador del ítem activo. */
    barra: string;
    /** Punto identificador de la vertical. */
    punto: string;
    /** Chip de icono en el panorama. */
    chip: string;
  };
}

export const SECCIONES: Seccion[] = [
  {
    id: "licitaciones",
    nombre: "Licitaciones",
    href: "/licitaciones",
    descriptor: "Compras públicas · DGCP",
    rutas: [
      "/licitaciones",
      "/procesos",
      "/proveedores",
      "/estadisticas",
      "/contratos",
      "/seguimiento",
      "/guia",
    ],
    vistas: [
      { href: "/licitaciones", label: "Buscar" },
      { href: "/estadisticas", label: "Mercado" },
      { href: "/contratos", label: "Contratado" },
      { href: "/seguimiento", label: "Seguimiento", seguimiento: true },
      { href: "/guia", label: "Guía" },
    ],
    conBuscadorGlobal: true,
    hue: {
      activo: "text-emerald-700",
      barra: "bg-emerald-500",
      punto: "bg-emerald-500",
      chip: "bg-emerald-50 text-emerald-700",
    },
  },
  {
    id: "congreso",
    nombre: "Congreso",
    href: "/congreso",
    descriptor: "Iniciativas · Diputados y Senado",
    rutas: ["/congreso"],
    vistas: [
      { href: "/congreso", label: "Diputados" },
      { href: "/congreso/senado", label: "Senado" },
      { href: "/congreso/perencion", label: "Perención", exact: true },
    ],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-violet-700",
      barra: "bg-violet-500",
      punto: "bg-violet-500",
      chip: "bg-violet-50 text-violet-700",
    },
  },
  {
    id: "normativa",
    nombre: "Normativa",
    href: "/normativa",
    descriptor: "Decretos y leyes · Poder Ejecutivo",
    rutas: ["/normativa"],
    vistas: [{ href: "/normativa", label: "Decretos y leyes" }],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-indigo-700",
      barra: "bg-indigo-500",
      punto: "bg-indigo-500",
      chip: "bg-indigo-50 text-indigo-700",
    },
  },
  {
    id: "nomina",
    nombre: "Nómina",
    href: "/nomina",
    descriptor: "Plazas y sueldos · por institución",
    rutas: ["/nomina"],
    vistas: [{ href: "/nomina", label: "Explorador" }],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-sky-700",
      barra: "bg-sky-500",
      punto: "bg-sky-500",
      chip: "bg-sky-50 text-sky-700",
    },
  },
  {
    id: "democracia",
    nombre: "Democracia",
    href: "/democracia",
    descriptor: "Voto ciudadano · piloto",
    rutas: ["/democracia"],
    vistas: [
      { href: "/democracia", label: "Consenso", exact: true },
      { href: "/democracia/seguridad", label: "Seguridad" },
    ],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-amber-700",
      barra: "bg-amber-500",
      punto: "bg-amber-500",
      chip: "bg-amber-50 text-amber-700",
    },
  },
];

/** La vertical a la que pertenece una ruta, o `null` (panorama, fuentes…). */
export function seccionDe(pathname: string): Seccion | null {
  for (const seccion of SECCIONES) {
    if (
      seccion.rutas.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
      )
    ) {
      return seccion;
    }
  }
  return null;
}

/** ¿Está activa esta vista para la ruta actual? */
export function vistaActiva(vista: VistaSeccion, pathname: string): boolean {
  if (vista.exact) return pathname === vista.href;
  return pathname === vista.href || pathname.startsWith(`${vista.href}/`);
}

/**
 * La vista activa de una sección: la más específica que matchee. Así
 * `/congreso/perencion` enciende «Perención» y `/congreso/155693` enciende
 * «Iniciativas», sin que ambas compitan.
 */
export function vistaActivaDe(seccion: Seccion, pathname: string): VistaSeccion | null {
  const candidatas = seccion.vistas.filter((v) => vistaActiva(v, pathname));
  if (candidatas.length === 0) {
    // Rutas de detalle que no cuelgan de una vista (/procesos/x) → la raíz.
    return seccion.vistas[0] ?? null;
  }
  return candidatas.sort((a, b) => b.href.length - a.href.length)[0];
}
