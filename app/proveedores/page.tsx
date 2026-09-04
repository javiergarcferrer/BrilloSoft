import Link from "next/link";
import { Suspense, cache } from "react";
import type { Metadata } from "next";
import {
  buscarProveedores,
  contarProveedoresRegistrados,
  muestrearProveedores,
  registrosDeProveedores,
  type ProveedorEnMercado,
  type ProveedorRegistro,
  type ResultadoProveedores,
} from "@/lib/dgcp";
import { titulizar } from "@/lib/capitulos";
import { formatFecha, formatMonto, formatPesos, hace } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import {
  Accion,
  Cifra,
  Hoja,
  CabeceraHoja,
  Marca,
  Rotulo,
  TiraDeCifras,
} from "@/components/papel";
import type { Ancla } from "@/lib/cifras";
import { Cargando, Esqueleto, EsqueletoFilas } from "@/components/esqueleto";
import { IconArrowRight } from "@/components/icons";
import BuscadorProveedores from "./buscador";

export const metadata: Metadata = {
  title: "Proveedores del Estado",
  description:
    "Quién le vende al Estado dominicano: quién más se adjudica, con cuántas instituciones trabaja y qué dice de cada empresa el Registro de Proveedores del Estado.",
};

export const revalidate = 1800;

/** Cuántos proveedores se enriquecen con su ficha de registro. */
const CABEZA = 10;

/*
  Las dos vistas del mercado (por monto y por número de contratos) y los
  indicadores leen el mismo barrido. `cache` garantiza una sola lectura por
  render aunque las secciones se rendericen por separado dentro de sus
  `Suspense`.
*/
const mercado = cache(() => muestrearProveedores().catch(() => null));
const censo = cache(() => contarProveedoresRegistrados());

