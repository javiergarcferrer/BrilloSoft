import Link from "next/link";
import { documentosDeInstitucion } from "@/lib/biblioteca";
import { formatFecha } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import Antiguedad from "@/components/antiguedad";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

/**
 * Lo último que la institución subió a su propio sitio (`lib/biblioteca.ts`).
 * Si no está en el índice —no usa WordPress, o cierra su vía de lectura—, no
 * pinta nada.
 */
export async function DocumentosDeInstitucion({ uc }: { uc: number }) {
  const r = await documentosDeInstitucion(uc);
  if (!r || r.docs.length === 0) return null;
  return (
    <Card as="section" id="documentos" className="p-5 sm:p-6">
      <CardTitle>Lo que publica</CardTitle>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Los documentos más recientes de los {formatInt(r.fuente.documentos)} que se
        pueden leer en {r.fuente.host}. Cada uno abre en el sitio de la institución;
        la fecha es la de subida.
      </p>
      <ol className="mt-3 divide-y divide-hairline">
        {r.docs.map((d) => (
          <li key={d.url} className="py-2.5">
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm leading-snug text-ink [overflow-wrap:anywhere] hover:text-brand-700 hover:underline"
            >
              {d.titulo}
            </a>
            <Antiguedad iso={d.fecha || null} prefijo="Subido" className="text-xs text-ink-soft" />
          </li>
        ))}
      </ol>
      <Button asChild variant="secondary" className="mt-3">
        <Link href={`/documentos?inst=${encodeURIComponent(r.fuente.host)}`}>
          Buscar en sus {formatInt(r.fuente.documentos)} documentos
        </Link>
      </Button>
      <p className="mt-3 text-xs text-ink-soft">Índice del {formatFecha(r.generado)}.</p>
    </Card>
  );
}
