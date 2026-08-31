import Link from "next/link";
import type { Metadata } from "next";
import IniciativaCard from "@/components/iniciativa-card";
import BuscadorCongreso from "./buscador-congreso";
import {
  listIniciativas,
  normalizarIniciativa,
  SIL_PAGE_SIZE,
  legislaturaVigente,
  diffDias,
} from "@/lib/congreso";
import { IconArrowLeft, IconArrowRight, IconClock } from "@/components/icons";

export const metadata: Metadata = {
  title: "Congreso",
  description:
    "Busca iniciativas legislativas del Congreso Nacional dominicano: estado procesal, trámites, proponentes y alertas de perención.",
};

export const revalidate = 300;

export default async function CongresoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; grupo?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const grupo = params.grupo?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const respuesta = await listIniciativas(page, q);
  let iniciativas = respuesta.results.map(normalizarIniciativa);

  // El endpoint filtrado del SIL devuelve 400 en todas las combinaciones
  // probadas, así que el corte por tema se hace aquí.
  if (grupo) iniciativas = iniciativas.filter((i) => i.grupo === grupo);

  const totalPaginas = Math.max(1, Math.ceil(respuesta.total / SIL_PAGE_SIZE));
  const legislatura = legislaturaVigente();
  const diasParaCierre = legislatura ? diffDias(new Date(), legislatura.cierre) : null;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Congreso Nacional
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Iniciativas de la Cámara de Diputados, en vivo desde el SIL.{" "}
          <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
            El Senado aún no está integrado
          </Link>
          .
        </p>
      </header>

      {legislatura && diasParaCierre !== null && (
        <Link
          href="/congreso/perencion"
          className="mb-5 flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 shadow-soft transition-shadow hover:shadow-card"
        >
          <IconClock className="h-5 w-5 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              {legislatura.nombre} {legislatura.anio}
            </p>
            <p className="text-xs text-ink-soft">
              Quedan{" "}
              <span className="font-semibold tabular-nums text-ink">
                {diasParaCierre} días
              </span>{" "}
              antes de que las piezas pendientes se perimen.
            </p>
          </div>
          <IconArrowRight className="h-4 w-4 shrink-0 text-ink-soft" />
        </Link>
      )}

      <BuscadorCongreso initial={q} />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span className="tabular-nums">
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

      <section className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
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

      <span className="text-xs tabular-nums text-ink-soft">
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
