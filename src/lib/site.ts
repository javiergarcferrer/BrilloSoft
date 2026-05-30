/**
 * Vista Verde — single source of truth for site content.
 *
 * Everything the marketing site renders (contact channels, services, process,
 * client list, copy) lives here so the components stay presentational and the
 * business can update wording in one place.
 */

export const site = {
  name: "Vista Verde",
  tagline: "Cuidamos tus espacios",
  /** Short value proposition used in hero + metadata. */
  pitch:
    "Limpieza y mantenimiento profesional para hogares y empresas. Especialistas en superficies delicadas, con más de 15 años cuidando cada espacio como si fuera propio.",
  description:
    "Vista Verde es una empresa de limpieza y mantenimiento en República Dominicana. Especialistas en materiales delicados, superficies difíciles y limpieza integral, con un enfoque eco-consciente y productos Ecolab.",
  domain: "vistaverde.do",
  url: "https://www.vistaverde.do",
  experienceYears: 15,
  serviceArea: "Todo el país",
  country: "República Dominicana",

  phoneDisplay: "+1 (809) 890-8548",
  /** E.164 without the leading + — used for wa.me / tel: links. */
  phoneE164: "18098908548",
  email: "vistaverde.services@gmail.com",
  instagram: {
    handle: "@vistaverde.services",
    url: "https://www.instagram.com/vistaverde.services",
  },
} as const;

/** Build a WhatsApp deep-link, optionally pre-filling a message. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${site.phoneE164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Build a mailto: link with an optional subject + body. */
export function mailtoUrl(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${site.email}${qs ? `?${qs}` : ""}`;
}

export const DEFAULT_WHATSAPP_MESSAGE =
  "¡Hola Vista Verde! Me gustaría solicitar una evaluación gratuita para mi espacio.";

/** Primary navigation (in-page anchors). */
export const navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#clientes", label: "Clientes" },
  { href: "#contacto", label: "Contacto" },
] as const;

export type IconName =
  | "sofa"
  | "sparkles"
  | "home"
  | "award"
  | "clock"
  | "medal"
  | "feather"
  | "leaf"
  | "mapPin"
  | "clipboardCheck"
  | "route"
  | "sparkle";

export interface Service {
  id: string;
  name: string;
  summary: string;
  items: string[];
  icon: IconName;
}

export const services: Service[] = [
  {
    id: "delicados",
    name: "Materiales delicados",
    summary:
      "Tapicería, cortinas, alfombras y muebles tratados con la técnica y los productos correctos, sin dañar la fibra.",
    items: [
      "Tapicería y muebles",
      "Cortinas y persianas",
      "Alfombras y textiles",
      "Colchones y cabeceras",
    ],
    icon: "sofa",
  },
  {
    id: "superficies",
    name: "Superficies",
    summary:
      "Madera, coralina, cocinas y campanas extractoras con acabados impecables y duraderos.",
    items: [
      "Madera y coralina",
      "Cocinas y campanas extractoras",
      "Pisos y enchapes",
      "Pulido y sellado",
    ],
    icon: "sparkles",
  },
  {
    id: "integral",
    name: "Limpieza integral",
    summary:
      "Un servicio completo, adaptado a las necesidades de cada espacio — de una vez o de forma recurrente.",
    items: [
      "Hogares y residencias",
      "Oficinas y comercios",
      "Post-construcción y post-mudanza",
      "Mantenimiento recurrente",
    ],
    icon: "home",
  },
];

export interface ValueProp {
  title: string;
  description: string;
  icon: IconName;
}

export const values: ValueProp[] = [
  {
    title: "Excelencia",
    description:
      "Cuidamos cada detalle y tratamos tu espacio como si fuera nuestro.",
    icon: "award",
  },
  {
    title: "Puntualidad",
    description: "Cumplimos lo acordado, en el tiempo acordado.",
    icon: "clock",
  },
  {
    title: "+15 años de experiencia",
    description:
      "Un equipo de profesionales que lleva más de 15 años perfeccionando el oficio.",
    icon: "medal",
  },
  {
    title: "Superficies delicadas",
    description:
      "Especialistas en los materiales y superficies más difíciles de tratar.",
    icon: "feather",
  },
  {
    title: "Enfoque eco-consciente",
    description:
      "Trabajamos con productos Ecolab: efectivos, seguros para tu espacio y el entorno.",
    icon: "leaf",
  },
  {
    title: "Cobertura nacional",
    description: "Llevamos nuestro servicio a todo el país.",
    icon: "mapPin",
  },
];

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  icon: IconName;
}

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Evaluación gratuita",
    description:
      "Visitamos tu espacio y evaluamos lo que necesita, sin ningún costo ni compromiso.",
    icon: "clipboardCheck",
  },
  {
    step: "02",
    title: "Plan a tu medida",
    description:
      "Diseñamos contigo un plan de acción personalizado para tu espacio y tu presupuesto.",
    icon: "route",
  },
  {
    step: "03",
    title: "Limpieza minuciosa",
    description:
      "Ejecutamos una limpieza profunda y detallada, con acabados que se notan.",
    icon: "sparkle",
  },
];

/** Brands that have trusted Vista Verde (from the existing site). */
export const clients: string[] = [
  "Trattoria",
  "Acrópolis Business Mall",
  "Beforeboarding",
  "Taco Bell",
];
