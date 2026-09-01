import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Socrático.do — Preguntarle al Estado con sus propios datos",
    short_name: "Socrático.do",
    description:
      "Qué compra, qué legisla y a quién paga el Estado dominicano: compras públicas, Congreso Nacional y nómina estatal, leídos en vivo desde sus fuentes oficiales.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f3ea",
    theme_color: "#171d2e",
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
