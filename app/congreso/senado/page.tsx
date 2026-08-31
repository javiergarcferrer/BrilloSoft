import Link from "next/link";
import type { Metadata } from "next";
import { CondicionBadge } from "@/components/iniciativa-card";
import {
  CUATRIENIOS,
  CUATRIENIO_VIGENTE,
  SENADO_PAGE_SIZE,
  buscarExpedientesSenado,
  cuatrienioPorEtiqueta,
  listarRecientesSenado,
  type ExpedienteSenado,
} from "@/lib/senado";
import { formatFecha } from "@/lib/format";
import { IconSearch } from "@/components/icons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Senado",
  description:
    "Expedientes legislativos del Senado dominicano: estado procesal, historial de trámites y promulgación, desde 2002 hasta hoy.",
};

export const revalidate = 300;

export default async function SenadoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; c?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const cuatrienio = cuatrienioPorEtiqueta(params.c) ?? CUATRIENIO_VIGENTE;

  const listado = q
    ? await buscarExpedientesSenado(cuatrienio.etiqueta, q)
    : await listarRecientesSenado(cuatrienio.etiqueta);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Senado de la República
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Expedientes en vivo desde el sistema de consulta pública del Senado,
          con colecciones desde 2002.{" "}
          <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
            Cómo se lee esta fuente
          </Link>
          .
        </p>
      </header>

      {/*
        Formulario GET puro: la consulta y la colección viven en la URL, así
        cualquier búsqueda es compartible — misma regla que en licitaciones.
      */}
      <form action="/congreso/senado" method="get" className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar en las descripciones — p. ej. “código penal”"
            aria-label="Buscar expedientes del Senado"
            className="h-11 w-full rounded-xl border border-hairline bg-surface pl-9 pr-3 text-sm text-ink shadow-soft placeholder:text-ink-soft/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {cuatrienio.etiqueta !== CUATRIENIO_VIGENTE.etiqueta && (
          <input type="hidden" name="c" value={cuatrienio.etiqueta} />
        )}
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95"
        >
          Buscar
        </button>
      </form>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        La búsqueda del Senado es literal y distingue tildes: «educación» no
        encuentra «educacion».
      </p>

      {/* Colecciones por cuatrienio: cada una es una base distinta en el origen. */}
      <nav aria-label="Cuatrienios" className="mt-4 flex flex-wrap gap-1.5">
        {CUATRIENIOS.map((c) => {
          const activa = c.etiqueta === cuatrienio.etiqueta;
          const sp = new URLSearchParams();
          if (q) sp.set("q", q);
          if (c.etiqueta !== CUATRIENIO_VIGENTE.etiqueta) sp.set("c", c.etiqueta);
          const qs = sp.toString();
          return (
            <Link
              key={c.etiqueta}
              href={`/congreso/senado${qs ? `?${qs}` : ""}`}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs tabular-nums ring-1 ring-inset transition-colors",
                activa
                  ? "bg-brand-600 font-semibold text-white ring-brand-600"
                  : "bg-surface text-ink-soft ring-hairline hover:text-ink",
              )}
            >
              {c.etiqueta}
            </Link>
          );
        })}
      </nav>

      {listado ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="tabular-nums">
              {`${listado.total.toLocaleString("es-DO")} ${
                listado.total === 1 ? "expediente" : "expedientes"
              }`}
              {q ? (
                <>
                  {" para "}
                  <span className="font-medium text-ink">{`“${q}”`}</span>
                </>
              ) : (
                <> en la colección {cuatrienio.etiqueta}</>
              )}
            </span>
          </div>

          <section className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
            {listado.expedientes.length > 0 ? (
              <ul>
                {listado.expedientes.map((exp) => (
                  <ExpedienteRow key={exp.id} exp={exp} />
                ))}
              </ul>
            ) : (
              <div className="px-5 py-14 text-center">
                <p className="text-sm font-medium text-ink">Sin resultados</p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
                  {q
                    ? "El consultante busca la subcadena exacta, con tildes. Probá con menos palabras o revisá los acentos."
                    : "El Senado no devolvió expedientes para esta colección."}
                </p>
              </div>
            )}
          </section>

          {listado.total > listado.expedientes.length && (
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              {q
                ? `El origen muestra hasta ${SENADO_PAGE_SIZE} resultados por consulta; hay ${listado.total.toLocaleString("es-DO")} en total. Afiná la búsqueda para acotar.`
                : `Se muestran los ${listado.expedientes.length} expedientes más recientes de ${listado.total.toLocaleString("es-DO")}; el consultante del Senado no pagina hacia atrás. Para llegar al resto, buscá por texto.`}
            </p>
          )}
        </>
      ) : (
        <section className="mt-4 rounded-2xl border border-hairline bg-surface px-5 py-12 text-center shadow-card">
          <p className="text-sm font-medium text-ink">El Senado no respondió</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
            El sistema de consulta del Senado está caído o rechazó la conexión.
            Los datos vuelven solos cuando el origen se restablece.
          </p>
        </section>
      )}
    </div>
  );
}

/** Fila densa, hermana visual de la de Diputados. */
function ExpedienteRow({ exp }: { exp: ExpedienteSenado }) {
  return (
    <li className="group border-b border-hairline last:border-0">
      <Link
        href={`/congreso/senado/${exp.cuatrienio}/${exp.id}`}
        className="block px-4 py-3.5 transition-colors hover:bg-canvas/60 sm:px-5"
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="font-mono text-xs font-semibold tabular-nums text-brand-700">
            {exp.numero?.completo ?? `#${exp.id}`}
          </span>
          <CondicionBadge tono={exp.tono}>{exp.estado ?? "—"}</CondicionBadge>
        </div>

        <p className="mt-1.5 text-[15px] leading-snug text-ink group-hover:text-brand-700">
          {exp.titulo}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-soft">
          {exp.tipo && <span>{exp.tipo}</span>}
          {exp.fechaCreacion && (
            <>
              <span aria-hidden className="text-hairline">
                ·
              </span>
              <span className="tabular-nums">Creada {formatFecha(exp.fechaCreacion)}</span>
            </>
          )}
        </div>
      </Link>
    </li>
  );
}
