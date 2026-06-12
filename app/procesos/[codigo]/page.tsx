import Link from "next/link";
import { notFound } from "next/navigation";
import { getProceso } from "@/lib/dgcp";
import { diasHasta, formatFecha, formatMonto } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return { title: `${decodeURIComponent(codigo)} — Licitaciones RD` };
}

export default async function ProcesoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const { proceso: p, articulos, documentos } = await getProceso(
    decodeURIComponent(codigo)
  );
  if (!p) notFound();

  const dias = diasHasta(p.fecha_fin_recepcion_ofertas);
  const fechas: [string, string, boolean?][] = [
    ["Publicación", p.fecha_publicacion],
    ["Última enmienda", p.fecha_enmienda],
    ["Fin recepción de ofertas", p.fecha_fin_recepcion_ofertas, true],
    ["Apertura de ofertas", p.fecha_apertura_ofertas],
    ["Adjudicación estimada", p.fecha_estimada_adjudicacion],
    ["Suscripción de contrato", p.fecha_suscripcion],
  ];

  const flags: [string, string][] = [
    ["Objeto", `${p.objeto_proceso} · ${p.subobjeto_proceso}`],
    ["Área requiriente", p.area_requiriente],
    ["Duración del contrato", p.duracion_contrato],
    ["Dirigido a MIPYMES", p.dirigido_mipymes],
    ["Dirigido a MIPYMES mujeres", p.dirigido_mipymes_mujeres],
    ["Proceso lotificado", p.proceso_lotificado],
    ["Planificado en PACC", p.adquisicion_planeada],
    ["Compra verde", p.compra_verde],
    ["Proveedores notificados", p.numero_proveedores_notificados],
    ["Tipo de excepción", p.tipo_excepcion],
  ];

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-emerald-700 hover:underline">
        ← Volver al buscador
      </Link>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span
            className={`rounded-full px-2.5 py-1 ${
              p.estado_proceso === "Proceso publicado"
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {p.estado_proceso}
          </span>
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-700">
            {p.modalidad}
          </span>
          {dias !== null && dias >= 0 && p.estado_proceso === "Proceso publicado" && (
            <span
              className={`rounded-full px-2.5 py-1 ${
                dias <= 2
                  ? "bg-red-100 text-red-700"
                  : dias <= 7
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              Cierra en {dias === 0 ? "horas" : `${dias} días`}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-semibold leading-tight">{p.titulo}</h1>
        <p className="mt-1 text-slate-600">{p.unidad_compra}</p>
        <p className="mt-1 font-mono text-sm text-slate-400">{p.codigo_proceso}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Monto estimado
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatMonto(p.monto_estimado, p.divisa)}
            </div>
          </div>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Ver en el Portal Transaccional ↗
            </a>
          )}
        </div>

        {p.descripcion && p.descripcion.trim() !== p.titulo.trim() && (
          <p className="mt-4 whitespace-pre-line text-sm text-slate-700">
            {p.descripcion}
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold">Cronograma</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {fechas.map(([label, iso, destacar]) => (
              <li
                key={label}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                  destacar ? "bg-amber-50 font-medium" : "bg-slate-50"
                }`}
              >
                <span className="text-slate-600">{label}</span>
                <span>{formatFecha(iso, true)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold">Información general</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {flags.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
              >
                <dt className="text-slate-600">{label}</dt>
                <dd className="text-right font-medium">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold">
          Artículos solicitados{" "}
          <span className="font-normal text-slate-400">({articulos.length})</span>
        </h2>
        {articulos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            La API no reporta artículos para este proceso.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Descripción</th>
                  <th className="py-2 pr-3">UNSPSC</th>
                  <th className="py-2 pr-3 text-right">Cantidad</th>
                  <th className="py-2 pr-3 text-right">P. unitario</th>
                  <th className="py-2 text-right">Total estimado</th>
                </tr>
              </thead>
              <tbody>
                {articulos.map((a, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{a.descripcion_usuario || a.descripcion_articulo}</div>
                      {a.descripcion_usuario && (
                        <div className="text-xs text-slate-400">{a.descripcion_articulo}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">
                      {a.subclase_unspsc}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {a.cantidad?.toLocaleString("es-DO")} {a.unidad_medida}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatMonto(a.precio_unitario_estimado, p.divisa)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatMonto(a.precio_total_estimado, p.divisa)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold">
          Documentos del proceso{" "}
          <span className="font-normal text-slate-400">({documentos.length})</span>
        </h2>
        {documentos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            La API no reporta documentos para este proceso.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {documentos.map((d, i) => (
              <li key={i}>
                <a
                  href={d.url_documento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:border-emerald-400 hover:bg-emerald-50"
                >
                  <span aria-hidden>📄</span>
                  <span>
                    <span className="block font-medium leading-snug">
                      {d.nombre_documento}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {d.tipo_documento} · {formatFecha(d.fecha_carga_archivo)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
