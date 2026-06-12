import { NextRequest } from "next/server";
import { listProcesos } from "@/lib/dgcp";
import { formatMonto } from "@/lib/format";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hoyMenosDias(dias: number): string {
  return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? undefined;
  const estado = sp.get("estado") ?? "Proceso publicado";
  const modalidad = sp.get("modalidad") ?? undefined;
  const mipyme = sp.get("mipyme") ?? undefined;
  const uc = sp.get("uc") ?? undefined;

  try {
    const r = await listProcesos({
      q,
      estado: estado || undefined,
      modalidad,
      mipyme: mipyme === "1" ? "true" : undefined,
      unidad_compra: uc ? Number(uc) : undefined,
      startdate: hoyMenosDias(30),
      limit: 50,
    });

    const origen = req.nextUrl.origin;
    const partes = [
      q && `“${q}”`,
      modalidad,
      uc && `institución ${uc}`,
      mipyme === "1" && "MIPYMES",
    ].filter(Boolean);
    const titulo = `Licitaciones RD${partes.length ? " — " + partes.join(" · ") : ""}`;

    const items = r.content
      .slice(0, 50)
      .map((p) => {
        const link = `${origen}/procesos/${encodeURIComponent(p.codigo_proceso)}`;
        const desc = `${p.unidad_compra} · ${p.modalidad} · ${formatMonto(
          p.monto_estimado,
          p.divisa
        )} · cierre de ofertas: ${p.fecha_fin_recepcion_ofertas?.slice(0, 10) ?? "n/d"}`;
        return `    <item>
      <title>${esc(p.titulo || p.codigo_proceso)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(p.codigo_proceso)}</guid>
      <pubDate>${new Date(p.fecha_publicacion).toUTCString()}</pubDate>
      <description>${esc(desc)}</description>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(titulo)}</title>
    <link>${esc(origen)}</link>
    <description>Procesos de compras públicas de República Dominicana (datos abiertos DGCP). Suscríbete para recibir los nuevos automáticamente.</description>
    <language>es-do</language>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch {
    return new Response("Error consultando la API de la DGCP", { status: 502 });
  }
}
