import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Licitaciones RD — Compras públicas",
    short_name: "Licitaciones RD",
    description:
      "Busca, sigue y entiende las licitaciones y compras públicas del Estado dominicano, en vivo desde los datos abiertos de la DGCP.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2f6",
    theme_color: "#0f172a",
    categories: ["government", "business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
