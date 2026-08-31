import Link from "next/link";
import { notFound } from "next/navigation";
import { getHistorialProveedor } from "@/lib/dgcp";
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

  const historial = await getHistorialProveedor(rpe);
  if (!historial) notFound();

  const contratos = historial.contratos;
  const nombre = historial.razonSocial;
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
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver al buscador
      </Link>

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <div className="text-xs uppercase tracking-wide text-ink-soft">
          Proveedor del Estado · RPE {rpe}
        </div>
        <h1 className="mt-1 text-2xl font-semibold leading-tight">{nombre}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="text-xs text-ink-soft">Contratos registrados</div>
            <div className="mt-0.5 text-lg font-bold">
              {total.toLocaleString("es-DO")}
            </div>
          </div>
          <div className="rounded-lg bg-emerald-600 px-4 py-3 text-white">
            <div className="text-xs text-emerald-100">
              Monto total (últimos {contratos.length.toLocaleString("es-DO")})
            </div>
            <div className="mt-0.5 text-lg font-bold">{formatMonto(suma, "DOP")}</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
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

      {historial.porAnio.length > 1 && (
        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
          <h2 className="font-semibold">Contratos por año</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {historial.porAnio.map((a) => (
              <li key={a.anio}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium tabular-nums">{a.anio}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="bar-grow h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(2, (a.monto / maxAnio) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline lg:col-span-2">
          <h2 className="font-semibold">Sus principales clientes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topInstituciones.map(([inst, a]) => (
              <li
                key={inst}
                className="flex items-baseline justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="line-clamp-1">{inst}</span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {a.n} · {formatMonto(a.monto, "DOP")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline lg:col-span-3">
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
                    className="text-emerald-700 hover:underline"
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
