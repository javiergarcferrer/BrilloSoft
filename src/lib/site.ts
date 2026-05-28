/**
 * Vista Verde — single source of truth for site content & business data.
 * Edit copy, contact details, services and clients here.
 */

export const SITE = {
  name: "Vista Verde",
  tagline: "Cuidamos tus espacios",
  // Short positioning line used in the hero / intro.
  intro:
    "Empresa de limpieza y mantenimiento comprometida con la excelencia, la puntualidad y el cuidado de cada espacio como si fuera propio.",
  metaDescription:
    "Vista Verde — limpieza y mantenimiento profesional en República Dominicana. Especialistas en el cuidado de materiales delicados: tapizados, cortinas, alfombras, muebles y madera. Productos Ecolab. Más de 15 años de experiencia.",
  url: "https://vistaverde.do",
  email: "vistaverde.services@gmail.com",
  phoneDisplay: "809-890-8548",
  whatsappNumber: "18098908548", // +1 (Rep. Dom.)
  instagramHandle: "@vistaverde.services",
  instagramUrl: "https://www.instagram.com/vistaverde.services/",
  coverage: "Todo el país",
  yearsExperience: 15,
} as const;

/** Build a WhatsApp deep-link with an optional prefilled message. */
export function whatsappUrl(
  message = "Hola Vista Verde 👋, me gustaría solicitar una evaluación gratuita para mi espacio.",
) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proceso", href: "#proceso" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Clientes", href: "#clientes" },
  { label: "Contacto", href: "#contacto" },
] as const;

export type Service = {
  icon: string;
  title: string;
  description: string;
};

export const SERVICES: Service[] = [
  {
    icon: "Sofa",
    title: "Tapizados y muebles",
    description:
      "Limpieza profunda de sofás, sillas y muebles tapizados, devolviéndoles frescura, textura y color.",
  },
  {
    icon: "Wind",
    title: "Cortinas y alfombras",
    description:
      "Cuidado especializado de textiles delicados, sin maltratar fibras ni acabados originales.",
  },
  {
    icon: "Trees",
    title: "Tratamiento de madera",
    description:
      "Limpieza, nutrición y protección de superficies y muebles de madera para alargar su vida.",
  },
  {
    icon: "ChefHat",
    title: "Cocinas y campanas",
    description:
      "Desengrase profundo de cocinas y campanas de extracción para entornos más seguros e higiénicos.",
  },
  {
    icon: "Building2",
    title: "Espacios comerciales",
    description:
      "Mantenimiento integral para restaurantes, oficinas, comercios y plazas con altos estándares.",
  },
  {
    icon: "Droplets",
    title: "Limpieza con Ecolab",
    description:
      "Productos profesionales de grado comercial, seguros para tu familia, tu equipo y tus superficies.",
  },
];

export type ProcessStep = {
  icon: string;
  step: string;
  title: string;
  description: string;
};

export const PROCESS: ProcessStep[] = [
  {
    icon: "Search",
    step: "01",
    title: "Evaluación gratuita",
    description:
      "Visitamos tu espacio y evaluamos tus necesidades sin ningún costo ni compromiso.",
  },
  {
    icon: "ClipboardCheck",
    step: "02",
    title: "Cotización de alcances",
    description:
      "Diseñamos un plan a la medida con alcances, tiempos y precios claros y transparentes.",
  },
  {
    icon: "Sparkles",
    step: "03",
    title: "Limpieza integral",
    description:
      "Ejecutamos una limpieza detallada con productos Ecolab y resultados visibles desde el primer día.",
  },
];

/** Client brands shown as a trust strip. */
export const CLIENTS = [
  "Trattoria",
  "Acrópolis Business Mall",
  "Before Boarding",
  "Taco Bell",
  "Okazu",
] as const;

export type Stat = { value: string; label: string };

export const STATS: Stat[] = [
  { value: "+15", label: "años de experiencia" },
  { value: "100%", label: "productos Ecolab" },
  { value: "Nacional", label: "cobertura en todo el país" },
];
