import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { rutaDirecta } from "@/lib/buscar";
import {
  buscarEnTodo,
  esTipoResultado,
  TIPOS_RESULTADO,
  type Resultado,
  type TipoResultado,
} from "@/lib/busqueda";
import { buscarIniciativas, desdeMayusculas, marcaDeIniciativa, normalizarIniciativa } from "@/lib/congreso";
import { formatFecha, formatPesos } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { BUSQUEDAS } from "@/lib/secciones";
import Antiguedad from "@/components/antiguedad";
import { BuscadorUrl } from "@/components/buscador-url";
import { EstadoVacio } from "@/components/estado-vacio";
import { EsqueletoFilas } from "@/components/esqueleto";
import { FiltroEnlace, NavFiltros } from "@/components/nav-filtros";
import { Paginador } from "@/components/paginador";
import { Resaltado } from "@/components/resaltado";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { IconArrowRight, IconExternal } from "@/components/icons";

export const metadata: Metadata = {
  alternates: { canonical: "/buscar" },
  // Una página de resultados no es contenido: se sigue, no se indexa.
  robots: { index: false, follow: true },
  title: "Buscar en toda la plataforma",
  description:
    "Una sola caja para instituciones, normativa, obras, documentos, datos abiertos, nómina y Congreso del Estado dominicano, por palabra y por tema.",
};

