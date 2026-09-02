import Link from "next/link";
import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import { CondicionBadge } from "@/components/iniciativa-card";
import {
  cuatrienioPorEtiqueta,
  documentoPrincipal,
  getArchivoSenado,
  getDocumentosSenado,
  getFichaSenado,
} from "@/lib/senado";
import { formatFecha, hace } from "@/lib/format";
import { getAgregado, refIniciativa } from "@/lib/democracia";
import VotoWidget from "@/components/democracia/voto-widget";
import Dossier from "@/components/congreso/dossier";
import VisorDocumento from "@/components/visor-documento";
import { urlDeLectura } from "@/lib/documentos";
import { IconArrowLeft, IconExternal } from "@/components/icons";
import { Esqueleto } from "@/components/esqueleto";

export const revalidate = 3600;

type Props = { params: Promise<{ cuatrienio: string; id: string }> };

/** Una lectura del consultante por render, compartida con `generateMetadata`. */
const fichaPorClave = cache(async (etiqueta: string, idParam: string) => {
  const cuatrienio = cuatrienioPorEtiqueta(etiqueta);
  const id = Number(idParam);
  if (!cuatrienio || !Number.isFinite(id) || id <= 0) return null;
  return getFichaSenado(cuatrienio.etiqueta, id);
});

async function cargarFicha(params: Props["params"]) {
  const { cuatrienio: etiqueta, id: idParam } = await params;
  return fichaPorClave(etiqueta, idParam);
}

export async function generateMetadata({ params }: Props) {
  const ficha = await cargarFicha(params);
  if (!ficha) return { title: "Expediente no encontrado" };
  return {
    title: ficha.numero?.completo ?? `Expediente ${ficha.id}`,
    description: ficha.titulo.slice(0, 160),
  };
}

