import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import IniciativaCard from "@/components/iniciativa-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EstadoVacio } from "@/components/estado-vacio";
import { Paginador } from "@/components/paginador";
import { BarraFiltros, type ChipFiltro } from "@/components/barra-filtros";
import { FiltroEnlace, NavFiltros } from "@/components/nav-filtros";
import BuscadorCongreso from "./buscador-congreso";
import SelectorTema from "./selector-tema";
import { hrefCongreso, TIPO_INICIAL, type FiltrosCongreso } from "./filtros";
import { EsqueletoFilas } from "@/components/esqueleto";
import {
  buscarIniciativas,
  getGrupos,
  limpiarTexto,
  listIniciativasFiltradas,
  normalizarIniciativa,
  SIL_PAGE_SIZE,
  legislaturaVigente,
  diffDias,
  type TipoIniciativa,
} from "@/lib/congreso";
import { TONOS } from "@/lib/estados";
import { cn } from "@/lib/cn";
import { IconArrowRight, IconClock } from "@/components/icons";
import { Termino } from "@/components/termino";

export const metadata: Metadata = {
  alternates: { canonical: "/congreso" },
  title: "Cámara de Diputados",
  description:
    "Busca iniciativas legislativas de la Cámara de Diputados dominicana: estado procesal, trámites, proponentes y alertas de perención.",
};

export const revalidate = 300;

/*
  La página se pinta en dos tiempos. La cabecera, la alerta de legislatura, el
  buscador y los filtros no dependen del listado y llegan con la primera
  respuesta; el listado espera al SIL dentro de su propio `Suspense` y cae en
  su hueco al contestar. Quien busca ve al instante que la búsqueda se está
  haciendo, en lugar de una pantalla congelada mientras el SIL tarda.
*/
export default async function CongresoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tema?: string;
    tipo?: string;
    estado?: string;
    /** Enlace viejo: el tema por su nombre, que se filtraba sobre una sola página. */
    grupo?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  // Los 15 temas del SIL, cacheados un día. Si no contestan, el selector no se
  // pinta y el listado sigue siendo el registro entero.
  const temas = (await getGrupos()).map((g) => ({
    id: g.id,
    nombre: limpiarTexto(g.descripcion),
  }));
  const grupoViejo = params.grupo?.trim();
  const tema =
    temas.find((t) => t.id === Number(params.tema)) ??
    (grupoViejo ? temas.find((t) => t.nombre === grupoViejo) : undefined) ??
    null;

  const filtros: FiltrosCongreso = {
    q: params.q?.trim() ?? "",
    tema: tema?.id ?? null,
    tipo: params.tipo === "resolucion" ? "resolucion" : TIPO_INICIAL,
    perimidas: params.estado === "perimidas",
  };

  const legislatura = legislaturaVigente();
  const diasParaCierre = legislatura ? diffDias(new Date(), legislatura.cierre) : null;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Cámara de Diputados
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          <Termino clave="iniciativa">Iniciativas</Termino> en vivo desde el SIL de la Cámara.{" "}
          <Link
            href="/congreso/senado"
            className="font-medium text-brand-700 hover:underline"
          >
            El Senado tiene su propia vista
          </Link>
          .
          {" "}
          <Link href="/congreso/guia" className="font-medium text-brand-700 hover:underline">
            ¿Cómo nace una ley?
          </Link>
        </p>
      </header>

      {legislatura && diasParaCierre !== null && (
        <Card
          asChild
          className="mb-5 transition-colors hover:bg-canvas/60"
        >
          <Link href="/congreso/perencion" className="flex items-center gap-3 px-4 py-3">
          <IconClock className="h-5 w-5 shrink-0 text-alerta-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              {legislatura.nombre} {legislatura.anio}
            </p>
            <p className="text-xs text-ink-soft">
              Quedan{" "}
              <span className="font-mono font-semibold tabular-nums text-ink">
                {diasParaCierre} días
              </span>{" "}
              antes de que las piezas pendientes se perimen.
            </p>
          </div>
          <IconArrowRight className="h-4 w-4 shrink-0 text-ink-soft" />
          </Link>
        </Card>
      )}

      <BuscadorCongreso initial={filtros.q} filtros={filtros} />

      {temas.length > 0 && (
        <FiltrosIniciativas filtros={filtros} temas={temas} nombreTema={tema?.nombre ?? null} />
      )}

      <Suspense key={hrefCongreso(filtros, page)} fallback={<ListaEsqueleto q={filtros.q} />}>
        <ListaIniciativas filtros={filtros} nombreTema={tema?.nombre ?? null} page={page} />
      </Suspense>
    </div>
  );
}

