import Link from "next/link";
import { notFound } from "next/navigation";
import { getProceso, normalize, type Documento } from "@/lib/dgcp";
import { diasHasta, formatFecha, formatMonto } from "@/lib/format";
import PreciosHistoricos from "./precios";
import Compartir from "@/components/compartir";

const DOC_CLAVE =
  /pliego|ficha tecnica|especificacion|termino de referencia|tdr|condiciones/;

function esDocClave(d: Documento): boolean {
  return DOC_CLAVE.test(normalize(`${d.tipo_documento} ${d.nombre_documento}`));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const limpio = decodeURIComponent(codigo);
  try {
    const { proceso: p } = await getProceso(limpio);
    if (p) {
      return {
        title: p.titulo || limpio,
        description: `${p.unidad_compra} · ${p.modalidad} · ${p.estado_proceso} · cierre de ofertas ${p.fecha_fin_recepcion_ofertas?.slice(0, 10) ?? "n/d"}`,
      };
    }
  } catch {
    /* metadata best-effort */
  }
  return { title: limpio };
}

export default async function ProcesoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const { proceso: p, articulos, documentos, contratos } = await getProceso(
    decodeURIComponent(codigo)
  );
  if (!p) notFound();

  const subclasesUnicas = Array.from(
    new Map(
      articulos
        .filter((a) => a.subclase_unspsc)
        .map((a) => [
          a.subclase_unspsc,
          { codigo: a.subclase_unspsc, descripcion: a.descripcion_articulo },
        ])
    ).values()
  ).slice(0, 4);

  const dias = diasHasta(p.fecha_fin_recepcion_ofertas);
  const abiertoParaOfertar = p.estado_proceso === "Proceso publicado" && dias !== null && dias >= 0;
  const docsClave = documentos.filter(esDocClave);
  const docsOtros = documentos.filter((d) => !esDocClave(d));
  const totalArticulos = articulos.reduce(
    (s, a) => s + (a.precio_total_estimado || 0),
    0
  );
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Volver al buscador
        </Link>
        <Compartir titulo={p.titulo} />
      </div>

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
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
        <p className="mt-1 text-slate-600">
          {p.unidad_compra}{" "}
          <Link
            href={`/?uc=${p.codigo_unidad_compra}`}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            · ver todos sus procesos →
          </Link>
        </p>
        <p className="mt-1 font-mono text-sm text-slate-400">{p.codigo_proceso}</p>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Monto estimado
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatMonto(p.monto_estimado, p.divisa)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Recibe ofertas hasta
            </div>
            <div
              className={`text-2xl font-bold ${
                abiertoParaOfertar && dias !== null && dias <= 2
                  ? "text-red-600"
                  : "text-slate-900"
              }`}
            >
              {formatFecha(p.fecha_fin_recepcion_ofertas, true)}
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

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Cómo participar</h2>
          <Link href="/guia" className="text-xs font-medium text-emerald-700 hover:underline">
            ¿Primera vez ofertando? Lee la guía completa →
          </Link>
        </div>
        {abiertoParaOfertar ? (
          <ol className="mt-4 space-y-3">
            <Paso n={1} titulo="Lee los documentos clave del proceso">
              {docsClave.length > 0 ? (
                <span>
                  Empieza por el pliego de condiciones y la ficha técnica: ahí están los
                  requisitos exactos, las garantías exigidas y los criterios de
                  evaluación.{" "}
                  <a href="#documentos" className="font-medium text-emerald-700 hover:underline">
                    Ver los {docsClave.length} documentos clave ↓
                  </a>
                </span>
              ) : (
                <span>
                  Este proceso aún no tiene documentos cargados en la API; revísalos
                  directamente en el Portal Transaccional con el botón de arriba.
                </span>
              )}
            </Paso>
            <Paso n={2} titulo="Verifica tu Registro de Proveedores del Estado (RPE)">
              Para ofertar necesitas RPE activo, con el rubro de este proceso y tus
              obligaciones fiscales (DGII/TSS) al día. Si no lo tienes,{" "}
              <a
                href="https://www.dgcp.gob.do/servicios/registro-de-proveedores/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-700 hover:underline"
              >
                inscríbete aquí en la DGCP ↗
              </a>{" "}
              cuanto antes — el trámite toma días, no horas.
            </Paso>
            <Paso n={3} titulo="Prepara tu oferta">
              Documentos legales y credenciales según el pliego, oferta técnica conforme
              a la ficha, y oferta económica
              {totalArticulos > 0 ? (
                <> (referencia: el presupuesto estimado de los artículos suma{" "}
                  <strong>{formatMonto(totalArticulos, p.divisa)}</strong>)</>
              ) : (
                <> (referencia: monto estimado {formatMonto(p.monto_estimado, p.divisa)})</>
              )}
              . Revisa si el pliego exige garantía de seriedad de la oferta.
            </Paso>
            <Paso n={4} titulo={`Presenta tu oferta antes del cierre`}>
              Fecha límite:{" "}
              <strong>{formatFecha(p.fecha_fin_recepcion_ofertas, true)}</strong>
              {dias !== null && (
                <> ({dias === 0 ? "cierra hoy" : `faltan ${dias} días`})</>
              )}
              . Se presenta en línea en el{" "}
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Portal Transaccional ↗
                </a>
              ) : (
                "Portal Transaccional"
              )}
              .
            </Paso>
          </ol>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Este proceso ya no acepta ofertas nuevas (estado:{" "}
            <strong>{p.estado_proceso}</strong>
            {dias !== null && dias < 0 ? ", la recepción cerró" : ""}). Puedes revisar
            los documentos y resultados para preparar tu próxima participación, o usar
            el buscador para encontrar procesos similares abiertos.
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
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

        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
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

      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
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
              {totalArticulos > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={4} className="py-2 pr-3 text-right font-semibold">
                      Total estimado de artículos
                    </td>
                    <td className="py-2 text-right font-bold">
                      {formatMonto(totalArticulos, p.divisa)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>

      {contratos.length > 0 && (
        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
          <h2 className="font-semibold">
            Adjudicación — quién ganó{" "}
            <span className="font-normal text-slate-400">({contratos.length})</span>
          </h2>
          <ul className="mt-3 space-y-2">
            {contratos.map((c, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/proveedores/${encodeURIComponent(c.rpe)}`}
                    className="font-semibold hover:text-emerald-700 hover:underline"
                  >
                    {c.razon_social}
                  </Link>
                  <div className="text-xs text-slate-500">
                    RPE {c.rpe} · adjudicado {formatFecha(c.fecha_adjudicacion)} ·{" "}
                    {c.estado_contrato} ·{" "}
                    <Link
                      href={`/proveedores/${encodeURIComponent(c.rpe)}`}
                      className="text-emerald-700 hover:underline"
                    >
                      historial del proveedor →
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">
                    {formatMonto(c.valor_contratado, c.divisa || p.divisa)}
                  </span>
                  {c.url_contrato && (
                    <a
                      href={c.url_contrato}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-hairline px-2.5 py-1 text-xs font-medium hover:border-emerald-500 hover:text-emerald-700"
                    >
                      Ver contrato ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PreciosHistoricos subclases={subclasesUnicas} divisa={p.divisa} />

      <section
        id="documentos"
        className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline"
      >
        <h2 className="font-semibold">
          Documentos del proceso{" "}
          <span className="font-normal text-slate-400">({documentos.length})</span>
        </h2>
        {documentos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            La API no reporta documentos para este proceso.
          </p>
        ) : (
          <>
            {docsClave.length > 0 && (
              <>
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Empieza por aquí — pliego, fichas y condiciones
                </h3>
                <ul className="mt-2 grid gap-2 md:grid-cols-2">
                  {docsClave.map((d, i) => (
                    <DocumentoItem key={`k${i}`} d={d} clave />
                  ))}
                </ul>
              </>
            )}
            {docsOtros.length > 0 && (
              <>
                {docsClave.length > 0 && (
                  <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Otros documentos
                  </h3>
                )}
                <ul className="mt-2 grid gap-2 md:grid-cols-2">
                  {docsOtros.map((d, i) => (
                    <DocumentoItem key={`o${i}`} d={d} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Paso({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
        {n}
      </span>
      <div className="text-sm">
        <div className="font-semibold">{titulo}</div>
        <div className="mt-0.5 text-slate-600">{children}</div>
      </div>
    </li>
  );
}

function DocumentoItem({ d, clave = false }: { d: Documento; clave?: boolean }) {
  return (
    <li>
      <a
        href={d.url_documento}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
          clave
            ? "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50"
            : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
        }`}
      >
        <span aria-hidden>{clave ? "⭐" : "📄"}</span>
        <span>
          <span className="block font-medium leading-snug">{d.nombre_documento}</span>
          <span className="block text-xs text-slate-500">
            {d.tipo_documento} · {formatFecha(d.fecha_carga_archivo)}
          </span>
        </span>
      </a>
    </li>
  );
}
