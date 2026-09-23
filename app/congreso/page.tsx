import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import IniciativaCard from "@/components/iniciativa-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EstadoVacio } from "@/components/estado-vacio";
import { Paginador } from "@/components/paginador";
import BuscadorCongreso from "./buscador-congreso";
import { EsqueletoFilas } from "@/components/esqueleto";
import {
  getCountIniciativas,
  listIniciativas,
  normalizarIniciativa,
  SIL_PAGE_SIZE,
  legislaturaVigente,
  diffDias,
} from "@/lib/congreso";
import { IconArrowRight, IconClock } from "@/components/icons";
import { Termino } from "@/components/termino";

export const metadata: Metadata = {
  title: "Cámara de Diputados",
  description:
    "Busca iniciativas legislativas de la Cámara de Diputados dominicana: estado procesal, trámites, proponentes y alertas de perención.",
};

export const revalidate = 300;

/*
  La página se pinta en dos tiempos. La cabecera, la alerta de legislatura y
  el buscador no dependen de nadie y llegan con la primera respuesta; el
  listado espera al SIL dentro de su propio `Suspense` y cae en su hueco al
  contestar. Quien busca ve al instante que la búsqueda se está haciendo, en
  lugar de una pantalla congelada mientras el SIL tarda.
*/
export default async function CongresoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; grupo?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const grupo = params.grupo?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

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

      <BuscadorCongreso initial={q} />

      <Suspense fallback={<ListaEsqueleto q={q} />}>
        <ListaIniciativas q={q} grupo={grupo} page={page} />
      </Suspense>
    </div>
  );
}

async function ListaIniciativas({
  q,
  grupo,
  page,
}: {
  q: string;
  grupo: string;
  page: number;
}) {
  const respuesta = await listIniciativas(page, q);
  let iniciativas = respuesta.results.map(normalizarIniciativa);

  // El endpoint filtrado del SIL devuelve 400 en todas las combinaciones
  // probadas, así que el corte por tema se hace aquí.
  if (grupo) iniciativas = iniciativas.filter((i) => i.grupo === grupo);

  const totalPaginas = Math.max(1, Math.ceil(respuesta.total / SIL_PAGE_SIZE));

  /*
    «No hay resultados» y «la fuente no contestó» dicen cosas opuestas sobre el
    Congreso, y `listIniciativas` degrada el fallo a una página vacía: las dos
    llegan aquí idénticas. El censo (`CountIniciativas`) sí devuelve `null`
    cuando el SIL no responde, así que en el único caso ambiguo —cero filas— se
    pregunta por él y se sabe cuál de las dos pantallas toca. Es una petición
    más, solo cuando no hay nada que pintar, y cacheada una hora.
  */
  const censo = iniciativas.length === 0 ? await getCountIniciativas() : 0;
  const silCaido = censo === null;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span className="font-mono tabular-nums">
          {silCaido
            ? "— iniciativas"
            : `${respuesta.total.toLocaleString("es-DO")} ${
                respuesta.total === 1 ? "iniciativa" : "iniciativas"
              }`}
          {q ? (
            <>
              {" para "}
              <span className="font-medium text-ink">{`“${q}”`}</span>
            </>
          ) : null}
        </span>
        {grupo && (
          <Badge forma="etiqueta" variant="contorno" className="bg-surface text-ink">
            {grupo}
            <Link
              href={`/congreso${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className="text-ink-soft hover:text-ink"
              aria-label="Quitar filtro de tema"
            >
              ×
            </Link>
          </Badge>
        )}
      </div>

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
            : "El SIL no devolvió iniciativas para esta página."}
        </EstadoVacio>
      )}

      {respuesta.total > 0 && (
        <Paginacion pagina={page} totalPaginas={totalPaginas} q={q} grupo={grupo} />
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

function Paginacion({
  pagina,
  totalPaginas,
  q,
  grupo,
}: {
  pagina: number;
  totalPaginas: number;
  q: string;
  grupo: string;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (grupo) sp.set("grupo", grupo);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/congreso${qs ? `?${qs}` : ""}`;
  };

  return (
    <Paginador
      pagina={pagina}
      paginas={totalPaginas}
      href={href}
      etiqueta="Paginación de iniciativas"
      className="mt-5"
    />
  );
}
