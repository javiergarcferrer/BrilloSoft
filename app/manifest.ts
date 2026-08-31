import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gobiername.data — Inteligencia sobre el Estado dominicano",
    short_name: "Gobiername.data",
    description:
      "Qué compra, qué legisla y a quién paga el Estado dominicano: compras públicas, Congreso Nacional y nómina estatal, leídos en vivo desde sus fuentes oficiales.",
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
