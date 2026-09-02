import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  RUTA_POR_TIPO,
  TIPOS_NORMATIVA,
  buscarNormativa,
  type Documento,
  type TipoNormativa,
} from "@/lib/normativa";
import { formatFecha } from "@/lib/format";
import { IconExternal, IconDoc } from "@/components/icons";
import { desdeMayusculas } from "@/lib/congreso";
import { cn } from "@/lib/cn";
import { EsqueletoFilas } from "@/components/esqueleto";

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
          Decretos, leyes, reglamentos, resoluciones y Gaceta Oficial, en vivo
          desde la Consultoría Jurídica del Poder Ejecutivo. Es la tercera pata
          del triángulo legislativo, junto a{" "}
          <Link href="/congreso" className="font-medium text-brand-700 hover:underline">
            Diputados y Senado
          </Link>
          .
        </p>
      </header>

      {/* filtros de tipo */}
      <nav aria-label="Tipo de documento" className="flex flex-wrap gap-1.5">
        {(Object.entries(TIPOS_NORMATIVA) as [TipoNormativa, string][]).map(([code, label]) => (
          <Link
            key={code}
            href={`/normativa?tipo=${code}${anio !== ANIO_ACTUAL ? `&anio=${anio}` : ""}`}
            aria-current={tipo === code ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors",
              tipo === code
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-surface text-ink-soft ring-hairline hover:text-ink",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* filtros de año */}
      <nav aria-label="Año" className="mt-2.5 flex flex-wrap gap-1.5">
        {ANIOS.map((a) => (
          <Link
            key={a}
            href={`/normativa?tipo=${tipo}${a !== ANIO_ACTUAL ? `&anio=${a}` : ""}`}
            aria-current={anio === a ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 font-mono text-xs tabular-nums ring-1 ring-inset transition-colors",
              anio === a
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-surface text-ink-soft ring-hairline hover:text-ink",
            )}
          >
            {a}
          </Link>
        ))}
      </nav>

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
  const docs = await buscarNormativa(tipo, anio);

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <span className="font-mono tabular-nums">
          {docs.length > 0
            ? `${docs.length.toLocaleString("es-DO")} ${TIPOS_NORMATIVA[tipo].toLowerCase()} en ${anio}`
            : ""}
        </span>
      </div>

      <section className="mt-3 overflow-hidden rounded-lg border border-hairline bg-surface ">
        {docs.length > 0 ? (
          <ul className="divide-y divide-hairline">
            {docs.slice(0, 200).map((d, i) => (
              <FilaDoc key={`${d.documentId}-${i}`} doc={d} />
            ))}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
              La Consultoría no devolvió {TIPOS_NORMATIVA[tipo].toLowerCase()} para{" "}
              {anio}, o el servicio no respondió. Prueba otro año o tipo.
            </p>
          </div>
        )}
      </section>

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

function FilaDoc({ doc }: { doc: Documento }) {
  // El número normalizado es la identidad de la ficha propia; si el origen lo
  // escribe de otra forma, la fila se queda con el enlace al documento.
  const ruta =
    RUTA_POR_TIPO[doc.tipo] && /^\d{1,4}-\d{2,4}$/.test(doc.numero.trim())
      ? `/normativa/${RUTA_POR_TIPO[doc.tipo]}/${doc.numero.trim()}`
      : null;

  return (
    <li className="cv-auto flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <IconDoc className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <span className="font-mono font-semibold tabular-nums text-brand-700">
            {doc.tipo} {doc.numero}
          </span>
          {doc.fecha && <span className="font-mono tabular-nums text-ink-soft">{formatFecha(doc.fechaIso ?? undefined)}</span>}
          {doc.gaceta && <span className="text-ink-soft">Gaceta {doc.gaceta}</span>}
        </div>
        <p className="mt-1 text-sm leading-snug text-ink">
          {desdeMayusculas(doc.titulo)}
        </p>
      </div>
      {ruta ? (
        <Link
          href={ruta}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
        >
          Leer
        </Link>
      ) : (
        doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Abrir
            <IconExternal className="h-3.5 w-3.5" />
          </a>
        )
      )}
    </li>
  );
}
