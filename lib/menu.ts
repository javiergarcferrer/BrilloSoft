/**
 * El megamenú de la cabecera y la hoja «Más» del teléfono: toda la plataforma
 * agrupada por lo que el ciudadano viene a mirar, no por quién publica el dato.
 *
 * Tres puertas —el dinero, las leyes, el Estado— y en cada una sus columnas.
 * Cada enlace lleva una línea en llano que dice qué va a encontrar: el
 * sustantivo solo («Mercado», «Perención») obliga a saberlo antes de entrar.
 * Las verticales y sus rutas siguen saliendo de `lib/secciones.ts`, que es la
 * fuente única; aquí solo se ordenan y se explican. Un enlace nuevo en una
 * vertical se añade allí y se describe aquí.
 */

import { SECCIONES, type SeccionId } from "@/lib/secciones";

export interface EnlaceMenu {
  href: string;
  label: string;
  /** Qué hay detrás, en una línea. */
  nota: string;
}

export interface ColumnaMenu {
  titulo: string;
  /** La vertical, para su punto de color; sin ella, punto de tinta. */
  seccion?: SeccionId;
  enlaces: EnlaceMenu[];
}

export interface GrupoMenu {
  id: "dinero" | "leyes" | "estado";
  label: string;
  /** Una frase bajo la cabecera del panel. */
  resumen: string;
  columnas: ColumnaMenu[];
  /** La tarjeta destacada del panel: la entrada que más resuelve. */
  destacado: EnlaceMenu;
}

export const MENU: GrupoMenu[] = [
  {
    id: "dinero",
    label: "Dinero público",
    resumen: "Qué compra el Estado, cuánto gasta, cuánto debe y a quién le paga.",
    columnas: [
      {
        titulo: "Compras públicas",
        seccion: "licitaciones",
        enlaces: [
          { href: "/licitaciones", label: "Licitaciones", nota: "Lo que el Estado está comprando ahora" },
          { href: "/contratos", label: "Contratado", nota: "Quién ganó y por cuánto" },
          { href: "/proveedores", label: "Proveedores", nota: "Quién le vende al Estado" },
          { href: "/estadisticas", label: "Mercado", nota: "Cómo compró en los últimos 30 días" },
          { href: "/planes", label: "Planes de compra", nota: "Lo que cada institución dijo que compraría" },
          { href: "/historico", label: "Desde 2015", nota: "Todo lo contratado, año por año, y a quién" },
          { href: "/guia", label: "Cómo licitar", nota: "Guía para venderle al Estado" },
        ],
      },
      {
        titulo: "Presupuesto y deuda",
        seccion: "finanzas",
        enlaces: [
          { href: "/finanzas", label: "Ejecución del presupuesto", nota: "Cuánto ha gastado cada institución" },
          { href: "/deuda", label: "Deuda pública", nota: "Cuánto debe el Estado, desde el año 2000" },
          { href: "/finanzas/guia", label: "Cómo leer el presupuesto", nota: "Vigente, devengado y pagado, en llano" },
        ],
      },
      {
        titulo: "Sueldos y obras",
        seccion: "nomina",
        enlaces: [
          { href: "/nomina", label: "Nómina pública", nota: "Plazas y sueldos por institución y cargo" },
          { href: "/obras", label: "Obras públicas", nota: "Si la obra existe y cuánto avanza" },
        ],
      },
    ],
    destacado: {
      href: "/instituciones",
      label: "Sigue el dinero de una institución",
      nota: "Su presupuesto, sus compras, su nómina y sus obras en una sola página.",
    },
  },
  {
    id: "leyes",
    label: "Leyes",
    resumen: "Qué se legisla, qué decreta el Ejecutivo y quién te representa.",
    columnas: [
      {
        titulo: "Congreso Nacional",
        seccion: "congreso",
        enlaces: [
          { href: "/congreso", label: "Diputados", nota: "Iniciativas y en qué punto van" },
          { href: "/congreso/senado", label: "Senado", nota: "Expedientes del cuatrienio" },
          { href: "/congreso/legisladores", label: "Legisladores", nota: "Quién te representa y cómo vota" },
          { href: "/congreso/perencion", label: "Por archivarse", nota: "Lo que perime si no avanza" },
          { href: "/congreso/guia", label: "Cómo nace una ley", nota: "Del depósito a la Gaceta" },
        ],
      },
      {
        titulo: "Ejecutivo y Constitucional",
        seccion: "normativa",
        enlaces: [
          { href: "/normativa", label: "Decretos y leyes", nota: "Lo que se promulga y se firma, por año" },
          { href: "/constitucional", label: "Tribunal Constitucional", nota: "Sus sentencias, año por año" },
        ],
      },
      {
        titulo: "Tu voto",
        seccion: "democracia",
        enlaces: [
          { href: "/democracia", label: "Consenso ciudadano", nota: "Qué opinaron los votantes de cada iniciativa" },
          { href: "/democracia/seguridad", label: "Cómo se protege tu voto", nota: "Cédula, privacidad y verificación" },
        ],
      },
    ],
    destacado: {
      href: "/congreso",
      label: "Elige una iniciativa y vota",
      nota: "Lee qué dice, en qué va y di si estás a favor o en contra.",
    },
  },
  {
    id: "estado",
    label: "El Estado",
    resumen: "Cada institución, cada provincia y cómo se gestiona.",
    columnas: [
      {
        titulo: "Quién es quién",
        enlaces: [
          { href: "/instituciones", label: "Instituciones", nota: "Cada ministerio, dirección y ayuntamiento" },
          { href: "/provincias", label: "Provincias", nota: "El Estado visto desde tu provincia" },
          { href: "/gestion", label: "Gestión pública", nota: "El ranking SISMAP de instituciones y municipios" },
          { href: "/documentos", label: "Biblioteca del Estado", nota: "Informes, memorias y estadísticas que publica cada institución" },
          { href: "/datos", label: "Datos abiertos", nota: "Todo el catálogo de datos.gob.do en un buscador" },
        ],
      },
      {
        titulo: "La plataforma",
        enlaces: [
          { href: "/", label: "Panorama", nota: "Todo lo importante en una página" },
          { href: "/seguimiento", label: "Mi seguimiento", nota: "Lo que sigues y qué cambió" },
          { href: "/fuentes", label: "Estado de las fuentes", nota: "Qué leemos, con qué límites y qué está bloqueado" },
          { href: "/seguridad", label: "Seguridad y cumplimiento", nota: "Cómo tratamos los datos" },
        ],
      },
    ],
    destacado: {
      href: "/buscar",
      label: "Buscar en todo",
      nota: "Una institución, una ley, un RNC o un tema: una sola caja.",
    },
  },
];

/** El punto de color de una columna: el de su vertical, o tinta. */
export function puntoDe(columna: ColumnaMenu): string {
  return SECCIONES.find((s) => s.id === columna.seccion)?.hue.punto ?? "bg-ink";
}

/** ¿Cae la ruta actual dentro de este grupo? Enciende su disparador. */
export function grupoActivo(grupo: GrupoMenu, pathname: string): boolean {
  const rutas = grupo.columnas.flatMap((c) => {
    const seccion = SECCIONES.find((s) => s.id === c.seccion);
    return [...(seccion?.rutas ?? []), ...c.enlaces.map((e) => e.href)];
  });
  return rutas.some(
    (r) => r !== "/" && (pathname === r || pathname.startsWith(`${r}/`)),
  );
}