const AYUDA =
  "Un número —RNC, cédula o RPE— busca en el registro completo de proveedores del Estado. " +
  "Un nombre solo se puede buscar entre quienes ganaron contratos en las últimas semanas: " +
  "el origen no permite consultar el registro por razón social.";

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const consulta = (params.q ?? "").slice(0, 120).trim();

  return (
    <div className="space-y-5">
      {/* La cabecera no espera a nadie: pinta con la navegación. */}
      <section className="relative overflow-hidden rounded-lg bg-ink text-canvas">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div className="relative p-6 sm:p-8">
          <div className="rotulo inline-flex items-start gap-2 text-canvas/70">
            <span
              aria-hidden
              className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-sello-400"
            />
            Registro de Proveedores del Estado · DGCP
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-3xl leading-[1.1] sm:text-4xl">
            ¿Quién le vende al Estado?
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-canvas/70">
            Las empresas y personas inscritas para venderle al Estado son
            decenas de miles. Las que de verdad se están adjudicando contratos
            ahora mismo son muchas menos, y son estas. Cada una enlaza a su
            historial completo y a lo que el registro dice de ella.
          </p>
        </div>
      </section>

      <Suspense fallback={<TiraEsqueleto />}>
        <Indicadores />
      </Suspense>

      <BuscadorProveedores inicial={consulta} ayuda={AYUDA} />

      {consulta ? (
        <Suspense key={consulta} fallback={<ResultadosEsqueleto consulta={consulta} />}>
          <Resultados q={consulta} />
        </Suspense>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Suspense fallback={<Esqueleto className="h-[30rem]" />}>
              <RankingPorMonto />
            </Suspense>
            <Suspense fallback={<Esqueleto className="h-[30rem]" />}>
              <RankingPorContratos />
            </Suspense>
          </div>

          <Suspense fallback={<Esqueleto className="h-96" />}>
            <QuienesSon />
          </Suspense>
        </>
      )}

      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Fuente: API de datos abiertos de la DGCP —registro de contratos y
        Registro de Proveedores del Estado—. El ranking se calcula sobre la
        ventana de contratos más recientes que el origen deja leer: no es todo
        el histórico y no puede serlo, porque la API sirve los contratos por
        recencia y no admite filtro por fecha. Los montos suman solo
        adjudicaciones vigentes, sin canceladas ni rescindidas. Omitimos a
        propósito los teléfonos y correos que el registro publica: esto vigila
        al Estado, no es un directorio comercial.{" "}
        <Link href="/fuentes" className="font-medium text-brand-700 hover:underline">
          Estado y límites de las fuentes
        </Link>
        .
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ indicadores */

/**
 * La tira dice **una sola cosa**: cómo está la ventana de contratos recientes.
 *
 * El censo del RPE estaba aquí y salió: `docs/IDENTIDAD.md` prohíbe mezclar un
 * censo con una muestra en la misma fila de tarjetas, porque invita a dividir
 * una por otra —«solo el 2 % de los inscritos gana algo» sería falso, la
 * ventana ve el 0.8 % de los contratos—. El censo va debajo, en prosa y con su
 * naturaleza dicha, donde nadie lo puede usar de denominador.
 */
async function Indicadores() {
  const [inscritos, m] = await Promise.all([censo(), mercado()]);

  if (!m || m.proveedores.length === 0) {
    return <SinVentana inscritos={inscritos} caida={!m} />;
  }

  const adjudicaciones = m.proveedores.reduce((s, p) => s + p.contratos, 0);
  const cabeza = m.proveedores.slice(0, CABEZA).reduce((s, p) => s + p.monto, 0);
  const concentracion = m.montoTotal > 0 ? (cabeza / m.montoTotal) * 100 : null;
  const ancla: Ancla = {
    alcance: "muestra",
    escaneados: m.escaneados,
    universo: m.totalRegistro,
  };

  return (
    <div className="space-y-3">
      <Rotulo tono="text-alerta-700">
        Muestra · {formatInt(m.escaneados)} de {formatInt(m.totalRegistro)} contratos
        {m.desde && m.hasta && (
          <>
            {" "}
            · {formatFecha(m.desde)} — {formatFecha(m.hasta)}
          </>
        )}
      </Rotulo>

      <TiraDeCifras>
        <Cifra
          etiqueta="Proveedores con contrato"
          valor={formatInt(m.proveedores.length)}
          nota={`distintos ${ventanaTexto(m)}`}
        />
        <Cifra
          etiqueta="Adjudicaciones vigentes"
          valor={formatInt(adjudicaciones)}
          ancla={ancla}
        />
        <Cifra
          etiqueta="Adjudicado entre ellos"
          valor={formatPesos(m.montoTotal)}
          nota="sin canceladas ni rescindidas"
          tono="text-brand-700"
        />
        <Cifra
          etiqueta={`Se llevan los ${CABEZA} mayores`}
          valor={concentracion === null ? "—" : `${concentracion.toFixed(1)} %`}
          nota="del monto de esta ventana"
        />
      </TiraDeCifras>

      <p className="px-1 text-xs leading-relaxed text-ink-soft">
        Las cuatro cifras describen esa ventana y solo esa ventana. El censo es
        otra cosa y no se divide con ellas: en el Registro de Proveedores del
        Estado hay {inscritos === null ? "decenas de miles de" : formatInt(inscritos)}{" "}
        inscritos, y la inmensa mayoría no gana un contrato en un mes
        cualquiera. Para uno en concreto, búscalo por su RNC o su número de RPE.
      </p>
    </div>
  );
}

/**
 * Sin ventana hay dos historias distintas y la nota dice cuál: que la fuente
 * no contestó, o que contestó y no trae adjudicaciones vigentes.
 */
function SinVentana({
  inscritos,
  caida,
}: {
  inscritos: number | null;
  caida: boolean;
}) {
  return (
    <TiraDeCifras>
      <Cifra
        etiqueta="Inscritos en el RPE"
        valor={inscritos === null ? "—" : formatInt(inscritos)}
        ancla={{ alcance: "registro" }}
        nota="censo del registro completo"
      />
      <Cifra
        etiqueta="Adjudicándose ahora"
        valor="—"
        nota={
          caida
            ? "el registro de contratos no respondió"
            : "la ventana escaneada no trae adjudicaciones vigentes"
        }
      />
    </TiraDeCifras>
  );
}

/* -------------------------------------------------------------- rankings */

async function RankingPorMonto() {
  const m = await mercado();
  if (!m) return <FuenteCaida titulo="Los que más se adjudican" />;

  const top = m.proveedores.slice(0, 20);
  const max = Math.max(1, ...top.map((p) => p.monto));

  return (
    <Hoja>
      <CabeceraHoja
        rotulo="Por monto adjudicado"
        titulo="Los que más se adjudican"
        derecha={`${top.length} de ${formatInt(m.proveedores.length)}`}
      />
      <ol className="divide-y divide-hairline">
        {top.map((p, i) => (
          <li key={p.rpe} className="cv-auto px-5 py-3" style={{ "--cv-alto": "5rem" } as React.CSSProperties}>
            <div className="flex items-baseline gap-2.5">
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-ink-soft">
                {i + 1}
              </span>
              <Link
                href={`/proveedores/${p.rpe}`}
                className="line-clamp-1 min-w-0 flex-1 text-sm font-medium text-brand-700 hover:underline"
              >
                {p.razonSocial}
              </Link>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                {formatMonto(p.monto, "DOP")}
              </span>
            </div>
            <div className="ml-[1.875rem] mt-1 h-1.5 rounded-sm bg-hairline">
              <div
                className="bar-grow h-1.5 rounded-sm bg-brand-500"
                style={{ width: `${Math.max(2, (p.monto / max) * 100)}%` }}
              />
            </div>
            <p className="ml-[1.875rem] mt-1 text-xs text-ink-soft">
              {p.contratos} {p.contratos === 1 ? "contrato" : "contratos"}
              <Sep />
              {p.instituciones}{" "}
              {p.instituciones === 1 ? "institución" : "instituciones"}
              {p.ultima && (
                <>
                  <Sep />
                  <span className="tabular-nums">{hace(p.ultima) ?? formatFecha(p.ultima)}</span>
                </>
              )}
            </p>
          </li>
        ))}
      </ol>
    </Hoja>
  );
}

async function RankingPorContratos() {
  const m = await mercado();
  if (!m) return <FuenteCaida titulo="Los que más contratos ganan" />;

  const top = [...m.proveedores]
    .sort((a, b) => b.contratos - a.contratos || b.monto - a.monto)
    .slice(0, 20);
  const max = Math.max(1, ...top.map((p) => p.contratos));

  return (
    <Hoja>
      <CabeceraHoja
        rotulo="Por número de adjudicaciones"
        titulo="Los que más contratos ganan"
        derecha="Otra foto distinta"
      />
      <ol className="divide-y divide-hairline">
        {top.map((p, i) => (
          <li key={p.rpe} className="cv-auto px-5 py-3" style={{ "--cv-alto": "5rem" } as React.CSSProperties}>
            <div className="flex items-baseline gap-2.5">
              <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-ink-soft">
                {i + 1}
              </span>
              <Link
                href={`/proveedores/${p.rpe}`}
                className="line-clamp-1 min-w-0 flex-1 text-sm font-medium text-brand-700 hover:underline"
              >
                {p.razonSocial}
              </Link>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                {formatInt(p.contratos)}
              </span>
            </div>
            <div className="ml-[1.875rem] mt-1 h-1.5 rounded-sm bg-hairline">
              <div
                className="bar-grow h-1.5 rounded-sm bg-brand-400"
                style={{ width: `${Math.max(2, (p.contratos / max) * 100)}%` }}
              />
            </div>
            <p className="ml-[1.875rem] mt-1 text-xs text-ink-soft">
              {formatMonto(p.monto, "DOP")}
              <Sep />
              {p.instituciones}{" "}
              {p.instituciones === 1 ? "institución" : "instituciones"}
              <Sep />
              {formatMonto(Math.round(p.monto / p.contratos), "DOP")} de promedio
            </p>
          </li>
        ))}
      </ol>
    </Hoja>
  );
}

/* ---------------------------------------------------- quiénes son de veras */

/**
 * El ranking dice cuánto; esta sección dice quién. Son consultas al registro,
 * una por proveedor y en oleadas, así que llega después: la página ya se lee
 * sin ella.
 */
async function QuienesSon() {
  const m = await mercado();
  if (!m || m.proveedores.length === 0) return null;

  const cabeza = m.proveedores.slice(0, CABEZA);
  const fichas = await registrosDeProveedores(cabeza.map((p) => p.rpe));
  if (fichas.size === 0) return null;

  const conFicha = cabeza.filter((p) => fichas.has(p.rpe));
  const mipymes = conFicha.filter((p) => fichas.get(p.rpe)?.esMipyme).length;
  const inactivos = conFicha.filter(
    (p) => (fichas.get(p.rpe)?.estado ?? "Activo") !== "Activo",
  ).length;

  return (
    <Hoja>
      <CabeceraHoja
        rotulo="Ficha de registro"
        titulo={`Quiénes son los ${CABEZA} mayores`}
        derecha={`${conFicha.length} con ficha en el RPE`}
      />
      <ul className="divide-y divide-hairline">
        {conFicha.map((p) => {
          const f = fichas.get(p.rpe)!;
          const domicilio = titulizar(
            [...new Set([f.municipio, f.provincia].filter((x): x is string => Boolean(x)))].join(
              ", ",
            ),
          );
          return (
            <li
              key={p.rpe}
              className="cv-auto px-5 py-3.5"
              style={{ "--cv-alto": "7rem" } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link
                  href={`/proveedores/${p.rpe}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {f.razonSocial}
                </Link>
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {formatMonto(p.monto, "DOP")}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Marca tono="neutro">
                  {f.tipoDocumento} {f.numeroDocumento || "—"}
                </Marca>
                {f.estado === "Activo" ? (
                  <Marca tono="valido">Activo en el RPE</Marca>
                ) : (
                  <Marca tono="alerta">{f.estado} en el RPE</Marca>
                )}
                {f.esMipyme && <Marca tono="firma">MIPYME</Marca>}
                {f.productorNacional && <Marca tono="firma">Productor nacional</Marca>}
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                {f.formaJuridica || f.tipoPersona}
                {domicilio && (
                  <>
                    <Sep />
                    {domicilio}
                  </>
                )}
                {f.fechaCreacion && (
                  <>
                    <Sep />
                    constituida {hace(f.fechaCreacion) ?? formatFecha(f.fechaCreacion)}
                  </>
                )}
                {f.fechaRegistroRpe && (
                  <>
                    <Sep />
                    inscrita {hace(f.fechaRegistroRpe) ?? formatFecha(f.fechaRegistroRpe)}
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-hairline px-5 py-3 text-xs leading-relaxed text-ink-soft">
        {mipymes === 0
          ? `Ninguno de los ${conFicha.length} mayores está inscrito como MIPYME.`
          : `${mipymes} de los ${conFicha.length} mayores están inscritos como MIPYME.`}
        {inactivos > 0 &&
          ` ${inactivos} ${inactivos === 1 ? "figura" : "figuran"} hoy con el registro en un estado distinto de activo; el registro publica el estado de ahora, no el que tenía al adjudicarse el contrato.`}{" "}
        El registro dice quién es cada empresa; qué se le adjudicó lo dicen los
        contratos, y están en su ficha.
      </p>
    </Hoja>
  );
}

/* -------------------------------------------------------------- búsqueda */

async function Resultados({ q }: { q: string }) {
  // El barrido que la página ya está leyendo se pasa hecho: si no, se
  // recorrerían y agregarían seis mil contratos dos veces por render.
  const r = await buscarProveedores(q, mercado());

  const sinNada = !r.registro && r.coincidencias.length === 0;

  return (
    <div className="space-y-4">
      {r.registro && <FichaEncontrada r={r} registro={r.registro} />}

      {r.coincidencias.length > 0 && (
        <Hoja>
          <CabeceraHoja
            rotulo={`Coincidencias con «${r.consulta}»`}
            titulo="Proveedores con contrato reciente"
            derecha={
              r.totalCoincidencias > r.coincidencias.length
                ? `${r.coincidencias.length} de ${formatInt(r.totalCoincidencias)}`
                : formatInt(r.totalCoincidencias)
            }
          />
          <ul className="divide-y divide-hairline">
            {r.coincidencias.map((p) => (
              <FilaCoincidencia key={p.rpe} p={p} />
            ))}
          </ul>
        </Hoja>
      )}

      {/*
        Cuatro desenlaces distintos, y ninguno puede hacerse pasar por otro: el
        registro caído, la ventana caída, la consulta demasiado corta para
        buscarla, y no haber encontrado nada de verdad.
      */}
      {sinNada &&
        (r.registroCaido ? (
          <RegistroCaido />
        ) : r.consultaCorta ? (
          <ConsultaCorta r={r} />
        ) : r.ventanaCaida && r.via === "nombre" ? (
          <VentanaCaida />
        ) : (
          <SinResultados r={r} />
        ))}

      {r.via === "nombre" && !r.ventanaCaida && !r.consultaCorta && (
        <p className="px-1 text-xs leading-relaxed text-ink-soft">
          Buscado entre los {formatInt(r.proveedoresEnVentana)} proveedores con
          contrato en una muestra de {formatInt(r.contratosEscaneados)} de{" "}
          {formatInt(r.contratosEnRegistro)} contratos
          {r.desde && r.hasta && (
            <>
              {" "}
              ({formatFecha(r.desde)} — {formatFecha(r.hasta)})
            </>
          )}
          . El registro de la DGCP no admite búsqueda por razón social ni se
          puede recorrer entero, así que un proveedor que no haya ganado nada
          últimamente no aparece aquí: búscalo por su RNC o su número de RPE y
          verás su ficha completa.
        </p>
      )}
    </div>
  );
}

function FichaEncontrada({
  r,
  registro,
}: {
  r: ResultadoProveedores;
  registro: ProveedorRegistro;
}) {
  const domicilio = titulizar(
    [
      ...new Set(
        [registro.municipio, registro.provincia].filter((x): x is string => Boolean(x)),
      ),
    ].join(", "),
  );

  return (
    <Hoja acento="border-t-v-compras">
      <CabeceraHoja
        rotulo={
          r.via === "documento"
            ? `Encontrado por ${registro.tipoDocumento}`
            : "Encontrado por número de RPE"
        }
        titulo="En el Registro de Proveedores del Estado"
        derecha={`RPE ${registro.rpe}`}
      />
      <div className="px-5 py-4">
        <h2 className="font-display text-2xl leading-tight text-ink">
          {registro.razonSocial}
        </h2>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Marca tono="neutro">
            {registro.tipoDocumento} {registro.numeroDocumento || "—"}
          </Marca>
          {registro.estado === "Activo" ? (
            <Marca tono="valido">Activo en el RPE</Marca>
          ) : (
            <Marca tono="alerta">{registro.estado} en el RPE</Marca>
          )}
          {registro.esMipyme && <Marca tono="firma">MIPYME</Marca>}
          {registro.certificacionMicm && <Marca tono="firma">Certificación MICM</Marca>}
          {registro.productorNacional && <Marca tono="firma">Productor nacional</Marca>}
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
          {registro.formaJuridica || registro.tipoPersona}
          {domicilio && (
            <>
              <Sep />
              {domicilio}
            </>
          )}
          {registro.fechaCreacion && (
            <>
              <Sep />
              constituida {hace(registro.fechaCreacion) ?? formatFecha(registro.fechaCreacion)}
            </>
          )}
          {registro.fechaRegistroRpe && (
            <>
              <Sep />
              inscrita como proveedora{" "}
              {hace(registro.fechaRegistroRpe) ?? formatFecha(registro.fechaRegistroRpe)}
            </>
          )}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-ink">
          {r.enVentana ? (
            <>
              En la ventana de contratos recientes se le adjudicaron{" "}
              <span className="font-mono font-semibold tabular-nums">
                {formatMonto(r.enVentana.monto, "DOP")}
              </span>{" "}
              en {r.enVentana.contratos}{" "}
              {r.enVentana.contratos === 1 ? "contrato" : "contratos"} de{" "}
              {r.enVentana.instituciones}{" "}
              {r.enVentana.instituciones === 1 ? "institución" : "instituciones"}.
            </>
          ) : (
            <span className="text-ink-soft">
              No aparece en la ventana de contratos más recientes. Eso no
              significa que no tenga historial: su ficha lee todos sus contratos,
              que sí se pueden consultar por proveedor.
            </span>
          )}
        </p>

        <Link href={`/proveedores/${registro.rpe}`} className="mt-4 inline-block">
          <Accion>
            Ver su historial completo
            <IconArrowRight className="h-4 w-4" />
          </Accion>
        </Link>
      </div>
    </Hoja>
  );
}

function FilaCoincidencia({ p }: { p: ProveedorEnMercado }) {
  return (
    <li className="cv-auto px-5 py-3" style={{ "--cv-alto": "4.5rem" } as React.CSSProperties}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Link
          href={`/proveedores/${p.rpe}`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          {p.razonSocial}
        </Link>
        <span className="font-mono text-sm font-semibold tabular-nums text-ink">
          {formatMonto(p.monto, "DOP")}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink-soft">
        <span className="font-mono tabular-nums">RPE {p.rpe}</span>
        <Sep />
        {p.contratos} {p.contratos === 1 ? "contrato" : "contratos"}
        <Sep />
        {p.instituciones} {p.instituciones === 1 ? "institución" : "instituciones"}
        {p.ultima && (
          <>
            <Sep />
            {hace(p.ultima) ?? formatFecha(p.ultima)}
          </>
        )}
      </p>
    </li>
  );
}

/* ---------------------------------------------------------------- vacíos */

/**
 * «No hay resultados» y «la fuente no contestó» son dos pantallas distintas:
 * la segunda dice qué pasó y qué sigue en pie.
 */
function SinResultados({ r }: { r: ResultadoProveedores }) {
  return (
    <Hoja>
      <div className="px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          Nada encontrado para «{r.consulta}»
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
          {r.via === "nombre" ? (
            <>
              Ningún proveedor con contrato reciente se llama así. La búsqueda
              por nombre solo alcanza la ventana de contratos escaneada: si
              sabes su RNC o su número de RPE, ese sí consulta el registro
              entero.
            </>
          ) : (
            <>
              No hay ningún proveedor inscrito con ese número, ni como RPE ni
              como RNC o cédula. El registro guarda las cédulas con once dígitos
              y los RNC con nueve; se prueban ambos formatos.
            </>
          )}
        </p>
      </div>
    </Hoja>
  );
}

/**
 * El registro no contestó. Decir aquí «no está inscrito» sería afirmar una
 * falsedad sobre un registro del Estado, justo en el camino que la página
 * presenta como el autoritativo.
 */
function RegistroCaido() {
  return (
    <Hoja>
      <div className="px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          El Registro de Proveedores del Estado no respondió
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
          No podemos decir si ese número está inscrito o no: la consulta al
          registro de la DGCP falló. Vuelve en unos minutos, o mira{" "}
          <Link href="/proveedores" className="font-medium text-brand-700 hover:underline">
            quiénes se están adjudicando contratos
          </Link>
          .
        </p>
      </div>
    </Hoja>
  );
}

/** No se buscó nada: decirlo, en vez de reportar cero coincidencias. */
function ConsultaCorta({ r }: { r: ResultadoProveedores }) {
  return (
    <Hoja>
      <div className="px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          «{r.consulta}» es demasiado corto para buscarlo
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
          Una búsqueda por nombre necesita al menos tres letras: con dos
          coincidiría media plataforma. Si lo que tienes es un RNC, una cédula o
          un número de RPE, escríbelo completo — ese camino sí consulta el
          registro entero.
        </p>
      </div>
    </Hoja>
  );
}

function VentanaCaida() {
  return (
    <Hoja>
      <div className="px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          El registro de contratos no respondió
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
          La búsqueda por nombre necesita esa ventana y ahora mismo la API de la
          DGCP no la sirve. La búsqueda por RNC, cédula o número de RPE sí sigue
          en pie: usa cualquiera de esos y verás la ficha del registro.
        </p>
      </div>
    </Hoja>
  );
}

function FuenteCaida({ titulo }: { titulo: string }) {
  return (
    <Hoja>
      <CabeceraHoja titulo={titulo} />
      <div className="px-5 py-14 text-center">
        <p className="text-sm font-medium text-ink">
          El registro de contratos no respondió
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
          La API de la DGCP está caída o no devolvió datos. La búsqueda por RNC
          o número de RPE sigue funcionando; vuelve en unos minutos para el
          ranking.
        </p>
      </div>
    </Hoja>
  );
}

/* --------------------------------------------------------------- piezas */

function Sep() {
  return (
    <span aria-hidden className="px-1.5 text-hairline">
      ·
    </span>
  );
}

function ventanaTexto(m: { desde: string | null; hasta: string | null }): string {
  if (!m.desde || !m.hasta) return "en la ventana escaneada";
  const dias = Math.max(
    1,
    Math.round((new Date(m.hasta).getTime() - new Date(m.desde).getTime()) / 86_400_000),
  );
  return `en los últimos ${dias} días del registro`;
}

function TiraEsqueleto() {
  return (
    <Cargando>
      <TiraDeCifras>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="shimmer h-3 w-24 rounded-md bg-hairline/70" />
            <div className="shimmer h-6 w-28 rounded-md bg-hairline/70" />
            <div className="shimmer h-2.5 w-32 rounded-md bg-hairline/70" />
          </div>
        ))}
      </TiraDeCifras>
    </Cargando>
  );
}

function ResultadosEsqueleto({ consulta }: { consulta: string }) {
  return (
    <Cargando>
      <p className="text-sm text-ink-soft">Buscando «{consulta}»…</p>
      <EsqueletoFilas n={6} className="mt-3" />
    </Cargando>
  );
}
