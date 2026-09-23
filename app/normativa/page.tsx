import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  RUTA_POR_TIPO,
  TIPOS_NORMATIVA,
  consultarNormativa,
  type Documento,
  type TipoNormativa,
} from "@/lib/normativa";
import { IconExternal, IconDoc } from "@/components/icons";
import { desdeMayusculas } from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import { EsqueletoFilas } from "@/components/esqueleto";
import Antiguedad from "@/components/antiguedad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EstadoVacio } from "@/components/estado-vacio";
import { FiltroEnlace, NavFiltros } from "@/components/nav-filtros";
import { Termino } from "@/components/termino";

export const metadata: Metadata = {
  title: "Normativa del Ejecutivo",
  description:
    "Decretos, leyes, reglamentos, resoluciones y Gaceta Oficial de República Dominicana, en vivo desde la Consultoría Jurídica del Poder Ejecutivo.",
};

export const revalidate = 3600;

const ANIO_ACTUAL = 2026;
const ANIOS = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2, ANIO_ACTUAL - 3];

export default async function NormativaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; anio?: string }>;
}) {
  const params = await searchParams;
  const tipo = (params.tipo && params.tipo in TIPOS_NORMATIVA ? params.tipo : "3") as TipoNormativa;
  const anio = ANIOS.includes(Number(params.anio)) ? Number(params.anio) : ANIO_ACTUAL;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Normativa del Poder Ejecutivo
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          <Termino clave="decreto">Decretos</Termino>, leyes,{" "}
          <Termino clave="reglamento">reglamentos</Termino>,{" "}
          <Termino clave="resolucion">resoluciones</Termino> y{" "}
          <Termino clave="gacetaOficial">Gaceta Oficial</Termino>, en vivo
          desde la Consultoría Jurídica del Poder Ejecutivo. Es la tercera pata
          del triángulo legislativo, junto a{" "}
          <Link href="/congreso" className="font-medium text-brand-700 hover:underline">
            Diputados y Senado
          </Link>
          .
        </p>
      </header>

      {/*
        Filtros de tipo y de año. A 390 px las dos barras envuelven en líneas
        limpias —cinco tipos en dos líneas, cuatro años en una— sin cortar el
        último filtro; la altura táctil la pone `FiltroEnlace`, que es donde
        vive esa decisión.
      */}
      <NavFiltros etiqueta="Tipo de documento">
        {(Object.entries(TIPOS_NORMATIVA) as [TipoNormativa, string][]).map(([code, label]) => (
          <FiltroEnlace
            key={code}
            href={`/normativa?tipo=${code}${anio !== ANIO_ACTUAL ? `&anio=${anio}` : ""}`}
            activo={tipo === code}
          >
            {label}
          </FiltroEnlace>
        ))}
      </NavFiltros>

      <NavFiltros etiqueta="Año" className="mt-2.5">
        {ANIOS.map((a) => (
          <FiltroEnlace
            key={a}
            href={`/normativa?tipo=${tipo}${a !== ANIO_ACTUAL ? `&anio=${a}` : ""}`}
            activo={anio === a}
            mono
          >
            {a}
          </FiltroEnlace>
        ))}
      </NavFiltros>

      {/*
        La Consultoría responde por año y tipo, y no siempre rápido. Los
        filtros llegan al instante; el listado cae en su hueco al contestar.
      */}
      <Suspense fallback={<ListaEsqueleto tipo={tipo} anio={anio} />}>
        <ListaNormativa tipo={tipo} anio={anio} />
      </Suspense>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Fuente: Consultoría Jurídica del Poder Ejecutivo. La consulta se acota por
        año porque el origen no pagina. «Leer» abre el texto íntegro dentro de la
        plataforma, servido desde el sitio oficial.{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          Estado de las fuentes
        </Link>
        .
      </p>
    </div>
  );
}

