import Link from "next/link";
import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queEsNorma, resolverNorma, tipoDeRuta } from "@/lib/normativa";
import { pesoDocumento, urlDeLectura } from "@/lib/documentos";
import { desdeMayusculas } from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import VisorDocumento from "@/components/visor-documento";
import { Esqueleto } from "@/components/esqueleto";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruta } from "@/components/ruta";

export const revalidate = 86400;

interface Props {
  params: Promise<{ tipo: string; numero: string }>;
}

/** Una consulta a la Consultoría por render, compartida con `generateMetadata`. */
const cargarNorma = cache((tipo: Parameters<typeof resolverNorma>[0], numero: string) =>
  resolverNorma(tipo, numero),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo: slug, numero } = await params;
  const tipo = tipoDeRuta(slug);
  if (!tipo) return { title: "Norma no encontrada" };
  const norma = await cargarNorma(tipo, numero);
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

  const norma = await cargarNorma(tipo, numero);
  if (!norma) notFound();

  const explicacion = queEsNorma(tipo);

  return (
    <div className="mx-auto max-w-4xl">
      <Ruta seccion="normativa" actual={`${tipo} ${norma.numero}`} />

      <header className="mt-1 sm:mt-3">
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
        <Card as="section" className="mt-5 p-5">
          <p className="rotulo text-ink-soft">
            Qué es
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{explicacion}</p>
        </Card>
      )}

      <Card as="section" className="mt-5">
        <CardHeader>
          <CardTitle>El texto</CardTitle>
        </CardHeader>
        {norma.url ? (
          <Suspense fallback={<Esqueleto className="m-5 h-24" />}>
            <TextoNorma url={norma.url} nombre={`${tipo} ${norma.numero} — texto oficial`} />
          </Suspense>
        ) : (
          <p className="px-5 py-6 text-sm text-ink-soft">
            La Consultoría lista esta norma pero no expone su archivo.
          </p>
        )}
      </Card>

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

/**
 * El peso del PDF sale de un HEAD a la Consultoría. La ficha ya no lo espera:
 * se transmite en cuanto responde, y si no responde el visor sale sin peso.
 */
async function TextoNorma({ url, nombre }: { url: string; nombre: string }) {
  const peso = await pesoDocumento(url);
  return (
    <VisorDocumento
      url={url}
      urlVisor={urlDeLectura(url)}
      nombre={nombre}
      tipo={peso?.tipo ?? "application/pdf"}
      bytes={peso?.bytes ?? null}
      origen="la Consultoría Jurídica"
    />
  );
}
