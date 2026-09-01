import Link from "next/link";
import { notFound } from "next/navigation";
import { CondicionBadge } from "@/components/iniciativa-card";
import {
  documentoUrl,
  evaluarPerencion,
  getDocumentos,
  getHistoricos,
  getIniciativa,
  getProponentes,
  getRutaDocumento,
  normalizarDocumento,
  normalizarIniciativa,
  normalizarProponente,
} from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import { getAgregado, refIniciativa } from "@/lib/democracia";
import VotoWidget from "@/components/democracia/voto-widget";
import Dossier from "@/components/congreso/dossier";
import { IconArrowLeft, IconExternal } from "@/components/icons";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const raw = await getIniciativa(Number(id));
  if (!raw) return { title: "Iniciativa no encontrada" };
  const ini = normalizarIniciativa(raw);
  return {
    title: ini.numero?.completo ?? `Iniciativa ${ini.id}`,
    description: ini.titulo.slice(0, 160),
  };
}

export default async function IniciativaPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const raw = await getIniciativa(id);
  if (!raw) notFound();

  const ini = normalizarIniciativa(raw);

  const [historicos, proponentes, documentos, rutaBase] = await Promise.all([
    getHistoricos(id),
    getProponentes(id),
    getDocumentos(id),
    getRutaDocumento(),
  ]);

  const docs = documentos.results
    .map(normalizarDocumento)
    .sort((a, b) => (a.cargado ?? "").localeCompare(b.cargado ?? ""));
  const cadenaTexto = docs.filter((d) => d.etapa.texto);
  const proponentePrincipal =
    proponentes.results.find((p) => p.principal)?.nombreCompleto ??
    proponentes.results[0]?.nombreCompleto ??
    null;
  const perencion = ini.viva ? evaluarPerencion(ini.legislatura) : null;

  const ref = refIniciativa("diputados", ini.id);
  const agregado = await getAgregado("diputados", ref);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/congreso"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Congreso
      </Link>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-brand-700">
            {ini.numero?.completo ?? `#${ini.id}`}
          </span>
          <CondicionBadge tono={ini.tono}>{ini.condicion ?? "—"}</CondicionBadge>
          {ini.promulgada && <CondicionBadge tono="aprobado">Promulgada</CondicionBadge>}
        </div>

        <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
          {ini.titulo}
        </h1>

        {ini.tituloModificado && (
          <div className="mt-3 rounded-lg border-l-[3px] border-brand-500 bg-surface py-3 pl-4 pr-3 ">
            <p className="rotulo text-brand-700">
              Título modificado durante el trámite
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {ini.tituloModificado}
            </p>
          </div>
        )}
      </header>

      {perencion && perencion.estado !== "sin-datos" && (
        <section
          className={
            perencion.estado === "en-riesgo"
              ? "mt-5 rounded-lg border border-alerta-600/20 bg-alerta-50 px-4 py-3"
              : "mt-5 rounded-lg border border-hairline bg-surface px-4 py-3 "
          }
        >
          <p
            className={
              perencion.estado === "en-riesgo"
                ? "text-sm font-semibold text-alerta-700"
                : "text-sm font-semibold text-ink"
            }
          >
            {perencion.estado === "en-riesgo" &&
              `Perime en ${perencion.diasRestantes} días`}
            {perencion.estado === "vigente" &&
              `Quedan ${perencion.diasRestantes} días de legislatura`}
            {perencion.estado === "cerrada" && "Su legislatura ya cerró"}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {perencion.legislatura.nombre} {perencion.legislatura.anio} · cierra el{" "}
            {formatFecha(perencion.legislatura.cierre.toISOString().slice(0, 10))}
          </p>
        </section>
      )}

      {/*
        Antes de los metadatos: qué es la pieza, qué norma vigente toca y en qué
        punto del trámite está. El SIL no publica sinopsis, así que se explica
        desde el propio enunciado oficial.
      */}
      <Dossier
        titulo={ini.titulo}
        tipo={ini.tipo}
        condicion={ini.condicion ?? ini.estado}
        materia={ini.grupo ?? ini.materia}
        proponente={proponentePrincipal}
        promulgadaComo={ini.numPromulgacion}
      />

      <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-hairline bg-surface p-5  sm:grid-cols-3">
        <Dato etiqueta="Tipo" valor={ini.tipo} />
        <Dato etiqueta="Cámara de origen" valor={ini.camaraOrigen} />
        <Dato etiqueta="Estado" valor={ini.estado} />
        <Dato etiqueta="Tema" valor={ini.grupo} />
        <Dato etiqueta="Materia" valor={ini.materia} />
        <Dato etiqueta="Legislatura" valor={ini.legislatura} mono />
        <Dato etiqueta="Depositada" valor={formatFecha(ini.fechaDeposito ?? undefined)} />
        <Dato
          etiqueta="Último cambio"
          valor={formatFecha(ini.fechaUltimoCambio ?? undefined)}
        />
        <Dato
          etiqueta="Promulgación"
          valor={
            ini.promulgada
              ? [ini.numPromulgacion, formatFecha(ini.fechaPromulgacion ?? undefined)]
                  .filter(Boolean)
                  .join(" · ")
              : "No promulgada"
          }
        />
      </section>

      {agregado && (
        <div className="mt-5">
          <VotoWidget
            camara="diputados"
            refIni={ref}
            numero={ini.numero?.completo ?? null}
            titulo={ini.titulo}
            grupo={ini.grupo}
            inicial={agregado}
          />
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel
            titulo="Documentos"
            nota={cadenaTexto.length > 1 ? `${cadenaTexto.length} versiones del texto` : undefined}
          >
            {docs.length > 0 ? (
              <ul className="divide-y divide-hairline">
                {docs.map((doc) => {
                  const url = documentoUrl(rutaBase, doc.id);
                  return (
                    <li key={doc.id} className="flex items-start gap-3 px-5 py-3">
                      <span
                        aria-hidden
                        className={
                          doc.etapa.texto
                            ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sello-600"
                            : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-hairline"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {doc.etiqueta}
                          {doc.etapa.texto && (
                            <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 rotulo text-brand-700">
                              texto
                            </span>
                          )}
                        </p>
                        <p className="font-mono mt-0.5 text-xs tabular-nums text-ink-soft">
                          {formatFecha(doc.cargado ?? undefined)}
                          {doc.extension && ` · ${doc.extension.toUpperCase()}`}
                        </p>
                      </div>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                        >
                          Abrir
                          <IconExternal className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-soft">
                Esta pieza aún no tiene documentos cargados en el SIL.
              </p>
            )}

            {cadenaTexto.length > 1 && (
              <div className="border-t border-hairline bg-canvas/50 px-5 py-3">
                <p className="text-xs leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">
                    Comparación entre lecturas:
                  </span>{" "}
                  hay {cadenaTexto.length} versiones con articulado. El servidor de
                  documentos del Congreso es on-premise y no acepta conexiones desde
                  fuera de RD, así que la comparación automática todavía no corre.{" "}
                  <Link href="/fuentes" className="text-brand-700 underline">
                    Detalle
                  </Link>
                  .
                </p>
              </div>
            )}
          </Panel>

          <Panel titulo="Trámites">
            {historicos.results.length > 0 ? (
              <ol className="px-5 py-4">
                {historicos.results.map((h, i) => (
                  <li key={h.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sello-600" />
                      {i < historicos.results.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-hairline" />
                      )}
                    </div>
                    <div className="-mt-0.5 min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{h.estado ?? "—"}</p>
                      <p className="font-mono mt-0.5 text-xs tabular-nums text-ink-soft">
                        {formatFecha(h.inicio ?? undefined)}
                        {h.fin && h.fin !== h.inicio && (
                          <> → {formatFecha(h.fin)}</>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-soft">Sin trámites registrados.</p>
            )}
            <div className="border-t border-hairline bg-canvas/50 px-5 py-2.5">
              <p className="text-xs text-ink-soft">
                El SIL entrega intervalos de estado, no eventos con comisión ni cámara.
              </p>
            </div>
          </Panel>
        </div>

        <Panel titulo="Proponentes" nota={String(proponentes.total)}>
          {proponentes.results.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {proponentes.results.map(normalizarProponente).map((p, i) => (
                <li key={p.legisladorId ?? i} className="px-5 py-3">
                  <p className="text-sm font-medium text-ink">
                    {p.nombre}
                    {p.principal && (
                      <span className="ml-2 rotulo text-brand-700">
                        principal
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {[p.funcion, p.provincia, p.partidoSiglas].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-soft">Sin proponentes registrados.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface ">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
        <h2 className="font-sans text-sm font-semibold text-ink">{titulo}</h2>
        {nota && <span className="font-mono text-xs tabular-nums text-ink-soft">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

function Dato({
  etiqueta,
  valor,
  mono,
}: {
  etiqueta: string;
  valor: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-soft">{etiqueta}</dt>
      <dd
        className={
          mono
            ? "mt-0.5 font-mono text-sm tabular-nums text-ink"
            : "mt-0.5 text-sm text-ink"
        }
      >
        {valor ?? "—"}
      </dd>
    </div>
  );
}
