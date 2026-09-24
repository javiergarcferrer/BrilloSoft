import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  INSTITUCIONES,
  buscarInstituciones,
  hrefInstitucion,
  type Institucion,
} from "@/lib/instituciones";
import { getFiscal } from "@/lib/fiscal";
import { formatPesos } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { BuscadorUrl } from "@/components/buscador-url";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/estado-vacio";

export const metadata: Metadata = {
  alternates: { canonical: "/instituciones" },
  title: "Instituciones del Estado",
  description:
    "Cada institución del Estado dominicano en una página: presupuesto, compras, nómina y normativa, que el Estado publica en cuatro catálogos distintos.",
};

export const revalidate = 86400;

/**
 * El directorio de instituciones: la puerta a las fichas.
 *
 * Sin búsqueda, lista los capítulos del presupuesto de mayor gasto con sus
 * unidades de compra —lo que casi todo el mundo busca—, y deja hospitales y
 * ayuntamientos a una búsqueda de distancia. Con `?q=`, filtra el cruce entero.
 */
export default async function InstitucionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const fiscal = await getFiscal();
  const porCapitulo = new Map<string, Institucion[]>();
  for (const i of INSTITUCIONES) {
    if (!i.capitulo) continue;
    const lista = porCapitulo.get(i.capitulo) ?? [];
    lista.push(i);
    porCapitulo.set(i.capitulo, lista);
  }
  const capitulos = (fiscal?.instituciones ?? [])
    .filter((c) => porCapitulo.has(c.codigo))
    .sort((a, b) => b.devengado - a.devengado);
  const locales = INSTITUCIONES.filter((i) => i.tipo === "Gobierno local").length;
  const hospitales = INSTITUCIONES.filter((i) => i.tipo === "Hospital").length;
  const resultados = q ? buscarInstituciones(q, 60) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Instituciones del Estado</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          El Estado publica cada institución en cuatro catálogos que no se hablan:
          presupuesto, compras, nómina y normativa. Aquí cada una tiene una sola
          página. {formatInt(INSTITUCIONES.length)} unidades de compra, entre ellas{" "}
          {formatInt(hospitales)} hospitales y {formatInt(locales)} gobiernos locales.
        </p>
      </header>

      <Suspense>
        <BuscadorUrl
          etiqueta="Buscar una institución"
          placeholder="Nombre o siglas: MINERD, Obras Públicas, Ayuntamiento de Santiago…"
          ayuda="Busca en el nombre y las siglas de las 739 unidades de compra activas de la DGCP, sin distinguir tildes."
        />
      </Suspense>

      {q ? (
        resultados.length === 0 ? (
          <EstadoVacio titulo={`Ninguna institución coincide con «${q}»`}>
            Prueba con las siglas (MOPC, MINERD) o con una palabra del nombre.
          </EstadoVacio>
        ) : (
          <Card as="section">
            <ul className="divide-y divide-hairline">
              {resultados.map((i) => (
                <FilaInstitucion key={i.id} i={i} />
              ))}
            </ul>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          {capitulos.map((c) => {
            const unidades = (porCapitulo.get(c.codigo) ?? []).sort(
              (a, b) => Number(b.tipo === "Institución") - Number(a.tipo === "Institución"),
            );
            return (
              <Card as="section" key={c.codigo} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <CardTitle>{c.nombreLegible}</CardTitle>
                  <Link
                    href={`/finanzas/${c.codigo}`}
                    className="font-mono text-xs tabular-nums text-ink-soft hover:text-brand-700"
                  >
                    {formatPesos(c.devengado)} devengado
                  </Link>
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  {unidades.slice(0, 12).map((u) => (
                    <li key={u.id}>
                      <Link href={hrefInstitucion(u)} className="inline-flex min-h-6 items-center text-brand-700 hover:underline">
                        {u.acronimo || u.nombre}
                      </Link>
                    </li>
                  ))}
                  {unidades.length > 12 && (
                    <li className="text-xs text-ink-soft">
                      y {unidades.length - 12} más: búscalas por nombre
                    </li>
                  )}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-ink-soft">
        La institución es la unidad de compra de la DGCP; su presupuesto es el del
        capítulo al que la propia DGCP la adscribe. El cruce se regenera con{" "}
        <code className="font-mono">scripts/build-instituciones.py</code>.
      </p>
    </div>
  );
}

function FilaInstitucion({ i }: { i: Institucion }) {
  return (
    <li>
      <Link
        href={hrefInstitucion(i)}
        className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-canvas/60 sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-[15px] leading-snug text-ink">{i.nombre}</span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            {[i.acronimo, i.tipo].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="flex shrink-0 flex-wrap justify-end gap-1">
          {i.capitulo && <Badge variant="neutro">Presupuesto</Badge>}
          {i.nomina && <Badge variant="neutro">Nómina</Badge>}
        </span>
      </Link>
    </li>
  );
}
