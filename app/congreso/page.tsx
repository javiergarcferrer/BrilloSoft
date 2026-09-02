import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import IniciativaCard from "@/components/iniciativa-card";
import BuscadorCongreso from "./buscador-congreso";
import { EsqueletoFilas } from "@/components/esqueleto";
import {
  listIniciativas,
  normalizarIniciativa,
  SIL_PAGE_SIZE,
  legislaturaVigente,
  diffDias,
} from "@/lib/congreso";
import { IconArrowLeft, IconArrowRight, IconClock } from "@/components/icons";

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
          Iniciativas en vivo desde el SIL de la Cámara.{" "}
          <Link
            href="/congreso/senado"
            className="font-medium text-brand-700 hover:underline"
          >
            El Senado tiene su propia vista
          </Link>
          .
        </p>
      </header>

      {legislatura && diasParaCierre !== null && (
        <Link
          href="/congreso/perencion"
          className="mb-5 flex items-center gap-3 rounded-lg border border-hairline bg-surface px-4 py-3  transition-colors hover:bg-canvas/60"
        >
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

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span className="font-mono tabular-nums">
          {`${respuesta.total.toLocaleString("es-DO")} ${
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink ring-1 ring-inset ring-hairline">
            {grupo}
            <Link
              href={`/congreso${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className="text-ink-soft hover:text-ink"
              aria-label="Quitar filtro de tema"
            >
              ×
            </Link>
          </span>
        )}
      </div>

      <section className="mt-3 overflow-hidden rounded-lg border border-hairline bg-surface ">
        {iniciativas.length > 0 ? (
          <ul>
            {iniciativas.map((ini) => (
              <IniciativaCard key={ini.id} iniciativa={ini} />
            ))}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
              {q
                ? "La búsqueda del SIL hace match de subcadena sobre la descripción. Probá con menos palabras."
                : "El SIL no devolvió iniciativas para esta página."}
            </p>
          </div>
        )}
      </section>

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

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink active:scale-95";

  return (
    <nav className="mt-5 flex items-center justify-between gap-4">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={btn}>
          <IconArrowLeft className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="font-mono text-xs tabular-nums text-ink-soft">
        Página {pagina.toLocaleString("es-DO")} de {totalPaginas.toLocaleString("es-DO")}
      </span>

      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} className={btn}>
          Siguiente
          <IconArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
