import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    // Las descargas CSV leen la DGCP o el SIL enteros en cada petición: un
    // rastreador que siga sus enlaces no debe dispararlas.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*/csv"] },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
