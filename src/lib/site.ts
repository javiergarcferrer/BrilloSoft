/**
 * Vista Verde — single source of truth for site content.
 *
 * Everything the marketing site renders (contact channels, services, process,
 * clients, copy, image paths) lives here so the components stay presentational
 * and the business can update content in one place.
 *
 * Image assets under /public/images were migrated from the original Webflow
 * site (www.vistaverde.do).
 */

export const site = {
  name: "Vista Verde",
  tagline: "Cuidamos tus espacios",
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
  phoneE164: "18098908548",
  email: "vistaverde.services@gmail.com",
  instagram: {
    handle: "@vistaverde.services",
    url: "https://www.instagram.com/vistaverde.services",
  },
} as const;

/** Key image assets (migrated from Webflow). */
export const assets = {
  logo: "/images/vista-verde-logo.png",
  hero: "/images/dsc06838.jpg",
  eco: "/images/pexels-shvets.jpg",
  ecolabLogo: "/images/ecolab-logo.svg",
  dossier: "/images/dossier-servicios.pdf",
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
  image: string;
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
    image: "/images/dsc06826.jpg",
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
    image: "/images/dsc06808.jpg",
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
    image: "/images/dsc06813.jpg",
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

export interface Client {
  name: string;
  logo: string;
}

/** Brands that trust Vista Verde — logos migrated from the existing site. */
export const clients: Client[] = [
  { name: "Trattoria", logo: "/images/client-trattoria.svg" },
  { name: "Acrópolis Business Mall", logo: "/images/client-acropolis.webp" },
  { name: "Taco Bell", logo: "/images/client-taco-bell.svg" },
  { name: "Estrellas Orientales", logo: "/images/client-estrellas.png" },
  { name: "Sigma", logo: "/images/client-sigma.png" },
  { name: "El Catador", logo: "/images/client-elcatador.png" },
  { name: "Beforeboarding", logo: "/images/client-beforeboarding.png" },
  { name: "Okazu", logo: "/images/client-okazu.png" },
  { name: "LAM", logo: "/images/client-lam.png" },
];

export interface GalleryPhoto {
  src: string;
  alt: string;
}

/** Real work photos used in the "nosotros" collage. */
export const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/images/dsc06740.jpg",
    alt: "El equipo de Vista Verde en una jornada de trabajo",
  },
  {
    src: "/images/pexels-danilyuk.jpg",
    alt: "Limpieza profesional de superficies delicadas",
  },
  {
    src: "/images/img-4960.jpg",
    alt: "Resultados impecables de Vista Verde",
  },
];
