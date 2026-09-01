import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queEsNorma, resolverNorma, tipoDeRuta } from "@/lib/normativa";
import { pesoDocumento, urlDeLectura } from "@/lib/documentos";
import { desdeMayusculas } from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import VisorDocumento from "@/components/visor-documento";
import { IconArrowLeft } from "@/components/icons";

export const revalidate = 86400;

interface Props {
  params: Promise<{ tipo: string; numero: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo: slug, numero } = await params;
  const tipo = tipoDeRuta(slug);
  if (!tipo) return { title: "Norma no encontrada" };
  const norma = await resolverNorma(tipo, numero);
  return {
    title: `${tipo} ${numero}`,
    description: norma?.titulo
      ? `${tipo} ${numero}: ${desdeMayusculas(norma.titulo).slice(0, 150)}`
      : `Texto oficial de la ${tipo} ${numero}.`,
  };
}

/**
 * Ficha de una norma del Ejecutivo.
 *
 * La Consultoría publica el texto íntegro en PDF con capa de texto y lo sirve
 * `inline` y sin `frame-ancestors`, así que se lee incrustado directamente
 * desde el origen: no hay copia intermedia y el buscador del propio visor del
 * navegador funciona sobre el articulado.
 */
export default async function NormaPage({ params }: Props) {
  const { tipo: slug, numero } = await params;
  const tipo = tipoDeRuta(slug);
  if (!tipo || !/^\d{1,4}-\d{2,4}$/.test(numero)) notFound();

  const norma = await resolverNorma(tipo, numero);
  if (!norma) notFound();

  const peso = norma.url ? await pesoDocumento(norma.url) : null;
  const explicacion = queEsNorma(tipo);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/normativa"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Normativa
      </Link>

      <header className="mt-3">
        <p className="font-mono text-sm font-semibold tabular-nums text-ink">
          {tipo} {norma.numero}
        </p>
        <h1 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
          {desdeMayusculas(norma.titulo)}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {[
            norma.fecha && formatFecha(norma.fechaIso ?? undefined),
            norma.gaceta && `Gaceta Oficial ${norma.gaceta}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {explicacion && (
        <section className="mt-5 rounded-lg border border-hairline bg-surface p-5 ">
          <p className="rotulo text-ink-soft">
            Qué es
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{explicacion}</p>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface ">
        <div className="border-b border-hairline px-5 py-3.5">
          <h2 className="font-sans text-sm font-semibold text-ink">El texto</h2>
        </div>
        {norma.url ? (
          <VisorDocumento
            url={norma.url}
            urlVisor={urlDeLectura(norma.url)}
            nombre={`${tipo} ${norma.numero} — texto oficial`}
            tipo={peso?.tipo ?? "application/pdf"}
            bytes={peso?.bytes ?? null}
            origen="la Consultoría Jurídica"
          />
        ) : (
          <p className="px-5 py-6 text-sm text-ink-soft">
            La Consultoría lista esta norma pero no expone su archivo.
          </p>
        )}
      </section>

      <p className="mt-5 text-xs leading-relaxed text-ink-soft">
        Fuente: Consultoría Jurídica del Poder Ejecutivo. Esta plataforma no
        edita ni interpreta el texto: lo enlaza tal como el Estado lo publica.
        Para el trámite congresual de una pieza, ve a{" "}
        <Link href="/congreso" className="text-brand-700 underline">
          Congreso
        </Link>
        .
      </p>
    </div>
  );
}
