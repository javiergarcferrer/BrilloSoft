import Link from "next/link";
import { Suspense } from "react";
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
import { IconSearch } from "@/components/icons";
import { EsqueletoFilas } from "@/components/esqueleto";
import { cn } from "@/lib/cn";
import Antiguedad from "@/components/antiguedad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EstadoVacio } from "@/components/estado-vacio";

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

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
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
          {/*
            Esta búsqueda es un formulario GET de servidor —no hay estado de
            cliente que compartir—, así que usa el campo directamente y no
            `CampoBusqueda`, que vive del estado. Mismo vestido, otra mecánica.
          */}
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar en las descripciones — p. ej. “código penal”"
            aria-label="Buscar expedientes del Senado"
            className="pl-9"
          />
        </div>
        {cuatrienio.etiqueta !== CUATRIENIO_VIGENTE.etiqueta && (
          <input type="hidden" name="c" value={cuatrienio.etiqueta} />
        )}
        <Button type="submit" className="shrink-0">
          Buscar
        </Button>
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
            <Button
              key={c.etiqueta}
              asChild
              variant={activa ? "default" : "secondary"}
              size="sm"
              className={cn(
                "font-mono tabular-nums",
                activa ? "bg-brand-600 hover:bg-brand-700" : "text-ink-soft hover:text-ink",
              )}
            >
              <Link
                href={`/congreso/senado${qs ? `?${qs}` : ""}`}
                aria-current={activa ? "page" : undefined}
              >
                {c.etiqueta}
              </Link>
            </Button>
          );
        })}
      </nav>

      {/*
        El consultante del Senado es la fuente más lenta de la plataforma
        (sesión por colección, dos peticiones por lectura fría). El listado
        espera dentro de su propio Suspense: cabecera, buscador y cuatrienios
        llegan al instante y las filas caen cuando el origen contesta.
      */}
      <Suspense fallback={<ListadoEsqueleto q={q} etiqueta={cuatrienio.etiqueta} />}>
        <ListadoSenado q={q} etiqueta={cuatrienio.etiqueta} />
      </Suspense>
    </div>
  );
}

async function ListadoSenado({ q, etiqueta }: { q: string; etiqueta: string }) {
  const cuatrienio = cuatrienioPorEtiqueta(etiqueta) ?? CUATRIENIO_VIGENTE;
  const listado = q
    ? await buscarExpedientesSenado(cuatrienio.etiqueta, q)
    : await listarRecientesSenado(cuatrienio.etiqueta);

  return (
    <>
      {listado ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="font-mono tabular-nums">
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

          {listado.expedientes.length > 0 ? (
            <Card as="section" className="mt-3">
              <ul>
                {listado.expedientes.map((exp) => (
                  <ExpedienteRow key={exp.id} exp={exp} />
                ))}
              </ul>
            </Card>
          ) : (
            <EstadoVacio titulo="Sin resultados" className="mt-3">
              {q
                ? "El consultante busca la subcadena exacta, con tildes. Prueba con menos palabras o revisa los acentos."
                : "El Senado no devolvió expedientes para esta colección."}
            </EstadoVacio>
          )}

          {listado.total > listado.expedientes.length && (
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              {q
                ? `El origen muestra hasta ${SENADO_PAGE_SIZE} resultados por consulta; hay ${listado.total.toLocaleString("es-DO")} en total. Afiná la búsqueda para acotar.`
                : `Se muestran los ${listado.expedientes.length} expedientes más recientes de ${listado.total.toLocaleString("es-DO")}; el consultante del Senado no pagina hacia atrás. Para llegar al resto, buscá por texto.`}
            </p>
          )}
        </>
      ) : (
        <EstadoVacio
          variante="caida"
          titulo="El Senado no respondió"
          className="mt-4"
        >
          El sistema de consulta del Senado está caído o rechazó la conexión. Los
          datos vuelven solos cuando el origen se restablece.
        </EstadoVacio>
      )}
    </>
  );
}

function ListadoEsqueleto({ q, etiqueta }: { q: string; etiqueta: string }) {
  return (
    <div role="status" aria-busy="true">
      <p className="mt-4 text-sm text-ink-soft">
        {q
          ? `Buscando “${q}” en la colección ${etiqueta}…`
          : `Consultando la colección ${etiqueta} del Senado…`}
      </p>
      <EsqueletoFilas n={10} className="mt-3" />
    </div>
  );
}

/** Fila densa, hermana visual de la de Diputados. */
function ExpedienteRow({ exp }: { exp: ExpedienteSenado }) {
  return (
    <li className="cv-auto group border-b border-hairline last:border-0">
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
              <Antiguedad iso={exp.fechaCreacion} prefijo="Creada" />
            </>
          )}
        </div>
      </Link>
    </li>
  );
}