/** Cómo se nombra cada tipo en el chip y en el recuento. */
const NOMBRE_TIPO: Record<TipoIniciativa, string> = {
  ley: "proyectos de ley",
  resolucion: "resoluciones",
};

/*
  Tema, tipo y estado: exactamente lo que el SIL sabe filtrar, y nada más.

  El listado del SIL solo corta por tipo y por perimidas **dentro de un tema**
  (docs/RECON.md §2.2): no existe «los proyectos de ley de todos los temas», y
  fabricarlo filtrando la página de diez del registro entero daría páginas de
  tres filas y un recuento que no corresponde a nada. Así lo hacía antes el
  tema, y por eso se quitó. Sin tema, tipo y estado se ven apagados y dicen por
  qué; con tema, toman los valores con los que abre el propio portal del SIL
  —proyectos de ley, sin las perimidas— y se enseñan como chips de fábrica,
  porque son los que más recortan.
*/
function FiltrosIniciativas({
  filtros,
  temas,
  nombreTema,
}: {
  filtros: FiltrosCongreso;
  temas: { id: number; nombre: string }[];
  nombreTema: string | null;
}) {
  const conTema = filtros.tema !== null;
  const chips: ChipFiltro[] = [];
  if (conTema && nombreTema) {
    chips.push({
      clave: "tema",
      label: nombreTema,
      href: hrefCongreso({ ...filtros, tema: null }),
    });
    chips.push(
      filtros.tipo === TIPO_INICIAL
        ? {
            clave: "tipo",
            label: NOMBRE_TIPO.ley,
            porDefecto: true,
            nota: "Por defecto. Dentro de un tema el SIL exige un tipo: cámbialo en los filtros.",
          }
        : {
            clave: "tipo",
            label: NOMBRE_TIPO[filtros.tipo],
            href: hrefCongreso({ ...filtros, tipo: TIPO_INICIAL }),
          },
    );
    chips.push(
      filtros.perimidas
        ? {
            clave: "estado",
            label: "solo las perimidas",
            href: hrefCongreso({ ...filtros, perimidas: false }),
          }
        : {
            clave: "estado",
            label: "sin las perimidas",
            porDefecto: true,
            nota: "Por defecto. El SIL separa las perimidas del resto: cámbialo en los filtros.",
          },
    );
  }

  return (
    <BarraFiltros chips={chips} className="mt-4">
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr_1fr] lg:items-start">
        <SelectorTema filtros={filtros} temas={temas} />

        <GrupoFiltro etiqueta="Tipo">
          {(["ley", "resolucion"] as const).map((tipo) => {
            const texto = tipo === "ley" ? "Proyectos de ley" : "Resoluciones";
            return conTema ? (
              <FiltroEnlace
                key={tipo}
                href={hrefCongreso({ ...filtros, tipo })}
                activo={filtros.tipo === tipo}
              >
                {texto}
              </FiltroEnlace>
            ) : (
              <FiltroApagado key={tipo}>{texto}</FiltroApagado>
            );
          })}
        </GrupoFiltro>

        <GrupoFiltro etiqueta="Estado">
          {([false, true] as const).map((perimidas) => {
            // El punto de las perimidas es el oficio `anulado` de
            // lib/estados.ts: el mismo que lleva su marca en cada fila.
            const texto = perimidas ? (
              <>
                <span
                  aria-hidden
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONOS.anulado.dot)}
                />
                Solo las perimidas
              </>
            ) : (
              "Sin las perimidas"
            );
            return conTema ? (
              <FiltroEnlace
                key={String(perimidas)}
                href={hrefCongreso({ ...filtros, perimidas })}
                activo={filtros.perimidas === perimidas}
              >
                {texto}
              </FiltroEnlace>
            ) : (
              <FiltroApagado key={String(perimidas)}>{texto}</FiltroApagado>
            );
          })}
        </GrupoFiltro>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        {conTema ? (
          <>
            Una pieza <Termino clave="perime">perime</Termino> cuando se le
            acaba el plazo para completar el trámite y se archiva. Las
            resoluciones incluyen las internas de la Cámara y las bicamerales.
          </>
        ) : (
          "El SIL solo separa por tipo y por estado dentro de un tema: elige uno y se activan. Sin tema, la lista es el registro entero de la Cámara."
        )}
      </p>
    </BarraFiltros>
  );
}

