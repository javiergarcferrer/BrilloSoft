/**
 * Arquitectura de información de la plataforma — fuente única de verdad.
 *
 * Socrático.do cubre tres verticales (licitaciones, congreso, nómina) y un
 * panorama transversal. Todo el chrome —nav global, barra de sección, tab bar
 * móvil, agrupación del pie— se deriva de este módulo para que la separación
 * entre verticales sea estructural y no una convención repetida a mano.
 *
 * Reglas de ergonomía que este módulo hace cumplir:
 *  - Cada ruta pertenece a lo sumo a una vertical (`seccionDe` es determinista).
 *  - Cada vertical tiene un matiz propio (`--color-v-*` en globals.css), usado
 *    SOLO para orientación (estado activo del nav, acento de la barra de
 *    sección, chip del panorama) — nunca para el contenido, que conserva su
 *    color semántico (vigente, perimido…). Todos son tintas apagadas que
 *    conviven sobre el papel de la identidad.
 *  - Las etiquetas del nav son las mismas en global, sección, tab bar y pie:
 *    un solo vocabulario.
 *
 * Las clases de Tailwind viven aquí como literales para que el escáner las vea.
 */

export type SeccionId =
  | "licitaciones"
  | "finanzas"
  | "congreso"
  | "normativa"
  | "nomina"
  | "democracia";

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
  /** Sustantivo corto: barra de sección, tab bar, pie. Se reconoce de un vistazo. */
  nombre: string;
  /**
   * La vertical dicha como pregunta, para el nav global de escritorio.
   *
   * Ergonomía cognitiva: donde el usuario está *eligiendo a dónde ir* y hay
   * espacio, la pregunta informa más que el sustantivo («¿Qué compra?» dice
   * qué vas a encontrar; «Licitaciones» te obliga a saberlo). Donde ya sabe
   * dónde está y solo necesita reconocer —pestañas de 72px, barra de
   * sección—, el sustantivo gana. Por eso conviven las dos.
   */
  pregunta: string;
  /** Ruta raíz de la vertical (a donde lleva el nav global). */
  href: string;
  /** Qué describe la vertical, para subtítulos y tarjetas. */
  descriptor: string;
  /** Prefijos de ruta que pertenecen a la vertical. */
  rutas: string[];
  /** Vistas internas (subnav). Una sola vista ⇒ la barra no pinta tabs. */
  vistas: VistaSeccion[];
  /**
   * Rutas que pertenecen a la vertical pero **a ninguna de sus vistas**: un
   * trámite, un retorno de OAuth, un formulario. Ahí la barra no enciende
   * nada.
   *
   * Existe porque la ruta sola no distingue dos casos opuestos. `/procesos/ABC`
   * es la **ficha** de lo que un listado lista: viene de «Buscar» y encender
   * «Buscar» dice la verdad. `/democracia/registro` es un **trámite** que no
   * cuelga de ninguna vista, y encender «Consenso» —que además es `exact`— le
   * dice al visitante que está en una página en la que no está. Como no se
   * puede deducir del camino, se declara.
   */
  sinVista?: string[];
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
    pregunta: "¿Qué compra?",
    href: "/licitaciones",
    descriptor: "Compras públicas · DGCP",
    rutas: [
      "/licitaciones",
      "/procesos",
      "/proveedores",
      "/estadisticas",
      "/contratos",
      "/planes",
      "/guia",
    ],
    vistas: [
      { href: "/licitaciones", label: "Buscar" },
      { href: "/estadisticas", label: "Mercado" },
      { href: "/contratos", label: "Contratado" },
      { href: "/proveedores", label: "Proveedores" },
      { href: "/planes", label: "Planes" },
      { href: "/guia", label: "Guía" },
    ],
    conBuscadorGlobal: true,
    hue: {
      activo: "text-v-compras",
      barra: "bg-v-compras",
      punto: "bg-v-compras",
      chip: "bg-v-compras-tenue text-v-compras",
    },
  },
  {
    id: "finanzas",
    nombre: "Finanzas",
    pregunta: "¿En qué gasta?",
    href: "/finanzas",
    descriptor: "Ejecución del presupuesto · SIGEF",
    rutas: ["/finanzas"],
    vistas: [
      { href: "/finanzas", label: "Ejecución" },
      { href: "/finanzas/guia", label: "Guías" },
    ],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-v-finanzas",
      barra: "bg-v-finanzas",
      punto: "bg-v-finanzas",
      chip: "bg-v-finanzas-tenue text-v-finanzas",
    },
  },
  {
    id: "congreso",
    nombre: "Congreso",
    pregunta: "¿Qué legisla?",
    href: "/congreso",
    descriptor: "Iniciativas · Diputados y Senado",
    rutas: ["/congreso"],
    vistas: [
      { href: "/congreso", label: "Diputados" },
      { href: "/congreso/senado", label: "Senado" },
      { href: "/congreso/perencion", label: "Perención", exact: true },
      { href: "/congreso/guia", label: "Guía" },
    ],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-v-congreso",
      barra: "bg-v-congreso",
      punto: "bg-v-congreso",
      chip: "bg-v-congreso-tenue text-v-congreso",
    },
  },
  {
    id: "normativa",
    nombre: "Normativa",
    pregunta: "¿Qué decreta?",
    href: "/normativa",
    descriptor: "Decretos y leyes · Poder Ejecutivo",
    rutas: ["/normativa"],
    vistas: [{ href: "/normativa", label: "Decretos y leyes" }],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-v-normativa",
      barra: "bg-v-normativa",
      punto: "bg-v-normativa",
      chip: "bg-v-normativa-tenue text-v-normativa",
    },
  },
  {
    id: "nomina",
    nombre: "Nómina",
    pregunta: "¿A quién paga?",
    href: "/nomina",
    descriptor: "Plazas y sueldos · por institución",
    rutas: ["/nomina"],
    vistas: [{ href: "/nomina", label: "Explorador" }],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-v-nomina",
      barra: "bg-v-nomina",
      punto: "bg-v-nomina",
      chip: "bg-v-nomina-tenue text-v-nomina",
    },
  },
  {
    id: "democracia",
    nombre: "Democracia",
    pregunta: "¿Qué opinas?",
    href: "/democracia",
    descriptor: "Voto ciudadano · piloto",
    rutas: ["/democracia"],
    vistas: [
      { href: "/democracia", label: "Consenso", exact: true },
      { href: "/democracia/seguridad", label: "Seguridad" },
    ],
    // El registro por cédula y la vuelta de Cuenta Única son trámites: se
    // llega a ellos desde cualquier ficha y no son ninguna de las dos vistas.
    sinVista: ["/democracia/registro", "/democracia/cuenta-unica"],
    conBuscadorGlobal: false,
    hue: {
      activo: "text-v-democracia",
      barra: "bg-v-democracia",
      punto: "bg-v-democracia",
      chip: "bg-v-democracia-tenue text-v-democracia",
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
  // Un trámite declarado no enciende ninguna vista: ver `sinVista`.
  if (
    seccion.sinVista?.some(
      (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
    )
  ) {
    return null;
  }
  const candidatas = seccion.vistas.filter((v) => vistaActiva(v, pathname));
  if (candidatas.length === 0) {
    // Rutas de detalle que sí cuelgan de una vista (/procesos/x) → la raíz.
    return seccion.vistas[0] ?? null;
  }
  return candidatas.sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * Dónde se puede buscar por texto, y **con qué alcance**.
 *
 * La paleta (`components/paleta.tsx`) ofrece «Buscar “x” en…» una fila por
 * destino, y cada fila dice debajo qué recorre esa búsqueda. Es la misma
 * frase que el campo de cada superficie pone bajo sí mismo: los alcances de
 * esta plataforma son muy distintos —el Senado distingue tildes, un nombre de
 * proveedor solo se busca entre quienes ganaron algo hace poco— y quien elige
 * a dónde mandar su texto necesita saberlo antes, no después de leer «sin
 * resultados». Un destino nuevo con `?q=` se declara aquí y aparece solo.
 */
export interface DestinoBusqueda {
  seccion: SeccionId;
  /** Nombre corto del destino: «Diputados», «Proveedores». */
  etiqueta: string;
  /** La ruta que recibe `?q=`. */
  href: string;
  /** Qué recorre la búsqueda, en llano. */
  alcance: string;
}

export const BUSQUEDAS: DestinoBusqueda[] = [
  {
    seccion: "licitaciones",
    etiqueta: "Licitaciones",
    href: "/licitaciones",
    alcance:
      "Título, descripción, institución, área o código de los procesos de la DGCP, leyendo hasta 6.000 por consulta —el buscador dice cuántos leyó—; abre con los abiertos a ofertar.",
  },
  {
    seccion: "licitaciones",
    etiqueta: "Proveedores",
    href: "/proveedores",
    alcance:
      "Un RNC, cédula o RPE busca en el registro completo; un nombre, solo entre quienes ganaron contratos en las últimas semanas.",
  },
  {
    seccion: "congreso",
    etiqueta: "Diputados",
    href: "/congreso",
    alcance: "Dentro de la descripción de las iniciativas de la Cámara, no solo en el título.",
  },
  {
    seccion: "congreso",
    etiqueta: "Senado",
    href: "/congreso/senado",
    alcance: "Expedientes del Senado del cuatrienio vigente. Literal: distingue tildes.",
  },
];

/**
 * Las páginas de la plataforma que no pertenecen a ninguna vertical. El pie y
 * la paleta las nombran; aquí se declaran una vez.
 */
export const PAGINAS_PLATAFORMA: { href: string; label: string; descriptor: string }[] = [
  { href: "/", label: "Panorama", descriptor: "Las verticales en una sola página" },
  { href: "/seguimiento", label: "Mi seguimiento", descriptor: "Lo que sigues y qué cambió desde tu última visita" },
  { href: "/fuentes", label: "Estado de las fuentes", descriptor: "Qué alimenta la plataforma y qué está bloqueado" },
  { href: "/seguridad", label: "Seguridad y cumplimiento", descriptor: "Postura de datos, Ley 172-13 y 200-04" },
];
