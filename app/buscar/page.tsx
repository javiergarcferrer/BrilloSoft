import Link from "next/link";
import { Fragment, Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buscarCargos, buscarNormas, buscarObras, rutaDirecta } from "@/lib/buscar";
import { formatPesos } from "@/lib/format";
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
  alternates: { canonical: "/buscar" },
  // Una página de resultados no es contenido: se sigue, no se indexa.
  robots: { index: false, follow: true },
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

  const [instituciones, normas, cargos, obras] = q
    ? await Promise.all([buscarInstituciones(q, 8), buscarNormas(q), buscarCargos(q), buscarObras(q)])
    : [[], { normas: [], total: 0, generadoEn: null }, [], { obras: [], total: 0 }];
  const sigue = BUSQUEDAS.filter((d) => d.href !== "/buscar");

  const grupos = [
    {
      titulo: "Instituciones",
      vacio: instituciones.length === 0,
      el: (
        <Grupo titulo="Instituciones" nota="Por nombre o siglas.">
          <ul className="divide-y divide-hairline">
            {instituciones.map((i) => (
              <li key={i.id}>
                <Fila href={hrefInstitucion(i)} titulo={i.nombre} detalle={[i.acronimo, i.tipo].filter(Boolean).join(" · ")} />
              </li>
            ))}
          </ul>
        </Grupo>
      ),
    },
    {
      titulo: "Normativa",
      vacio: normas.normas.length === 0,
      el: (
        <Grupo
          titulo="Normativa"
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
      ),
    },
    {
      titulo: "Obras públicas",
      vacio: obras.obras.length === 0,
      el: (
        <Grupo
          titulo="Obras públicas"
          nota={
            obras.total > obras.obras.length
              ? `${formatInt(obras.total)} proyectos de inversión coinciden; estos son los de mayor valor.`
              : "Proyectos de inversión de MapaInversiones, por nombre, entidad o SNIP."
          }
          mas={obras.total > obras.obras.length ? `/obras?q=${encodeURIComponent(q)}` : undefined}
        >
          <ul className="divide-y divide-hairline">
            {obras.obras.map((o) => (
              <li key={o.snip}>
                <Fila
                  href={`/obras/${o.snip}`}
                  titulo={desdeMayusculas(o.nombre)}
                  detalle={`SNIP ${o.snip} · ${o.estado} · ${formatPesos(o.valor)}`}
                />
              </li>
            ))}
          </ul>
        </Grupo>
      ),
    },
    {
      titulo: "Cargos en la nómina",
      vacio: cargos.length === 0,
      el: (
        <Grupo
          titulo="Cargos en la nómina"
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
      ),
    },
  ];
  const llenos = grupos.filter((g) => !g.vacio);
  const vacios = grupos.filter((g) => g.vacio);
  const todoVacio = llenos.length === 0;

  const sigueBuscando = (
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
  );

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
          {/*
            Los grupos vacíos no se pintan uno por uno. Cinco tarjetas que dicen
            «Nada aquí.» empujaban fuera de la pantalla lo único útil —dónde
            seguir buscando— y obligaban a leer cinco veces lo mismo; ahora se
            nombran juntos en una línea. Y si no hubo nada en ninguno, lo
            primero es «Sigue buscando», con el alcance de cada vertical.
          */}
          {llenos.map((g) => (
            <Fragment key={g.titulo}>{g.el}</Fragment>
          ))}
          {vacios.length > 0 && (
            <SinCoincidencias q={q} donde={vacios.map((g) => g.titulo)} />
          )}

          {todoVacio && sigueBuscando}

          {/*
            Diputados se lee en vivo y llega aparte. Su vacío se dice en la
            misma línea corta que los demás; su caída, no: «el SIL no
            respondió» es otra pantalla, y se queda en su tarjeta.
          */}
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

          {!todoVacio && sigueBuscando}
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
  if (lista.length === 0) return <SinCoincidencias q={q} donde={["Diputados"]} />;
  return (
    <Grupo
      titulo="Diputados"
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
  mas,
  children,
}: {
  titulo: string;
  nota: string;
  mas?: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="section" className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>{titulo}</CardTitle>
        {mas && (
          <Link href={mas} className="text-xs font-medium text-brand-700 hover:underline">
            Ver todas
          </Link>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{nota}</p>
      <div className="mt-2">{children}</div>
    </Card>
  );
}

/**
 * Los grupos que no trajeron nada, nombrados juntos en una línea: «Nada con
 * «agua» en Normativa u Obras públicas.» Se lee de una vez y no empuja fuera
 * de la pantalla lo que sí trajo algo. Una lista disyuntiva y no «ni»: la
 * frase afirma que no apareció en ninguno, y «o» lo dice sin doble negación.
 */
function SinCoincidencias({ q, donde }: { q: string; donde: string[] }) {
  const lista = new Intl.ListFormat("es", { type: "disjunction" }).format(donde);
  return (
    <p className="px-1 text-sm leading-relaxed text-ink-soft">
      Nada con «{q}» en {lista}.
    </p>
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