function GrupoFiltro({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-soft">{etiqueta}</p>
      <NavFiltros etiqueta={etiqueta} className="mt-1">
        {children}
      </NavFiltros>
    </div>
  );
}

/** Un filtro que el origen no responde sin tema: se ve, apagado, y la nota dice por qué. */
function FiltroApagado({ children }: { children: ReactNode }) {
  return (
    <Button variant="secondary" size="sm" disabled className="h-10 text-ink-soft sm:h-9">
      {children}
    </Button>
  );
}

async function ListaIniciativas({
  filtros,
  nombreTema,
  page,
}: {
  filtros: FiltrosCongreso;
  nombreTema: string | null;
  page: number;
}) {
  const { q } = filtros;
  /*
    «No hay resultados» y «la fuente no contestó» dicen cosas opuestas sobre el
    Congreso. Las dos lecturas devuelven `null` cuando el SIL no contesta, así
    que cada pantalla sabe cuál le toca sin una petición de más.
  */
  const respuesta =
    filtros.tema !== null
      ? await listIniciativasFiltradas(
          page,
          { grupo: filtros.tema, tipo: filtros.tipo, perimidas: filtros.perimidas },
          q,
        )
      : await buscarIniciativas(q, page, 300);
  const silCaido = respuesta === null;
  const iniciativas = (respuesta?.results ?? []).map(normalizarIniciativa);
  const total = respuesta?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / SIL_PAGE_SIZE));

  // El recuento dice sobre qué cuenta: el registro entero o un corte.
  const alcance =
    filtros.tema !== null && nombreTema
      ? `${NOMBRE_TIPO[filtros.tipo]} de ${nombreTema}, ${
          filtros.perimidas ? "solo las perimidas" : "sin las perimidas"
        }`
      : "todo el registro de la Cámara";

  return (
    <>
      <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
        <span className="font-mono tabular-nums">
          {silCaido
            ? "— iniciativas"
            : `${total.toLocaleString("es-DO")} ${total === 1 ? "iniciativa" : "iniciativas"}`}
        </span>
        {q ? (
          <>
            {" para "}
            <span className="font-medium text-ink">{`“${q}”`}</span>
          </>
        ) : null}
        {!silCaido && ` · ${alcance}`}
      </p>

      {iniciativas.length > 0 ? (
        <Card as="section" className="mt-3">
          <ul>
            {iniciativas.map((ini) => (
              <IniciativaCard key={ini.id} iniciativa={ini} />
            ))}
          </ul>
        </Card>
      ) : silCaido ? (
        <EstadoVacio
          variante="caida"
          titulo="El SIL de la Cámara no respondió"
          className="mt-3"
          accion={
            <Button asChild variant="secondary">
              <Link href="/fuentes">Ver el estado de las fuentes</Link>
            </Button>
          }
        >
          El sistema de información legislativa de la Cámara está caído o
          rechazó la conexión. No es que no haya iniciativas: es que no pudimos
          mirar. Los datos vuelven solos cuando el origen se restablece.
        </EstadoVacio>
      ) : (
        <EstadoVacio titulo="Sin resultados" className="mt-3">
          {q
            ? "La búsqueda del SIL hace match de subcadena sobre la descripción. Prueba con menos palabras."
            : filtros.tema !== null
              ? "El SIL no tiene iniciativas de este tema con ese tipo y ese estado. Prueba con el otro tipo o con las perimidas."
              : "El SIL no devolvió iniciativas para esta página."}
        </EstadoVacio>
      )}

      {total > 0 && (
        <Paginador
          pagina={page}
          paginas={totalPaginas}
          href={(p) => hrefCongreso(filtros, p)}
          etiqueta="Paginación de iniciativas"
          className="mt-5"
        />
      )}
    </>
  );
}

function ListaEsqueleto({ q }: { q: string }) {
  return (
    <div role="status" aria-busy="true">
      <p className="mt-4 text-sm text-ink-soft">
        {q ? `Buscando “${q}” en el SIL…` : "Consultando el SIL de la Cámara…"}
      </p>
      <EsqueletoFilas n={SIL_PAGE_SIZE} className="mt-3" />
    </div>
  );
}
