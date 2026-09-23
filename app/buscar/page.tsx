import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buscarCargos, buscarNormas, rutaDirecta } from "@/lib/buscar";
import { buscarInstituciones, hrefInstitucion } from "@/lib/instituciones";
import { buscarIniciativas, desdeMayusculas, normalizarIniciativa } from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { BUSQUEDAS } from "@/lib/secciones";
import { BuscadorUrl } from "@/components/buscador-url";
import { Card, CardTitle } from "@/components/ui/card";
import { EsqueletoFilas } from "@/components/esqueleto";
import { IconArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Buscar en toda la plataforma",
  description:
    "Una sola caja para instituciones, normativa, nómina, Congreso y compras públicas del Estado dominicano.",
};

/**
 * Buscar en toda la plataforma. Si lo tecleado tiene forma inequívoca —un RNC,
 * «Ley 47-20», un código de proceso, unas siglas— lleva directo; si no, junta
 * por vertical lo que se puede leer sin barrer una API entera y dice, para el
 * resto, dónde seguir y con qué alcance (`lib/buscar.ts`).
 */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 120);
  if (q) {
    const directa = rutaDirecta(q);
    if (directa) redirect(directa);
  }

  const [instituciones, normas, cargos] = q
    ? await Promise.all([buscarInstituciones(q, 8), buscarNormas(q), buscarCargos(q)])
    : [[], { normas: [], total: 0, generadoEn: null }, []];
  const sigue = BUSQUEDAS.filter((d) => d.href !== "/buscar");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Buscar en todo</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Escribe un nombre, un tema, una cita o un número. Un RNC, «Ley 47-20», un
          código de proceso o unas siglas te llevan directo a su página.
        </p>
      </header>

      <Suspense>
        <BuscadorUrl
          etiqueta="Buscar en toda la plataforma"
          placeholder="MINERD, Ley 47-20, agua potable, chofer, 101000000…"
          ayuda="Instituciones, normativa y nómina se buscan aquí mismo; Diputados, en vivo. Licitaciones, proveedores y Senado se abren en su vertical."
        />
      </Suspense>

      {q && (
        <>
          <Grupo titulo="Instituciones" vacio={instituciones.length === 0} nota="Por nombre o siglas.">
            <ul className="divide-y divide-hairline">
              {instituciones.map((i) => (
                <li key={i.id}>
                  <Fila href={hrefInstitucion(i)} titulo={i.nombre} detalle={[i.acronimo, i.tipo].filter(Boolean).join(" · ")} />
                </li>
              ))}
            </ul>
          </Grupo>

          <Grupo
            titulo="Normativa"
            vacio={normas.normas.length === 0}
            nota={
              normas.total > normas.normas.length
                ? `${formatInt(normas.total)} normas de los últimos cuatro años mencionan «${q}» en el título; estas son las más recientes.`
                : "En el título de leyes, decretos y resoluciones de los últimos cuatro años."
            }
          >
            <ul className="divide-y divide-hairline">
              {normas.normas.map((n) => (
                <li key={`${n.tipo}-${n.numero}-${n.fecha ?? ""}`}>
                  <Fila
                    href={n.href}
                    titulo={desdeMayusculas(n.titulo)}
                    detalle={`${n.tipo} ${n.numero}${n.fecha ? ` · ${formatFecha(n.fecha)}` : ""}`}
                  />
                </li>
              ))}
            </ul>
          </Grupo>

          <Grupo
            titulo="Cargos en la nómina"
            vacio={cargos.length === 0}
            nota="En la foto de nómina de las instituciones que la publican en formato procesable."
          >
            <ul className="divide-y divide-hairline">
              {cargos.map((c) => (
                <li key={c.cargo}>
                  <Fila
                    href={`/nomina?q=${encodeURIComponent(c.cargo)}`}
                    titulo={desdeMayusculas(c.cargo)}
                    detalle={`${formatInt(c.plazas)} plazas en ${c.instituciones} ${c.instituciones === 1 ? "institución" : "instituciones"}`}
                  />
                </li>
              ))}
            </ul>
          </Grupo>

          <Suspense
            fallback={
              <Card as="section" className="p-5" aria-busy="true">
                <CardTitle>Diputados</CardTitle>
                <EsqueletoFilas n={3} className="mt-3" />
              </Card>
            }
          >
            <Diputados q={q} />
          </Suspense>

          <Card as="section" className="p-5">
            <CardTitle>Sigue buscando «{q}» en</CardTitle>
            <ul className="mt-2 divide-y divide-hairline">
              {sigue.map((d) => (
                <li key={d.href}>
                  <Fila href={`${d.href}?q=${encodeURIComponent(q)}`} titulo={d.etiqueta} detalle={d.alcance} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

async function Diputados({ q }: { q: string }) {
  const pagina = await buscarIniciativas(q, 1, 300);
  if (!pagina) {
    return (
      <Card as="section" className="p-5">
        <CardTitle>Diputados</CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-alerta-700">
          El SIL de la Cámara no respondió: no es que no haya iniciativas, es que
          no pudimos mirar.{" "}
          <Link href={`/congreso?q=${encodeURIComponent(q)}`} className="font-medium text-brand-700 hover:underline">
            Reintentar en Congreso
          </Link>
        </p>
      </Card>
    );
  }
  const lista = pagina.results.slice(0, 6).map(normalizarIniciativa);
  return (
    <Grupo
      titulo="Diputados"
      vacio={lista.length === 0}
      nota={
        pagina.total > lista.length
          ? `${formatInt(pagina.total)} iniciativas de la Cámara lo mencionan; estas son las primeras.`
          : "En la descripción de las iniciativas de la Cámara de Diputados."
      }
      mas={pagina.total > lista.length ? `/congreso?q=${encodeURIComponent(q)}` : undefined}
    >
      <ul className="divide-y divide-hairline">
        {lista.map((i) => (
          <li key={i.id}>
            <Fila
              href={`/congreso/${i.id}`}
              titulo={desdeMayusculas(i.titulo)}
              detalle={[i.numero?.completo, i.condicion && desdeMayusculas(i.condicion)].filter(Boolean).join(" · ")}
            />
          </li>
        ))}
      </ul>
    </Grupo>
  );
}

function Grupo({
  titulo,
  nota,
  vacio,
  mas,
  children,
}: {
  titulo: string;
  nota: string;
  vacio: boolean;
  mas?: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="section" className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>{titulo}</CardTitle>
        {mas && !vacio && (
          <Link href={mas} className="text-xs font-medium text-brand-700 hover:underline">
            Ver todas
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{vacio ? "Nada aquí." : nota}</p>
      {!vacio && <div className="mt-2">{children}</div>}
    </Card>
  );
}

function Fila({ href, titulo, detalle }: { href: string | null; titulo: string; detalle?: string }) {
  const cuerpo = (
    <>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-sm leading-snug text-ink group-hover:text-brand-700">
          {titulo}
        </span>
        {detalle && <span className="mt-0.5 block text-xs text-ink-soft">{detalle}</span>}
      </span>
      {href && <IconArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />}
    </>
  );
  return href ? (
    <Link href={href} className="group flex min-h-11 items-start gap-3 py-2.5">
      {cuerpo}
    </Link>
  ) : (
    <div className="flex items-start gap-3 py-2.5">{cuerpo}</div>
  );
}
