import Link from "next/link";
import { IconExternal, IconLayers } from "@/components/icons";
import {
  ETIQUETA_RELACION,
  numeroDeNorma,
  queEs,
  queSigue,
  referenciasNormativas,
  type ReferenciaNorma,
} from "@/lib/legislacion";
import { RUTA_POR_TIPO, resolverNorma } from "@/lib/normativa";
import type { Documento as DocumentoNormativo } from "@/lib/normativa";
import { formatFecha } from "@/lib/format";
import { desdeMayusculas } from "@/lib/congreso";

interface Props {
  /** Título tal como lo publica la cámara; de aquí salen las citas. */
  titulo: string;
  /** Título reformulado, si el trámite lo cambió: también cita normas. */
  tituloModificado?: string | null;
  tipo: string | null;
  condicion: string | null;
  materia?: string | null;
  proponente?: string | null;
  /** Número con que se promulgó («136-15»), si completó el trámite. */
  promulgadaComo?: string | null;
}

/** Cuántas citas se resuelven contra la Consultoría por ficha. */
const MAX_CITAS_RESUELTAS = 4;

interface CitaResuelta {
  ref: ReferenciaNorma;
  norma: DocumentoNormativo | null;
}

/**
 * «De qué se trata»: el dossier en lenguaje llano de una iniciativa.
 *
 * Ninguna de las dos cámaras publica sinopsis —el único texto es el título—,
 * así que aquí no se resume: se **explica**. Qué tipo de pieza es, qué normas
 * vigentes toca (resueltas contra la Consultoría Jurídica, que sí tiene el
 * texto de cada una) y en qué punto del trámite está. Todo se deriva del
 * enunciado oficial, que queda íntegro a la vista más arriba.
 */
export default async function Dossier({
  titulo,
  tituloModificado,
  tipo,
  condicion,
  materia,
  proponente,
  promulgadaComo,
}: Props) {
  const refs = referenciasNormativas([titulo, tituloModificado].filter(Boolean).join(". "));
  const citas: CitaResuelta[] = await Promise.all(
    refs.slice(0, MAX_CITAS_RESUELTAS).map(async (ref) => ({
      ref,
      norma: await resolverNorma(ref.tipo, ref.numero),
    })),
  );
  for (const ref of refs.slice(MAX_CITAS_RESUELTAS)) citas.push({ ref, norma: null });

  // Si completó el trámite, su texto definitivo está en la Consultoría: es la
  // única vía al articulado en las fichas de Diputados, cuyo servidor de
  // documentos no acepta conexiones desde fuera del país.
  const ley = await resolverNorma("Ley", numeroDeNorma(promulgadaComo));

  const esto = ley ? null : queEs(tipo);
  const sigue = queSigue(condicion);
  if (!esto && !sigue && !ley && citas.length === 0 && !materia && !proponente) {
    return null;
  }

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface ">
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-3.5">
        <IconLayers className="h-4 w-4 text-brand-700" />
        <h2 className="font-sans text-sm font-semibold text-ink">De qué se trata</h2>
      </div>

      <div className="divide-y divide-hairline">
        {ley && (
          <div className="bg-valido-50 px-5 py-4">
            <p className="rotulo text-valido-700">
              Ya es ley — texto vigente
            </p>
            <p className="mt-1.5 text-sm font-medium text-ink">
              {`Ley ${ley.numero}${ley.titulo ? `, ${desdeMayusculas(ley.titulo)}` : ""}`}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {[ley.gaceta && `Gaceta ${ley.gaceta}`, ley.fecha && formatFecha(ley.fechaIso ?? undefined)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Link
              href={`/normativa/ley/${ley.numero}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Leer el texto de la ley →
            </Link>
          </div>
        )}

        {(esto || materia || proponente) && (
          <div className="px-5 py-4">
            {esto && (
              <>
                <p className="rotulo text-ink-soft">
                  Qué es
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{esto}</p>
              </>
            )}
            {(materia || proponente) && (
              <p className={esto ? "mt-2 text-xs leading-relaxed text-ink-soft" : "text-xs leading-relaxed text-ink-soft"}>
                {proponente && (
                  <>
                    La propone{" "}
                    <span className="font-medium text-ink">
                      {desdeMayusculas(proponente)}
                    </span>
                    {materia ? " y " : "."}
                  </>
                )}
                {materia && (
                  <>
                    la cámara la clasifica en{" "}
                    <span className="font-medium text-ink">
                      {desdeMayusculas(materia)}
                    </span>
                    .
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {sigue && (
          <div className="px-5 py-4">
            <p className="rotulo text-ink-soft">
              En qué punto está
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{sigue}</p>
            {citas.length > 0 && (
          <div className="px-5 py-4">
            <p className="rotulo text-ink-soft">
              Qué toca del ordenamiento vigente
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {citas.map(({ ref, norma }) => (
                <li key={`${ref.tipo}-${ref.numero ?? "s/n"}`} className="flex gap-2.5">
                  <span
                    className={`rotulo mt-0.5 inline-flex h-fit shrink-0 self-start rounded-[3px] px-1.5 py-0.5 ${
                      ref.relacion === "deroga"
                        ? "bg-sello-50 text-sello-700"
                        : ref.relacion === "cita"
                          ? "bg-canvas text-ink-soft"
                          : "bg-alerta-50 text-alerta-600"
                    }`}
                  >
                    {ETIQUETA_RELACION[ref.relacion]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{ref.etiqueta}</p>
                    {norma ? (
                      <>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                          {desdeMayusculas(norma.titulo)}
                          {norma.fecha && ` · ${formatFecha(norma.fechaIso ?? undefined)}`}
                          {norma.gaceta && ` · Gaceta ${norma.gaceta}`}
                        </p>
                        {RUTA_POR_TIPO[ref.tipo] && ref.numero ? (
                          <Link
                            href={`/normativa/${RUTA_POR_TIPO[ref.tipo]}/${ref.numero}`}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                          >
                            Leer el texto de esta norma →
                          </Link>
                        ) : (
                          norma.url && (
                            <a
                              href={norma.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                            >
                              Texto oficial en la Consultoría Jurídica
                              <IconExternal className="h-3.5 w-3.5" />
                            </a>
                          )
                        )}
                      </>
                    ) : (
                      <p className="mt-0.5 text-xs text-ink-soft">
                        Citada en el título; no se pudo enlazar su texto.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
              Las citas se extraen del enunciado oficial y se resuelven contra la{" "}
              <Link href="/normativa" className="text-brand-700 underline">
                normativa del Poder Ejecutivo
              </Link>
              .
            </p>
          </div>
        )}

      </div>
        )}
      </div>
    </section>
  );
}
