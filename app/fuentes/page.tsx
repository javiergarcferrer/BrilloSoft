import Link from "next/link";
import type { Metadata } from "next";
import { getCountIniciativas, getPeriodos } from "@/lib/congreso";
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
  const [censo, periodos, nomina] = await Promise.all([
    getCountIniciativas(),
    getPeriodos(),
    getResumenNomina(),
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
          nombre="Nómina de empleados fijos"
          estado={nomina !== null ? "activa" : "caida"}
          etiqueta={nomina !== null ? "Instantánea local" : "No disponible"}
        >
          <p>
            Instantáneas mensuales de plazas presupuestadas (2023–2026),
            transformadas a un JSON compacto que se sirve como archivo estático.
            No contiene nombres ni datos personales: cada fila es un puesto en un
            mes.
          </p>
          {nomina && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              <Metrica etiqueta="Registros" valor={formatInt(nomina.registros)} />
              <Metrica etiqueta="Localidades" valor={formatInt(nomina.localidades)} />
              <Metrica etiqueta="Último período" valor={nomina.ultimoPeriodo} />
            </dl>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            A diferencia de las otras dos, esta fuente es una foto fija: se
            actualiza cuando se regenera el archivo, no en vivo.
          </p>
        </Fuente>

        <Fuente
          nombre="Servidor de documentos del Congreso"
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
            extracción automática de texto sigue bloqueada.
          </p>
        </Fuente>

        <Fuente nombre="SIL — Senado" estado="bloqueada" etiqueta="No integrada">
          <p>
            El Senado bloquea explícitamente por nombre a los rastreadores
            automatizados en su{" "}
            <code className="rounded bg-canvas px-1 py-0.5 font-mono">robots.txt</code>{" "}
            e impone un <code className="rounded bg-canvas px-1 py-0.5 font-mono">Crawl-delay</code>{" "}
            de 120 segundos al resto: unas 720 peticiones diarias como techo,
            inviable para un producto de alertas.
          </p>
          <p className="mt-2">
            No se scrapea. La vía correcta es una solicitud formal a su Oficina de
            Acceso a la Información bajo la <strong>Ley 200-04</strong>.
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
            El listado del Congreso cubre el <strong>registro vigente</strong>. Las
            piezas que siguen vivas se arrastran conservando su fecha de depósito
            original, con depósitos desde 2003; lo que murió en períodos anteriores
            no aparece. El límite es la supervivencia, no la antigüedad.
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
  activa: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  bloqueada: "bg-rose-50 text-rose-700 ring-rose-600/20",
  descartada: "bg-slate-100 text-slate-600 ring-slate-300",
  caida: "bg-amber-50 text-amber-700 ring-amber-600/20",
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
