import Link from "next/link";
import { notFound } from "next/navigation";
import { getHistorialProveedor, getProveedorRegistro } from "@/lib/dgcp";
import { titulizar } from "@/lib/capitulos";
import { formatFecha, formatMonto } from "@/lib/format";
import { IconArrowLeft } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rpe: string }>;
}) {
  const { rpe } = await params;
  return { title: `Proveedor RPE ${rpe}` };
}

export default async function ProveedorPage({
  params,
}: {
  params: Promise<{ rpe: string }>;
}) {
  const { rpe } = await params;
  if (!/^\d{1,10}$/.test(rpe)) notFound();

  const [historial, registro] = await Promise.all([
    getHistorialProveedor(rpe),
    getProveedorRegistro(rpe),
  ]);
  if (!historial) notFound();

  const contratos = historial.contratos;
  const nombre = registro?.razonSocial ?? historial.razonSocial;
  const total = historial.totalRegistro;
  const suma = historial.montoTotal;

  const porInstitucion = new Map<string, { n: number; monto: number }>();
  for (const c of contratos) {
    const a = porInstitucion.get(c.unidad_compra) ?? { n: 0, monto: 0 };
    a.n += 1;
    a.monto += c.valor_contratado || 0;
    porInstitucion.set(c.unidad_compra, a);
  }
  const topInstituciones = [...porInstitucion.entries()]
    .sort((a, b) => b[1].monto - a[1].monto)
    .slice(0, 8);

  const maxAnio = Math.max(1, ...historial.porAnio.map((a) => a.monto));

  // Distancia entre la constitución de la empresa y su primer contrato con el
  // Estado. No acusa a nadie: es el dato que el registro permite comprobar y
  // que hasta ahora había que creerse.
  const primeraAdjudicacion = contratos
    .map((c) => (c.fecha_adjudicacion ?? "").slice(0, 10))
    .filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f))
    .sort()[0];
  const mesesHastaPrimerContrato =
    registro?.fechaCreacion && primeraAdjudicacion
      ? Math.round(
          (new Date(primeraAdjudicacion).getTime() -
            new Date(registro.fechaCreacion).getTime()) /
            (1000 * 60 * 60 * 24 * 30.44),
        )
      : null;

  const recientes = [...contratos]
    .sort(
      (a, b) =>
        new Date(b.fecha_adjudicacion).getTime() -
        new Date(a.fecha_adjudicacion).getTime()
    )
    .slice(0, 25);

  return (
    <div className="space-y-5">
      <Link
        href="/licitaciones"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver al buscador
      </Link>

      <section className="rounded-lg bg-surface p-6 border border-hairline">
        <div className="text-xs uppercase tracking-wide text-ink-soft">
          Proveedor del Estado · RPE {rpe}
        </div>
        <h1 className="mt-1 text-2xl font-semibold leading-tight">{nombre}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-canvas px-4 py-3">
            <div className="text-xs text-ink-soft">Contratos registrados</div>
            <div className="mt-0.5 text-lg font-bold">
              {total.toLocaleString("es-DO")}
            </div>
          </div>
          <div className="rounded-lg bg-ink px-4 py-3 text-canvas">
            <div className="text-xs text-canvas/70">
              Monto total (últimos {contratos.length.toLocaleString("es-DO")})
            </div>
            <div className="mt-0.5 text-lg font-bold">{formatMonto(suma, "DOP")}</div>
          </div>
          <div className="rounded-lg bg-canvas px-4 py-3">
            <div className="text-xs text-ink-soft">Instituciones cliente</div>
            <div className="mt-0.5 text-lg font-bold">
              {porInstitucion.size.toLocaleString("es-DO")}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Fuente: registro público de contratos de la DGCP. Útil para dimensionar a tu
          competencia antes de ofertar. Los montos incluyen todas las
          adjudicaciones; {formatMonto(historial.montoVigente, "DOP")} corresponden
          a contratos vigentes (sin cancelados ni rescindidos).
        </p>
      </section>

      {registro && (
        <section className="rounded-lg bg-surface p-6 border border-hairline">
          <h2 className="font-semibold">Ficha de registro</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Lo que el Registro de Proveedores del Estado dice de esta empresa.
          </p>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="rotulo text-ink-soft">{registro.tipoDocumento}</dt>
              <dd className="font-mono font-medium tabular-nums">
                {registro.numeroDocumento || "—"}
              </dd>
            </div>
            <div>
              <dt className="rotulo text-ink-soft">Estado en el RPE</dt>
              <dd className="font-medium">{registro.estado}</dd>
            </div>
            <div>
              <dt className="rotulo text-ink-soft">Forma jurídica</dt>
              <dd>{registro.formaJuridica || registro.tipoPersona}</dd>
            </div>
            {registro.fechaCreacion && (
              <div>
                <dt className="rotulo text-ink-soft">Constituida</dt>
                <dd className="font-mono tabular-nums">
                  {formatFecha(registro.fechaCreacion)}
                </dd>
              </div>
            )}
            {registro.fechaRegistroRpe && (
              <div>
                <dt className="rotulo text-ink-soft">Inscrita como proveedora</dt>
                <dd className="font-mono tabular-nums">
                  {formatFecha(registro.fechaRegistroRpe)}
                </dd>
              </div>
            )}
            {registro.registroMercantil && (
              <div>
                <dt className="rotulo text-ink-soft">Registro mercantil</dt>
                <dd className="font-mono">{registro.registroMercantil}</dd>
              </div>
            )}
            {registro.clasificacion && (
              <div>
                <dt className="rotulo text-ink-soft">Tamaño declarado</dt>
                <dd>{registro.clasificacion}</dd>
              </div>
            )}
            {registro.provee && (
              <div>
                <dt className="rotulo text-ink-soft">Provee</dt>
                <dd>{registro.provee}</dd>
              </div>
            )}
            {(registro.provincia || registro.municipio) && (
              <div>
                <dt className="rotulo text-ink-soft">Domicilio</dt>
                <dd>
                  {titulizar(
                    [
                      ...new Set(
                        [registro.municipio, registro.provincia].filter(
                          (x): x is string => Boolean(x),
                        ),
                      ),
                    ].join(", "),
                  )}
                </dd>
              </div>
            )}
          </dl>

          {(registro.esMipyme || registro.productorNacional ||
            registro.certificacionMicm) && (
            <ul className="mt-4 flex flex-wrap gap-2 text-xs">
              {registro.esMipyme && (
                <li className="rounded-full bg-valido-50 px-2.5 py-1 font-medium text-valido-700">
                  MIPYME
                </li>
              )}
              {registro.certificacionMicm && (
                <li className="rounded-full bg-valido-50 px-2.5 py-1 font-medium text-valido-700">
                  Certificación MICM
                </li>
              )}
              {registro.productorNacional && (
                <li className="rounded-full bg-valido-50 px-2.5 py-1 font-medium text-valido-700">
                  Productor nacional
                </li>
              )}
            </ul>
          )}

          {mesesHastaPrimerContrato !== null && (
            <p className="mt-4 text-sm text-ink-soft">
              Entre su constitución y el primer contrato con el Estado que consta
              en este registro pasaron{" "}
              <span className="font-semibold text-ink">
                {mesesHastaPrimerContrato <= 0
                  ? "menos de un mes"
                  : mesesHastaPrimerContrato < 24
                    ? `${mesesHastaPrimerContrato} ${mesesHastaPrimerContrato === 1 ? "mes" : "meses"}`
                    : `${Math.floor(mesesHastaPrimerContrato / 12)} años`}
              </span>
              . El dato compara la fecha de constitución del registro con la
              adjudicación más antigua que devuelve la API; no significa por sí
              solo nada más que eso.
            </p>
          )}

          <p className="mt-3 text-xs text-ink-soft">
            Fuente: Registro de Proveedores del Estado (DGCP). Omitimos a
            propósito los teléfonos y correos de contacto que el registro
            publica: esto es una herramienta de vigilancia, no un directorio
            comercial.
          </p>
        </section>
      )}

      {historial.porAnio.length > 1 && (
        <section className="rounded-lg bg-surface p-6 border border-hairline">
          <h2 className="font-semibold">Contratos por año</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {historial.porAnio.map((a) => (
              <li key={a.anio}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono font-medium tabular-nums">{a.anio}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-hairline">
                  <div
                    className="bar-grow h-2 rounded-full bg-brand-500"
                    style={{ width: `${Math.max(2, (a.monto / maxAnio) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-lg bg-surface p-6 border border-hairline lg:col-span-2">
          <h2 className="font-semibold">Sus principales clientes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topInstituciones.map(([inst, a]) => (
              <li
                key={inst}
                className="flex items-baseline justify-between gap-2 rounded-lg bg-canvas px-3 py-2"
              >
                <span className="line-clamp-1">{inst}</span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {a.n} · {formatMonto(a.monto, "DOP")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg bg-surface p-6 border border-hairline lg:col-span-3">
          <h2 className="font-semibold">Contratos recientes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recientes.map((c, i) => (
              <li key={i} className="rounded-lg border border-hairline px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="line-clamp-1 font-medium">{c.descripcion}</span>
                  <span className="shrink-0 font-semibold">
                    {formatMonto(c.valor_contratado, c.divisa)}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
                  <span>{c.unidad_compra}</span>
                  <span>· {formatFecha(c.fecha_adjudicacion)}</span>
                  <Link
                    href={`/procesos/${encodeURIComponent(c.codigo_proceso)}`}
                    className="text-brand-600 hover:underline"
                  >
                    ver proceso →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
