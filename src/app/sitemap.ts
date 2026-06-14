import type { MetadataRoute } from "next";
import { LICITACIONES } from "@/lib/licitaciones/data";

const SITE_URL = "https://licitard.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = ["", "/buscar", "/seguimiento", "/analitica"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const licitaciones = LICITACIONES.map((l) => ({
    url: `${SITE_URL}/licitacion/${encodeURIComponent(l.id)}`,
    lastModified: new Date(l.publicada),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...rutas, ...licitaciones];
}
