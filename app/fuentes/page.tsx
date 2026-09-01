import Link from "next/link";
import type { Metadata } from "next";
import { getCountIniciativas, getPeriodos } from "@/lib/congreso";
import { CUATRIENIOS, getCensoSenado } from "@/lib/senado";
import { getDeuda } from "@/lib/deuda";
import { formatInt } from "@/lib/nomina";
import { getResumenNomina } from "@/lib/nomina-server";
import { IconArrowLeft } from "@/components/icons";

export const metadata: Metadata = {
  title: "Fuentes",
  description:
    "Qué fuentes alimentan la plataforma, cuáles están bloqueadas y con qué límites de cobertura.",
};

export const revalidate = 3600;

export default async function FuentesPage() {
  const [censo, periodos, censoSenado, nomina, deuda] = await Promise.all([
    getCountIniciativas(),
    getPeriodos(),
    getCensoSenado(),
    getResumenNomina(),
    getDeuda(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Panorama
      </Link>

      <header className="mb-6 mt-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Estado de las fuentes
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Qué alimenta esta plataforma, qué no, y por qué. Sin maquillarlo: una
          herramienta de inteligencia que oculta sus huecos de cobertura no sirve
          para decidir.
        </p>
      </header>

      <div className="space-y-4">
        <Fuente nombre="DGCP — Compras públicas" estado="activa" etiqueta="Conectada">
          <p>
            API de datos abiertos de la Dirección General de Contrataciones
            Públicas. Alimenta el buscador de licitaciones, los precios históricos
            de adjudicación y el panel de mercado.
          </p>
          <p className="mt-2">
            Los pliegos y actas de cada proceso son públicos, pero
            comprasdominicana los manda como descarga forzada y prohíbe
            incrustarlos: bajar un archivo para saber qué dice no es acceso a la
            información, así que la plataforma los vuelve a servir para lectura
            —los mismos bytes, sin editar— y los enlaces de abrir y descargar
            siguen apuntando al original.
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            Las búsquedas por texto escanean hasta 6 páginas de 1000 registros
            dentro del rango de fechas; cuando el barrido no cubre todo, la
            interfaz lo advierte en vez de fingir un resultado completo.
          </p>
        </Fuente>

        <Fuente
          nombre="SIL — Cámara de Diputados"
          estado={censo !== null ? "activa" : "caida"}
          etiqueta={censo !== null ? "Conectada" : "Sin respuesta"}
        >
          <p>
            API JSON interna del portal SIL Ciudadano, abierta y sin
            autenticación. Alimenta iniciativas, trámites, proponentes y la alerta
            de perención.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            <Metrica
              etiqueta="Iniciativas"
              valor={censo !== null ? formatInt(censo) : "—"}
            />
            <Metrica etiqueta="Por página" valor="10 (fijo)" />
            <Metrica
              etiqueta="Períodos"
              valor={periodos.length > 0 ? periodos.map((p) => p.description).join(", ") : "—"}
            />
          </dl>
          <p className="mt-3 text-xs text-ink-soft">
            No es una API pública documentada: es un contrato interno que puede
            cambiar sin aviso. Toda la lectura es GET y valida{" "}
            <code className="rounded bg-canvas px-1 py-0.5 font-mono">content-type</code>,
            porque el catch-all de la SPA devuelve HTML con estado 200 en rutas
            inexistentes.
          </p>
        </Fuente>

        <Fuente
          nombre="Nóminas de transparencia (consolidadas)"
          estado={nomina !== null ? "activa" : "caida"}
          etiqueta={nomina !== null ? "Instantánea local" : "No disponible"}
        >
          <p>
            Cada institución publica su nómina bajo la Ley 200-04 en formatos que
            solo coinciden en el concepto. Esta plataforma consolida las que están
            en formato procesable en una <strong>foto transversal</strong>: el
            último mes publicado por cada institución, sin nombres ni datos
            personales (cada fila es una plaza con su sueldo bruto).
          </p>
          {nomina && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              <Metrica etiqueta="Instituciones" valor={formatInt(nomina.instituciones)} />
              <Metrica etiqueta="Plazas" valor={formatInt(nomina.plazas)} />
              <Metrica etiqueta="Foto más reciente" valor={nomina.periodoReciente} />
            </dl>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            Cobertura parcial declarada: es lo publicado en CSV procesable, no
            todo el Estado. La nómina estatal completa (con nombres) vive en el
            tablero oficial del{" "}
            <a
              href="https://transparencia.gob.do/2025/12/17/nomina/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-700 hover:underline"
            >
              Portal Único de Transparencia
            </a>
            , un Power BI sin API pública utilizable. Fuente fija: se actualiza al
            regenerar el archivo (fuentes y método en{" "}
            <code className="rounded bg-canvas px-1 py-0.5 font-mono">
              scripts/build-nomina.py
            </code>
            ).
          </p>
        </Fuente>

        <Fuente
          nombre="Consultoría Jurídica — normativa del Ejecutivo"
          estado="activa"
          etiqueta="Conectada"
        >
          <p>
            Consulta pública de la Consultoría Jurídica del Poder Ejecutivo:
            leyes, decretos, reglamentos, resoluciones y Gaceta Oficial (desde
            1926). No hay API — es una app con token antiforgery, de la misma
            familia que el consultante del Senado. Alimenta la vertical de{" "}
            <Link href="/normativa" className="font-medium text-brand-700 hover:underline">
              normativa
            </Link>
            , donde se ve el conteo en vivo por año.
          </p>
          <p className="mt-2">
            Sus PDF sí traen capa de texto —no son escaneos— y el origen los
            sirve incrustables, así que cada norma se lee entera dentro de la
            plataforma, con el buscador del propio visor. Es también la vía al
            articulado de las piezas del Congreso ya promulgadas.
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            Toda la lectura es GET/POST de consulta y se acota por año: el origen
            no pagina y cuelga si se le pide todo el histórico de una vez. Los
            operadores de fecha son numéricos, no el signo igual.
          </p>
        </Fuente>

        <Fuente
          nombre="Crédito Público — deuda del SPNF"
          estado={deuda !== null ? "activa" : "caida"}
          etiqueta={
            deuda === null
              ? "Sin respuesta"
              : deuda.desdeInstantanea
                ? "Instantánea"
                : "Conectada"
          }
        >
          <p>
            Dirección General de Crédito Público del Ministerio de Hacienda.
            Publica la evolución del saldo de la deuda del Sector Público No
            Financiero como archivos XLSX mensuales con URL predecible; la
            plataforma intenta la lectura en vivo y, como el servidor del origen
            no acepta conexiones desde la nube, sirve la última instantánea
            verificada declarando su fecha.
          </p>
          {deuda && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              <Metrica
                etiqueta="Deuda total"
                valor={`US$${(deuda.saldoTotal / 1000).toFixed(1)}MM`}
              />
              <Metrica etiqueta="Saldo a" valor={deuda.periodo} />
              <Metrica
                etiqueta={deuda.desdeInstantanea ? "Instantánea del" : "Formato"}
                valor={deuda.desdeInstantanea ? (deuda.generadoEn ?? "—") : "XLSX mensual"}
              />
            </dl>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            Sin clave ni WAF. El saldo viene en millones de dólares; la
            plataforma lo lee de la fila «Deuda Pública Total del SPNF» de la
            hoja de saldo-evolución.
          </p>
        </Fuente>

        <Fuente
          nombre="Servidor de documentos de Diputados"
          estado="bloqueada"
          etiqueta="Inalcanzable"
        >
          <p>
            Los textos de los proyectos son PDF y están versionados por etapa
            —depósito, modificaciones sucesivas, texto aprobado—, que es
            exactamente lo que necesita una comparación entre lecturas.
          </p>
          <p className="mt-2">
            Pero viven en un servidor on-premise en RD que rechaza la conexión en
            el handshake TLS desde fuera del país. Los enlaces “Abrir” de cada
            ficha apuntan al origen real y funcionan desde una red dominicana; la
            extracción automática de texto sigue bloqueada. El Senado sí sirve
            los suyos por internet abierto, y por eso sus fichas traen el
            documento incrustado y las de Diputados no.
          </p>
        </Fuente>

        <Fuente
          nombre="SIL — Senado"
          estado={censoSenado !== null ? "activa" : "caida"}
          etiqueta={censoSenado !== null ? "Conectada" : "Sin respuesta"}
        >
          <p>
            El sistema de consulta pública de expedientes que la propia web del
            Senado enlaza («consultante»), con seis colecciones por cuatrienio
            desde 2002. Alimenta el listado, la búsqueda y las fichas del
            Senado: estado procesal, historial de trámites, proponentes,
            promulgación, el número del expediente gemelo en Diputados y —vía
            su documentación asociada— el PDF del proyecto tal como se
            depositó.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            <Metrica
              etiqueta="Expedientes (2024-2028)"
              valor={censoSenado !== null ? formatInt(censoSenado) : "—"}
            />
            <Metrica etiqueta="Colecciones" valor={String(CUATRIENIOS.length)} />
            <Metrica
              etiqueta="Cobertura"
              valor={`${CUATRIENIOS[CUATRIENIOS.length - 1].etiqueta.slice(0, 4)}–hoy`}
            />
          </dl>
          <p className="mt-3 text-xs text-ink-soft">
            Los textos que publica son escaneos: PDF de imágenes, sin capa de
            texto, así que se pueden leer y descargar pero no buscar por
            palabra. Su búsqueda es literal y distingue tildes, muestra 50 filas por consulta y cada
            colección exige su propia sesión. Se lee con caché larga y volumen
            mínimo: el <code className="rounded bg-canvas px-1 py-0.5 font-mono">robots.txt</code>{" "}
            de la web del Senado sigue vetando rastreadores de IA y limitando el
            ritmo del resto, así que esta plataforma no rastrea esa web: lee el
            consultante, que no declara restricciones, muy por debajo de ese
            techo.
          </p>
        </Fuente>

        <Fuente
          nombre="Portal de datos abiertos (datos.gob.do)"
          estado="descartada"
          etiqueta="Sin datos útiles"
        >
          <p>
            Su <code className="rounded bg-canvas px-1 py-0.5 font-mono">robots.txt</code>{" "}
            prohíbe <code className="rounded bg-canvas px-1 py-0.5 font-mono">/api/</code>, y
            la búsqueda de conjuntos del Congreso no devolvió resultados. No se usa.
          </p>
        </Fuente>
      </div>

      <section className="mt-8 rounded-2xl border border-hairline bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Límites de cobertura</h2>
        <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-ink-soft">
          <li>
            El listado de <strong>Diputados</strong> cubre el registro vigente. Las
            piezas que siguen vivas se arrastran conservando su fecha de depósito
            original, con depósitos desde 2003; lo que murió en períodos anteriores
            no aparece. El límite es la supervivencia, no la antigüedad.
          </li>
          <li>
            El consultante del <strong>Senado</strong> no pagina hacia atrás por
            URL: el listado enseña los 50 expedientes más recientes de cada
            colección y el resto se alcanza buscando por texto. La búsqueda es
            subcadena literal, sensible a tildes.
          </li>
          <li>
            Los conteos por condición del panorama salen de una muestra de las
            páginas más recientes. El SIL pagina de 10 en 10 y no expone agregados.
          </li>
          <li>
            No hay base de datos ni ingesta persistente: cada vista lee su fuente en
            vivo con caché de minutos. La detección de cambios por comparación de
            instantáneas llega con esa capa.
          </li>
        </ul>
        <p className="mt-4 text-xs text-ink-soft">
          Herramienta independiente y no oficial. Para efectos legales, verificar
          contra la institución correspondiente.
        </p>
      </section>
    </div>
  );
}

const ESTADOS = {
  activa: "bg-brand-50 text-brand-600 ring-brand-500/20",
  bloqueada: "bg-sello-50 text-sello-700 ring-sello-600/20",
  descartada: "bg-hairline text-ink-soft ring-hairline",
  caida: "bg-alerta-50 text-alerta-600 ring-alerta-600/20",
} as const;

function Fuente({
  nombre,
  estado,
  etiqueta,
  children,
}: {
  nombre: string;
  estado: keyof typeof ESTADOS;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{nombre}</h2>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${ESTADOS[estado]}`}
        >
          {etiqueta}
        </span>
      </div>
      <div className="mt-2.5 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-soft">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{valor}</dd>
    </div>
  );
}
