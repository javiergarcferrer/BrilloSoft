import Link from "next/link";
import { dgcpFetch, type Proceso } from "@/lib/dgcp";
import { formatMonto } from "@/lib/format";
import { estadoMeta } from "@/lib/estados";
import { IconArrowRight, IconChartBar } from "@/components/icons";

export const revalidate = 1800;

export const metadata = {
  title: "Estadísticas del mercado",
  description:
    "Panorama de los procesos de compras públicas de los últimos 30 días en República Dominicana.",
};

function hace(dias: number): string {
  return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
}

interface Agregado {
  n: number;
  monto: number;
}

function agrupar(lista: Proceso[], clave: (p: Proceso) => string): [string, Agregado][] {
  const m = new Map<string, Agregado>();
  for (const p of lista) {
    const k = clave(p) || "—";
    const a = m.get(k) ?? { n: 0, monto: 0 };
    a.n += 1;
    a.monto += p.monto_estimado || 0;
    m.set(k, a);
  }
  return [...m.entries()].sort((a, b) => b[1].monto - a[1].monto);
}

export default async function EstadisticasPage() {
  const data = await dgcpFetch<Proceso>(
    "/procesos",
    { startdate: hace(30), limit: 1000 },
    1800
  );
  const lista = data.payload.content;
  const total = data.totalResults ?? lista.length;
  const abiertos = lista.filter((p) => p.estado_proceso === "Proceso publicado");
  const montoTotal = lista.reduce((s, p) => s + (p.monto_estimado || 0), 0);
  const mipymes = lista.filter((p) => p.dirigido_mipymes === "Si").length;

  const porModalidad = agrupar(lista, (p) => p.modalidad);
  const porInstitucion = agrupar(lista, (p) => p.unidad_compra).slice(0, 10);
  const porEstado = [...agrupar(lista, (p) => p.estado_proceso)].sort(
    (a, b) => b[1].n - a[1].n
  );
  const maxInst = porInstitucion[0]?.[1].monto || 1;
  const maxMod = porModalidad[0]?.[1].monto || 1;
  const totalN = lista.length || 1;

  const kpis = [
    { etiqueta: "Procesos publicados", valor: total.toLocaleString("es-DO") },
    { etiqueta: "Abiertos para ofertar", valor: abiertos.length.toLocaleString("es-DO"), destacar: true },
    { etiqueta: "Monto estimado (muestra)", valor: formatMonto(montoTotal, "DOP") },
    { etiqueta: "Dirigidos a MIPYMES", valor: mipymes.toLocaleString("es-DO") },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink text-white">
        <div className="absolute inset-0 app-grid-dark" aria-hidden />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
          aria-hidden
        />
        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15">
            <IconChartBar className="h-3.5 w-3.5" />
            Últimos 30 días · se actualiza cada 30 min
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            El mercado de compras públicas
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-hairline">
            Basado en los {lista.length.toLocaleString("es-DO")} procesos más recientes
            {total > lista.length
              ? ` de ${total.toLocaleString("es-DO")} publicados en el período`
              : ""}
            .
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <div
                key={k.etiqueta}
                className={`rounded-xl p-4 ring-1 ${
                  k.destacar
                    ? "bg-brand-500/15 ring-brand-400/30"
                    : "bg-white/5 ring-white/10"
                }`}
              >
                <div className="text-lg font-bold leading-tight sm:text-xl">{k.valor}</div>
                <div
                  className={`mt-0.5 text-xs ${
                    k.destacar ? "text-brand-100" : "text-ink-soft"
                  }`}
                >
                  {k.etiqueta}
                </div>
              </div>
            ))}
          </div>

          {/* Distribución por estado */}
          <div className="mt-6">
            <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-white/10">
              {porEstado.map(([e, a]) => (
                <div
                  key={e}
                  className={estadoMeta(e).dot}
                  style={{ width: `${(a.n / totalN) * 100}%` }}
                  title={`${e}: ${a.n}`}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {porEstado.map(([e, a]) => (
                <span key={e} className="inline-flex items-center gap-1.5 text-xs text-hairline">
                  <span className={`h-2 w-2 rounded-full ${estadoMeta(e).dot}`} />
                  {e}
                  <span className="font-semibold text-white">{a.n}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
          <h2 className="font-semibold">Por modalidad</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {porModalidad.map(([nombre, a]) => (
              <li key={nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{nombre}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-hairline">
                  <div
                    className="bar-grow h-2 rounded-full bg-brand-500"
                    style={{ width: `${Math.max(2, (a.monto / maxMod) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
          <h2 className="font-semibold">Top 10 instituciones por monto</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {porInstitucion.map(([nombre, a]) => (
              <li key={nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="line-clamp-1 font-medium">{nombre}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-hairline">
                  <div
                    className="bar-grow h-2 rounded-full bg-brand-400"
                    style={{ width: `${Math.max(2, (a.monto / maxInst) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="flex flex-col items-start gap-3 rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-brand-900">
          ¿Buscas tu nicho? Usa el buscador con tu palabra clave y suscríbete al RSS de
          esa búsqueda para no perderte procesos nuevos.
        </span>
        <Link
          href="/licitaciones"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-95"
        >
          Ir al buscador
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