async function ListaNormativa({ tipo, anio }: { tipo: TipoNormativa; anio: number }) {
  const { docs, origen } = await consultarNormativa(tipo, anio);

  /*
    «No hay» y «no contestó» dicen cosas opuestas sobre el Ejecutivo. La capa
    ya las separa: una lista con origen es una respuesta, aunque venga vacía;
    sin origen no contestó nadie. Cloudflare desafía hoy a los servidores de
    la plataforma, así que el origen suele ser la instantánea, y se dice.
  */
  const consultoriaCaida = origen === null;
  const instantanea = origen !== null && origen !== "vivo" ? origen : null;

  return (
    <>
      {docs.length > 0 && (
        <p className="mt-4 font-mono text-sm tabular-nums text-ink-soft">
          {`${docs.length.toLocaleString("es-DO")} ${TIPOS_NORMATIVA[tipo].toLowerCase()} en ${anio}`}
        </p>
      )}

      {instantanea && (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          Instantánea del {formatFecha(instantanea)}: la Consultoría rechaza hoy
          las consultas desde los servidores de la plataforma, así que lo más
          reciente puede faltar. Lo publicado después está en{" "}
          <a
            href="https://www.consultoria.gov.do/consultas?tab=legislacion"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 hover:underline"
          >
            el buscador oficial
          </a>
          .
        </p>
      )}

      {docs.length > 0 ? (
        <Card as="section" className="mt-3">
          <ul className="divide-y divide-hairline">
            {docs.slice(0, 200).map((d, i) => (
              <FilaDoc key={`${d.documentId}-${i}`} doc={d} />
            ))}
          </ul>
        </Card>
      ) : consultoriaCaida ? (
        <EstadoVacio
          variante="caida"
          titulo="La Consultoría Jurídica no respondió"
          className="mt-4"
          accion={
            <Button asChild variant="secondary">
              <Link href="/fuentes">Ver el estado de las fuentes</Link>
            </Button>
          }
        >
          El buscador de la Consultoría Jurídica del Poder Ejecutivo está caído
          o rechazó la conexión. No es que no haya normativa: es que no pudimos
          mirar. Los datos vuelven solos cuando el origen se restablece.
        </EstadoVacio>
      ) : (
        <EstadoVacio titulo="Sin resultados" className="mt-4">
          {instantanea ? "La instantánea de la Consultoría" : "La Consultoría respondió, pero"}{" "}
          no tiene {TIPOS_NORMATIVA[tipo].toLowerCase()} de {anio}.
          Prueba otro año o cambia el tipo de documento.
        </EstadoVacio>
      )}

      {docs.length > 200 && (
        <p className="mt-4 text-xs text-ink-soft">
          Se muestran los 200 más recientes de {docs.length.toLocaleString("es-DO")}.
        </p>
      )}
    </>
  );
}

function ListaEsqueleto({ tipo, anio }: { tipo: TipoNormativa; anio: number }) {
  return (
    <div role="status" aria-busy="true">
      <p className="mt-4 text-sm text-ink-soft">
        Consultando {TIPOS_NORMATIVA[tipo].toLowerCase()} de {anio} en la Consultoría…
      </p>
      <EsqueletoFilas n={10} className="mt-3" />
    </div>
  );
}

/**
 * Fila de una norma.
 *
 * El objetivo táctil era «Leer»: un renglón de 46 × 16 px pegado al borde
 * derecho, el más difícil de acertar con el pulgar de toda la vertical, con
 * una fila de 70 px de alto muerta a su lado. Cuando la norma tiene ficha
 * propia, la fila **entera** es el enlace —como en las dos cámaras—; el
 * rótulo se queda como afordancia visual y el resto del papel ya responde.
 * Cuando el origen escribe el número de otra forma y no hay ficha, queda el
 * enlace al archivo del Estado, que sí sale de la plataforma y por eso sigue
 * siendo un enlace aparte, ahora con altura de mando.
 */
function FilaDoc({ doc }: { doc: Documento }) {
  // El número normalizado es la identidad de la ficha propia; si el origen lo
  // escribe de otra forma, la fila se queda con el enlace al documento.
  const ruta =
    RUTA_POR_TIPO[doc.tipo] && /^\d{1,4}-\d{2,4}$/.test(doc.numero.trim())
      ? `/normativa/${RUTA_POR_TIPO[doc.tipo]}/${doc.numero.trim()}`
      : null;

  const cuerpo = (
    <>
      {/*
        El icono es el mismo en las doscientas filas de una lista de
        documentos: no distingue una de otra, así que en el teléfono —donde se
        lleva 28 px de la columna más estrecha que hay— se retira y el título
        gana una palabra por línea. Desde `sm` sobra el ancho y vuelve.
      */}
      <IconDoc className="mt-0.5 hidden h-4 w-4 shrink-0 text-ink-soft sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <span className="font-mono font-semibold tabular-nums text-brand-700">
            {doc.tipo} {doc.numero}
          </span>
          {doc.fechaIso && (
            <Antiguedad iso={doc.fechaIso} className="text-ink-soft" />
          )}
          {doc.gaceta && <span className="text-ink-soft">Gaceta {doc.gaceta}</span>}
        </div>
        <p className="mt-1 text-[15px] leading-snug text-ink group-hover:text-brand-700">
          {desdeMayusculas(doc.titulo)}
        </p>
      </div>
    </>
  );

  if (ruta) {
    return (
      <li className="cv-auto group">
        <Link
          href={ruta}
          className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-canvas/60 sm:px-5"
        >
          {cuerpo}
          <span className="shrink-0 self-center text-xs font-medium text-brand-700">
            Leer
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="cv-auto flex items-start gap-3 px-4 py-3.5 sm:px-5">
      {cuerpo}
      {doc.url && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="-my-1 -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 px-2 text-xs font-medium text-brand-700 hover:underline sm:my-0 sm:mr-0 sm:min-h-0 sm:px-0"
        >
          Abrir
          <IconExternal className="h-3.5 w-3.5" />
        </a>
      )}
    </li>
  );
}
