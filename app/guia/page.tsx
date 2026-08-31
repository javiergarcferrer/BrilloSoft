import Link from "next/link";

export const metadata = {
  title: "Guía para ofertar al Estado — Licitaciones RD",
  description:
    "Cómo registrarte como proveedor del Estado dominicano, qué documentos suelen pedir y cómo presentar una oferta ganadora.",
};

const MODALIDADES: [string, string][] = [
  [
    "Compras por Debajo del Umbral",
    "Compras pequeñas y rápidas. Plazos muy cortos (días). Ideal para empezar: poca competencia formal y requisitos ligeros.",
  ],
  [
    "Contratación Menor",
    "Montos bajos-medios. Proceso simple con invitación pública corta. Buen punto de entrada para MIPYMES.",
  ],
  [
    "Comparación de Precios",
    "Montos medios. Gana la mejor oferta que cumpla la ficha técnica; la documentación pesa más que en las menores.",
  ],
  [
    "Licitación Pública (Nacional/Internacional)",
    "Montos altos. Proceso formal por etapas con pliego extenso, garantías obligatorias y mayor plazo. Exige preparación seria.",
  ],
  [
    "Subasta Inversa",
    "Los oferentes compiten bajando el precio en línea para bienes estandarizados.",
  ],
  [
    "Procesos de Excepción",
    "Casos especiales previstos por ley (emergencias, proveedor único, etc.). Suelen tener invitación dirigida.",
  ],
];

const ESTADOS: [string, string][] = [
  ["Proceso publicado", "Abierto: puedes preparar y presentar tu oferta."],
  ["Sobres estan abriendose / abiertos", "Cerró la recepción; la institución está abriendo y comparando ofertas."],
  ["Proceso con etapa cerrada", "En evaluación o entre etapas; espera resultados."],
  ["Proceso adjudicado y celebrado", "Ya hay ganador y contrato. Revisa quién ganó y a qué precio para aprender."],
  ["Proceso desierto", "Nadie ganó (sin ofertas válidas). Suele volver a publicarse: una segunda oportunidad."],
  ["Cancelado", "La institución desistió del proceso."],
];

export default function GuiaPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <h1 className="text-2xl font-semibold">Guía rápida para ofertar al Estado</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Lo esencial para pasar de &quot;vi una licitación interesante&quot; a
          &quot;presenté mi oferta a tiempo&quot;, en cuatro pasos.
        </p>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <h2 className="font-semibold">1 · Regístrate una sola vez: el RPE</h2>
        <p className="mt-2 text-sm text-ink-soft">
          El <strong>Registro de Proveedores del Estado (RPE)</strong> es el requisito
          de entrada para ofertar en cualquier institución. Necesitas tu RNC activo y
          estar al día con DGII y TSS. Se solicita en línea y debes registrar los{" "}
          <strong>rubros</strong> (categorías de bienes/servicios) en los que vas a
          ofertar — solo puedes participar en procesos de tus rubros.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            href="https://www.dgcp.gob.do/servicios/registro-de-proveedores/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
          >
            Inscribirse en el RPE (DGCP) ↗
          </a>
          <a
            href="https://comunidad.comprasdominicana.gob.do/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-hairline px-3 py-1.5 font-medium hover:border-emerald-500 hover:text-emerald-700"
          >
            Portal Transaccional ↗
          </a>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Consejo: si eres MIPYME (y más aún MIPYME liderada por mujeres), certifícalo —
          hay procesos reservados con menos competencia.
        </p>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <h2 className="font-semibold">2 · Conoce las modalidades (y dónde empezar)</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {MODALIDADES.map(([m, d]) => (
            <div key={m} className="rounded-lg bg-slate-50 px-4 py-2.5">
              <dt className="font-semibold">{m}</dt>
              <dd className="mt-0.5 text-ink-soft">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <h2 className="font-semibold">3 · Los documentos que casi siempre piden</h2>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ink-soft">
          <li>Constancia de inscripción en el RPE (vigente y en el rubro del proceso).</li>
          <li>Certificaciones de estar al día: DGII (impuestos) y TSS (seguridad social).</li>
          <li>
            <strong>Oferta técnica</strong>: tu propuesta punto por punto contra la ficha
            técnica del pliego — cumple cada requisito o explica el equivalente.
          </li>
          <li>
            <strong>Oferta económica</strong> en el formulario del pliego, firmada y en la
            divisa indicada.
          </li>
          <li>
            Garantías cuando el pliego las exige (seriedad de la oferta y, si ganas, fiel
            cumplimiento) — se gestionan con aseguradoras o bancos.
          </li>
          <li>Documentos societarios (registro mercantil, poderes) para personas jurídicas.</li>
        </ul>
        <p className="mt-2 text-xs text-ink-soft">
          La lista exacta siempre está en el pliego de condiciones de cada proceso — por
          eso es el primer documento que debes leer.
        </p>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <h2 className="font-semibold">4 · Qué significa cada estado</h2>
        <dl className="mt-3 space-y-2 text-sm">
          {ESTADOS.map(([e, d]) => (
            <div key={e} className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-2.5">
              <dt className="shrink-0 font-semibold">{e}</dt>
              <dd className="text-ink-soft">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
        <h2 className="font-semibold text-emerald-900">Consejos que ganan procesos</h2>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-emerald-900/80">
          <li>
            Cotiza con datos: revisa los <strong>precios históricos de adjudicación</strong>{" "}
            que mostramos en cada proceso antes de fijar tu precio.
          </li>
          <li>
            No dejes la carga de la oferta para el último día — el Portal Transaccional
            cierra a la hora exacta.
          </li>
          <li>
            Vigila las <strong>enmiendas</strong>: el pliego puede cambiar después de
            publicado y tu oferta debe responder a la versión final.
          </li>
          <li>
            Un proceso <strong>desierto</strong> casi siempre se republica: márcalo con ★
            y prepárate para la segunda ronda.
          </li>
          <li>
            Si un requisito te descalifica injustamente, puedes pedir aclaraciones dentro
            del plazo que fija el pliego.
          </li>
        </ul>
        <Link
          href="/licitaciones"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Buscar oportunidades abiertas →
        </Link>
      </section>
    </div>
  );
}
