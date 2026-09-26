import { NextResponse } from "next/server";
import { buscarEnTodo, esTipoResultado, TIPOS_RESULTADO } from "@/lib/busqueda";
import { desdeMayusculas } from "@/lib/congreso";

export const dynamic = "force-dynamic";

const ETIQUETA = Object.fromEntries(TIPOS_RESULTADO.map((t) => [t.clave, t.etiqueta]));

/**
 * El índice de `lib/busqueda.ts` para la paleta ⌘K: las primeras filas de
 * lo tecleado, de cualquier tipo, ya ordenadas. El corpus (siete megas) y el
 * modelo no viajan al navegador; aquí se busca y salen `n` filas.
 *
 * `?q=` (2 a 120 caracteres), `?n=` (1 a 20, por defecto 6) y `?tipo=`
 * (allowlist de `TIPOS_RESULTADO`).
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ resultados: [], total: 0 });
  const n = Math.min(20, Math.max(1, Number.parseInt(params.get("n") ?? "6", 10) || 6));
  const tipo = params.get("tipo");
  if (tipo !== null && !esTipoResultado(tipo)) {
    return NextResponse.json({ error: "tipo desconocido" }, { status: 400 });
  }
  try {
    // Se piden de más para poder variar: seis cargos de «salud mental»
    // taparían la norma que crea el centro. Sin tipo elegido, a lo sumo la
    // mitad de las filas son de un mismo tipo, sin romper el orden.
    const h = await buscarEnTodo(q, { tipo: tipo ?? undefined, porPagina: tipo ? n : n * 4 });
    if (!h) return NextResponse.json({ error: "El índice de búsqueda no cargó" }, { status: 502 });
    const tope = tipo ? n : Math.ceil(n / 2);
    const cuenta = new Map<string, number>();
    const numerados = h.resultados.map((r, rango) => ({ r, rango }));
    const elegidos = numerados.filter(({ r }) => {
      const c = cuenta.get(r.tipo) ?? 0;
      if (c >= tope) return false;
      cuenta.set(r.tipo, c + 1);
      return true;
    });
    const rangos = new Set(elegidos.map((e) => e.rango));
    const filas = [...elegidos, ...numerados.filter((e) => !rangos.has(e.rango))]
      .slice(0, n)
      .sort((a, b) => a.rango - b.rango)
      .map((e) => e.r);
    return NextResponse.json(
      {
        resultados: filas.map((r) => ({
          tipo: r.tipo,
          etiqueta: ETIQUETA[r.tipo],
          // Normas, obras y cargos llegan de su fuente en MAYÚSCULAS.
          titulo: r.tipo === "norma" || r.tipo === "obra" || r.tipo === "cargo" ? desdeMayusculas(r.titulo) : r.titulo,
          detalle: [r.detalle, r.origen].filter(Boolean).join(" · ") || null,
          href: r.href,
          externo: r.externo,
          via: r.via,
        })),
        total: h.total,
        generado: h.generado,
      },
      // El índice solo cambia con un despliegue.
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch {
    return NextResponse.json({ error: "No se pudo buscar" }, { status: 502 });
  }
}