/**
 * Buscar en toda la plataforma. Si lo tecleado tiene forma inequívoca —un RNC,
 * «Ley 47-20», un código de proceso, unas siglas— lleva directo
 * (`lib/buscar.ts`). Si no, el índice de `lib/busqueda.ts` ordena en una sola
 * lista, por palabra y por tema, lo que traen seis instantáneas; Diputados se
 * lee en vivo aparte, y lo que exige barrer una API entera (licitaciones,
 * proveedores, Senado) se ofrece como enlace con su alcance, no se finge.
 *
 * Dos vistas del mismo resultado: «Todo» junta los mejores de cada tipo, en
 * el orden de su mejor acierto —se ve de un vistazo en qué vertical vive lo
 * buscado—; un tipo elegido es la lista entera de ese tipo, paginada. Los
 * filtros son enlaces: la vista se comparte y vuelve con «atrás».
 */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 120);
  const tipo = esTipoResultado(sp.tipo) ? sp.tipo : undefined;
  const pagina = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);
  if (q) {
    const directa = rutaDirecta(q);
    if (directa) redirect(directa);
  }
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
          ayuda="Instituciones, normativa, obras, documentos, datos abiertos y cargos de nómina, por palabra y por tema; Diputados, en vivo. Licitaciones, proveedores y Senado se abren en su vertical."
        />
      </Suspense>

      {q && (
        <>
          {/*
            El índice se carga una vez por instancia (unos dos segundos en
            frío): la cabecera y la caja no lo esperan.
          */}
          <Suspense
            key={`${q}|${tipo ?? ""}|${pagina}`}
            fallback={
              <Card as="section" className="p-5" aria-busy="true">
                <EsqueletoFilas n={6} />
              </Card>
            }
          >
            <Resultados q={q} tipo={tipo} pagina={pagina} />
          </Suspense>

          {/*
            Diputados se lee en vivo y llega aparte. Su vacío se dice en la
            misma línea corta que los demás; su caída, no: «el SIL no
            respondió» es otra pantalla, y se queda en su tarjeta. Solo en
            «Todo»: un tipo elegido es una lista de ese tipo.
          */}
          {!tipo && (
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
          )}

          {/*
            Al final, siempre: Diputados llega aparte y puede traer lo único
            que se encontró; «Sigue buscando» antes lo empujaría por debajo.
          */}
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

function hrefBusqueda(q: string, tipo?: TipoResultado, pagina?: number): string {
  const p = new URLSearchParams({ q });
  if (tipo) p.set("tipo", tipo);
  if (pagina && pagina > 1) p.set("pagina", String(pagina));
  return `/buscar?${p.toString()}`;
}

/** Las plazas se cuentan en la foto de nómina, no en todo el Estado. */
const NOTA_CARGOS =
  "Plazas contadas en la foto de nómina de las instituciones que la publican en formato procesable, no en todo el Estado.";

const PLURAL = Object.fromEntries(TIPOS_RESULTADO.map((t) => [t.clave, t.plural])) as Record<TipoResultado, string>;

async function Resultados({ q, tipo, pagina }: { q: string; tipo?: TipoResultado; pagina: number }) {
  const h = await buscarEnTodo(q, { tipo, pagina });
  if (!h) {
    return (
      <EstadoVacio
        variante="caida"
        titulo="El índice de búsqueda no cargó"
        accion={
          <Link href={`/instituciones?q=${encodeURIComponent(q)}`} className="font-medium text-brand-700 hover:underline">
            Buscar «{q}» en Instituciones
          </Link>
        }
      >
        No es que no haya nada: es que esta vez no pudimos mirar. Cada vertical
        conserva su propio buscador, abajo.
      </EstadoVacio>
    );
  }

  const todos = TIPOS_RESULTADO.reduce((n, t) => n + h.porTipo[t.clave], 0);
  const llenos = TIPOS_RESULTADO.filter((t) => h.porTipo[t.clave] > 0);
  const vacios = TIPOS_RESULTADO.filter((t) => h.porTipo[t.clave] === 0).map((t) => t.plural);
  const fechaIndice = formatFecha(h.generado);

  if (todos === 0) {
    return (
      <EstadoVacio titulo={<>Nada con «{q}» en el índice</>}>
        Ni por palabra ni por tema en instituciones, normativa, obras,
        documentos, datos abiertos o cargos de nómina (índice del {fechaIndice}).
        Prueba con menos palabras, o sigue en una vertical.
      </EstadoVacio>
    );
  }

  return (
    <>
      {/*
        Los filtros dicen cuánto hay detrás antes del toque: un filtro que
        promete y devuelve cero es un control sin efecto. Los tipos vacíos no
        se ofrecen; se nombran juntos abajo.
      */}
      <NavFiltros etiqueta="Qué tipo de resultado">
        <FiltroEnlace href={hrefBusqueda(q)} activo={!tipo}>
          Todo <span className="font-mono tabular-nums">{formatInt(todos)}</span>
        </FiltroEnlace>
        {llenos.map((t) => (
          <FiltroEnlace key={t.clave} href={hrefBusqueda(q, t.clave)} activo={tipo === t.clave}>
            {t.plural} <span className="font-mono tabular-nums">{formatInt(h.porTipo[t.clave])}</span>
          </FiltroEnlace>
        ))}
      </NavFiltros>

      <p aria-live="polite" className="px-1 text-xs leading-relaxed text-ink-soft">
        {h.conErrata && <>No había «{q}» tal cual: estos llevan una palabra a una letra de diferencia. </>}
        Por palabra —sin tildes, con plurales y conjugaciones— y por tema, en el
        índice del {fechaIndice}.
        {h.soloTema > 0 && <> Lo marcado «por tema» no lleva todas tus palabras: trata de algo parecido.</>}
        {h.truncado && <> Hay más coincidencias de las que se ordenan: la lista recorre las mil más pertinentes.</>}
      </p>

      {tipo ? (
        h.resultados.length === 0 ? (
          <EstadoVacio titulo={<>Nada con «{q}» en {PLURAL[tipo]}</>}>
            <Link href={hrefBusqueda(q)} className="font-medium text-brand-700 hover:underline">
              Ver todos los tipos
            </Link>
          </EstadoVacio>
        ) : (
          <Card as="section" className="p-5">
            <CardTitle>{PLURAL[tipo]}</CardTitle>
            {tipo === "cargo" && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{NOTA_CARGOS}</p>}
            <ul className="mt-2 divide-y divide-hairline">
              {h.resultados.map((r) => (
                <li key={`${r.tipo}-${r.href ?? r.titulo}`}>
                  <FilaResultado r={r} q={q} />
                </li>
              ))}
            </ul>
            {h.paginas > 1 && (
              <Paginador
                pagina={h.pagina}
                paginas={h.paginas}
                href={(p) => hrefBusqueda(q, tipo, p)}
                etiqueta={`Páginas de ${PLURAL[tipo].toLowerCase()}`}
                className="mt-3"
              />
            )}
          </Card>
        )
      ) : (
        <>
          {h.grupos.map((g) => (
            <Grupo
              key={g.tipo}
              titulo={PLURAL[g.tipo]}
              nota={g.tipo === "cargo" ? NOTA_CARGOS : undefined}
              mas={
                g.total > g.resultados.length
                  ? { href: hrefBusqueda(q, g.tipo), texto: `Ver los ${formatInt(g.total)}` }
                  : undefined
              }
            >
              <ul className="divide-y divide-hairline">
                {g.resultados.map((r) => (
                  <li key={`${r.tipo}-${r.href ?? r.titulo}`}>
                    <FilaResultado r={r} q={q} />
                  </li>
                ))}
              </ul>
            </Grupo>
          ))}
          {vacios.length > 0 && <SinCoincidencias q={q} donde={vacios} />}
        </>
      )}
    </>
  );
}

/** Lo que cada tipo dice debajo del título, con las primitivas de formato. */
function detalleDe(r: Resultado): React.ReactNode {
  switch (r.tipo) {
    case "norma":
      return [r.detalle, r.fecha && formatFecha(r.fecha)].filter(Boolean).join(" · ");
    case "obra":
      return [r.detalle, r.valor ? formatPesos(r.valor) : null].filter(Boolean).join(" · ");
    case "documento":
      return (
        <>
          {[r.detalle, r.origen].filter(Boolean).join(" · ")}
          {r.fecha && (
            <>
              {" · "}
              <Antiguedad iso={r.fecha} prefijo="subido" />
            </>
          )}
        </>
      );
    case "dato":
      return [r.origen, r.detalle].filter(Boolean).join(" · ");
    case "cargo":
      return r.plazas
        ? `${formatInt(r.plazas)} ${r.plazas === 1 ? "plaza" : "plazas"} en ${r.instituciones ?? 0} ${r.instituciones === 1 ? "institución" : "instituciones"}`
        : null;
    default:
      return r.detalle;
  }
}

function FilaResultado({ r, q }: { r: Resultado; q: string }) {
  // Normas, obras y cargos llegan de su fuente en MAYÚSCULAS.
  const titulo = r.tipo === "norma" || r.tipo === "obra" || r.tipo === "cargo" ? desdeMayusculas(r.titulo) : r.titulo;
  return (
    <Fila
      href={r.href}
      externo={r.externo}
      titulo={<Resaltado texto={titulo} consulta={q} />}
      detalle={detalleDe(r)}
      marca={
        r.via === "tema" ? (
          <Badge variant="contorno" title="No lleva todas tus palabras: trata de algo parecido.">
            Por tema
          </Badge>
        ) : null
      }
    />
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
      mas={pagina.total > lista.length ? { href: `/congreso?q=${encodeURIComponent(q)}`, texto: "Ver todas" } : undefined}
    >
      <ul className="divide-y divide-hairline">
        {lista.map((i) => (
          <li key={i.id}>
            <Fila
              href={`/congreso/${i.id}`}
              titulo={desdeMayusculas(i.titulo)}
              detalle={[i.numero?.completo, marcaDeIniciativa(i).label].filter(Boolean).join(" · ")}
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
  nota?: string;
  mas?: { href: string; texto: string };
  children: React.ReactNode;
}) {
  return (
    <Card as="section" className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle>{titulo}</CardTitle>
        {mas && (
          <Link href={mas.href} className="shrink-0 text-xs font-medium text-brand-700 hover:underline">
            {mas.texto}
          </Link>
        )}
      </div>
      {nota && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{nota}</p>}
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

function Fila({
  href,
  titulo,
  detalle,
  marca,
  externo = false,
}: {
  href: string | null;
  titulo: React.ReactNode;
  detalle?: React.ReactNode;
  /** Una marca al lado del detalle: «Por tema». */
  marca?: React.ReactNode;
  /** Un archivo o una ficha en el sitio de otra institución: pestaña nueva y su icono. */
  externo?: boolean;
}) {
  const Icono = externo ? IconExternal : IconArrowRight;
  const cuerpo = (
    <>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-sm leading-snug text-ink [overflow-wrap:anywhere] group-hover:text-brand-700">
          {titulo}
        </span>
        {(detalle || marca) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
            {detalle && <span className="min-w-0">{detalle}</span>}
            {marca}
          </span>
        )}
      </span>
      {href && <Icono className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />}
    </>
  );
  if (href && externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 items-start gap-3 py-2.5">
        {cuerpo}
      </a>
    );
  }
  return href ? (
    <Link href={href} className="group flex min-h-11 items-start gap-3 py-2.5">
      {cuerpo}
    </Link>
  ) : (
    <div className="flex items-start gap-3 py-2.5">{cuerpo}</div>
  );
}
