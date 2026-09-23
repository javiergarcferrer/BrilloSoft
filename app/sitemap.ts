import type { MetadataRoute } from "next";
import { INSTITUCIONES, hrefInstitucion } from "@/lib/instituciones";
import { CAPITULOS } from "@/lib/capitulos";
import { PAGINAS_PLATAFORMA, SECCIONES } from "@/lib/secciones";

/**
 * El dominio de producción, escrito aquí y no leído del entorno: las
 * superficies de la plataforma no tienen variables de entorno (CLAUDE.md, la
 * invariante). Si el dominio cambia, cambia esta línea.
 */
export const SITIO = "https://brillo-soft.vercel.app";

/**
 * El mapa del sitio: las vistas de cada vertical, las páginas transversales y
 * las fichas que se pueden enumerar sin consultar a nadie —instituciones y
 * capítulos del presupuesto—. Las fichas que dependen de una fuente en vivo
 * (procesos, iniciativas, normas) las encuentra el buscador por sus enlaces.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const vistas = SECCIONES.flatMap((s) => s.vistas.map((v) => v.href));
  const plataforma = PAGINAS_PLATAFORMA.map((p) => p.href);
  const rutas = [...new Set([...plataforma, ...vistas, "/fuentes"])];
  return [
    ...rutas.map((r) => ({ url: `${SITIO}${r}`, changeFrequency: "daily" as const })),
    ...INSTITUCIONES.map((i) => ({
      url: `${SITIO}${hrefInstitucion(i)}`,
      changeFrequency: "weekly" as const,
    })),
    ...CAPITULOS.map((c) => ({
      url: `${SITIO}/finanzas/${c.codigo}`,
      changeFrequency: "monthly" as const,
    })),
  ];
}