export default async function ExpedienteSenadoPage({ params }: Props) {
  const ficha = await cargarFicha(params);
  if (!ficha) notFound();

  const ref = refIniciativa("senado", ficha.id, ficha.cuatrienio);
  const agregado = await getAgregado("senado", ref);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/congreso/senado"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Senado
      </Link>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-brand-700">
            {ficha.numero?.completo ?? `#${ficha.id}`}
          </span>
          <CondicionBadge tono={ficha.tono}>
            {ficha.estadoActual ?? ficha.condicion ?? "—"}
          </CondicionBadge>
          {ficha.promulgada && <CondicionBadge tono="aprobado">Promulgada</CondicionBadge>}
          {ficha.perimida && <CondicionBadge tono="perimido">Perimida</CondicionBadge>}
        </div>

        <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
          {ficha.titulo}
        </h1>

        {ficha.tituloModificado && (
          <div className="mt-3 rounded-lg border-l-[3px] border-brand-500 bg-surface py-3 pl-4 pr-3 ">
            <p className="rotulo text-brand-700">
              Título modificado durante el trámite
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {ficha.tituloModificado}
            </p>
          </div>
        )}
      </header>

      {ficha.promulgada && (
        <section className="mt-5 rounded-lg border border-valido-500/25 bg-valido-50 px-4 py-3">
          <p className="text-sm font-semibold text-valido-700">
            {ficha.numPromulgacion
              ? `Promulgada como Ley ${ficha.numPromulgacion}`
              : "Promulgada"}
          </p>
          {ficha.fechaPromulgacion && (
            <p className="mt-0.5 text-xs text-brand-600/80">
              {formatFecha(ficha.fechaPromulgacion)}
            </p>
          )}
        </section>
      )}

      {/*
        Orden deliberado: primero qué es y qué toca, después el texto oficial y
        solo entonces el voto. Nadie debería opinar sobre una pieza que la
        interfaz no le dejó entender.
      */}
      <Suspense fallback={<Esqueleto className="mt-5 h-40" />}>
        <Dossier
          titulo={ficha.titulo}
          tituloModificado={ficha.tituloModificado}
          tipo={ficha.tipo}
          condicion={
            ficha.promulgada
              ? "Promulgada"
              : ficha.perimida
                ? "Perimida"
                : (ficha.estadoActual ?? ficha.condicion)
          }
          materia={ficha.materia}
          proponente={ficha.proponentes[0] ?? ficha.poderOrigen}
          promulgadaComo={ficha.numPromulgacion}
        />
      </Suspense>

      {/*
        La documentación son hasta cuatro peticiones más al consultante
        (listado + la cadena de tres del archivo principal). Antes la ficha
        entera esperaba a esa cadena; ahora se transmite cuando llega.
      */}
      <Suspense fallback={<DocumentoEsqueleto />}>
        <SeccionDocumento cuatrienio={ficha.cuatrienio} id={ficha.id} />
      </Suspense>

      {agregado && (
        <div className="mt-5">
          <VotoWidget
            camara="senado"
            refIni={ref}
            numero={ficha.numero?.completo ?? null}
            titulo={ficha.titulo}
            grupo={ficha.materia}
            inicial={agregado}
          />
        </div>
      )}

      <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-hairline bg-surface p-5  sm:grid-cols-3">
        <Dato etiqueta="Tipo" valor={ficha.tipo} />
        <Dato etiqueta="Cámara inicial" valor={ficha.camaraInicial} />
        <Dato etiqueta="Poder de origen" valor={ficha.poderOrigen} />
        <Dato etiqueta="Condición" valor={ficha.condicion} />
        <Dato etiqueta="Materia" valor={ficha.materia} />
        <Dato etiqueta="Legislatura de inicio" valor={ficha.legislaturaInicio} mono />
        <Dato etiqueta="Cuatrienio" valor={ficha.cuatrienio} mono />
        <Dato
          etiqueta="Recibido por el Senado"
          valor={ficha.fechaRecibido ? formatFecha(ficha.fechaRecibido) : null}
          nota={hace(ficha.fechaRecibido)}
        />
        <Dato
          etiqueta="Despachada"
          valor={
            ficha.despachada
              ? [formatFecha(ficha.despachada), ficha.despachadaHacia]
                  .filter(Boolean)
                  .join(" · hacia ")
              : null
          }
        />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          titulo="Historial de trámites"
          nota={ficha.historial.length > 0 ? String(ficha.historial.length) : undefined}
        >
          {ficha.historial.length > 0 ? (
            <ol className="px-5 py-4">
              {ficha.historial.map((h, i) => (
                <li key={`${h.evento}-${i}`} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sello-600" />
                    {i < ficha.historial.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-hairline" />
                    )}
                  </div>
                  <div className="-mt-0.5 min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{h.evento}</p>
                    <p className="font-mono mt-0.5 text-xs tabular-nums text-ink-soft">
                      {h.fecha ? formatFecha(h.fecha) : "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : ficha.historialCrudo ? (
            <p className="px-5 py-4 text-sm leading-relaxed text-ink-soft">
              {ficha.historialCrudo}
            </p>
          ) : (
            <p className="px-5 py-6 text-sm text-ink-soft">Sin trámites registrados.</p>
          )}
          <div className="border-t border-hairline bg-canvas/50 px-5 py-2.5">
            <p className="text-xs text-ink-soft">
              El consultante publica los trámites como prosa fechada; el texto
              íntegro va aparte, en la documentación del expediente.{" "}
              <Link href="/fuentes" className="text-brand-700 underline">
                Detalle
              </Link>
              .
            </p>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel
            titulo="Proponentes"
            nota={ficha.proponentes.length > 0 ? String(ficha.proponentes.length) : undefined}
          >
            {ficha.proponentes.length > 0 ? (
              <ul className="divide-y divide-hairline">
                {ficha.proponentes.map((p) => (
                  <li key={p} className="px-5 py-3">
                    <p className="text-sm font-medium text-ink">{p}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-ink-soft">Sin proponentes registrados.</p>
            )}
          </Panel>

          {ficha.comisiones && (
            <Panel titulo="Comisiones">
              <p className="px-5 py-4 text-sm leading-relaxed text-ink">
                {ficha.comisiones}
              </p>
            </Panel>
          )}

          {ficha.numeroDiputados && (
            <Panel titulo="En la Cámara de Diputados">
              <div className="px-5 py-4">
                <p className="font-mono text-sm tabular-nums text-ink">
                  {ficha.numeroDiputados}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                  Cita del expediente gemelo en Diputados. Los números de ambas
                  cámaras cambian al arrastrarse entre períodos, así que no hay
                  enlace directo confiable; se muestra como referencia.
                </p>
              </div>
            </Panel>
          )}

          {ficha.anotaciones && (
            <Panel titulo="Anotaciones del Senado">
              <p className="px-5 py-4 text-sm leading-relaxed text-ink-soft">
                {ficha.anotaciones}
              </p>
            </Panel>
          )}
        </div>
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
  nota,
  mono,
}: {
  etiqueta: string;
  valor: string | null;
  /** Antigüedad en llano: «hace 4 meses». Una fecha sola obliga a restar. */
  nota?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="rotulo text-ink-soft">{etiqueta}</dt>
      <dd
        className={
          mono
            ? "mt-0.5 font-mono text-sm tabular-nums text-ink"
            : "mt-0.5 text-sm text-ink"
        }
      >
        {valor ?? "—"}
      </dd>
      {nota && <p className="mt-0.5 text-[11px] text-ink-soft">{nota}</p>}
    </div>
  );
}

function DocumentoEsqueleto() {
  return (
    <section
      aria-busy="true"
      className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface "
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
        <h2 className="font-sans text-sm font-semibold text-ink">El documento</h2>
      </div>
      <div className="px-5 py-4">
        <div className="shimmer h-14 rounded-lg border border-hairline bg-canvas" />
        <p className="mt-2 text-xs text-ink-soft">Localizando el archivo en el SIL del Senado…</p>
      </div>
    </section>
  );
}

async function SeccionDocumento({ cuatrienio, id }: { cuatrienio: string; id: number }) {
  const documentos = await getDocumentosSenado(cuatrienio, id);

  // Solo se resuelve el archivo de la pieza principal: cada resolución son tres
  // peticiones al consultante y el resto de la documentación queda enlazada
  // desde el propio origen.
  const principal = documentoPrincipal(documentos);
  const archivo = principal
    ? await getArchivoSenado(cuatrienio, id, principal.item, principal.bd)
    : null;

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface ">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
        <h2 className="font-sans text-sm font-semibold text-ink">El documento</h2>
        {documentos.length > 1 && (
          <span className="font-mono text-xs tabular-nums text-ink-soft">
            {documentos.length} piezas
          </span>
        )}
      </div>

      {archivo && principal ? (
        <VisorDocumento
          url={archivo.url}
          urlVisor={urlDeLectura(archivo.url)}
          nombre={principal.nombre || "Documento del expediente"}
          tipo={archivo.tipo}
          bytes={archivo.bytes}
          origen="el SIL del Senado"
          escaneo
        />
      ) : documentos.length > 0 ? (
        <p className="px-5 py-6 text-sm leading-relaxed text-ink-soft">
          El expediente tiene {documentos.length}{" "}
          {documentos.length === 1 ? "documento" : "documentos"}, pero el
          consultante no entregó el archivo en este momento. Vuelve a
          intentarlo o ábrelo desde el SIL del Senado.
        </p>
      ) : (
        <p className="px-5 py-6 text-sm leading-relaxed text-ink-soft">
          El Senado todavía no ha subido el texto de esta pieza. Aparece aquí
          en cuanto lo publique.
        </p>
      )}

      {documentos.length > 1 && (
        <ul className="divide-y divide-hairline border-t border-hairline">
          {documentos
            .filter((d) => d.item !== principal?.item)
            .map((d) => (
              <li key={d.item} className="flex items-start gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{d.nombre}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{d.seccion}</p>
                </div>
                {/*
                  Se resuelve al hacer clic: resolver los ocho documentos de
                  un expediente veterano al pintar la página serían dos
                  docenas de peticiones al consultante.
                */}
                <a
                  href={`/api/senado/documento?c=${encodeURIComponent(cuatrienio)}&e=${id}&item=${d.item}&bd=${d.bd}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  Abrir
                  <IconExternal className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
