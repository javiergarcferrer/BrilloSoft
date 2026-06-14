import Link from "next/link";
import { dgcpFetch, type Proceso } from "@/lib/dgcp";
import { formatMonto } from "@/lib/format";

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
  const maxInst = porInstitucion[0]?.[1].monto || 1;
  const maxMod = porModalidad[0]?.[1].monto || 1;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
        <h1 className="text-xl font-semibold">El mercado en los últimos 30 días</h1>
        <p className="mt-1 text-sm text-slate-500">
          Basado en los {lista.length.toLocaleString("es-DO")} procesos más recientes
          {total > lista.length
            ? ` de ${total.toLocaleString("es-DO")} publicados en el período`
            : ""}
          . Se actualiza cada 30 minutos.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cifra etiqueta="Procesos publicados" valor={total.toLocaleString("es-DO")} />
          <Cifra
            etiqueta="Abiertos para ofertar"
            valor={abiertos.length.toLocaleString("es-DO")}
            destacar
          />
          <Cifra
            etiqueta="Monto estimado (muestra)"
            valor={formatMonto(montoTotal, "DOP")}
          />
          <Cifra
            etiqueta="Dirigidos a MIPYMES"
            valor={mipymes.toLocaleString("es-DO")}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
          <h2 className="font-semibold">Por modalidad</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {porModalidad.map(([nombre, a]) => (
              <li key={nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{nombre}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="bar-grow h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(2, (a.monto / maxMod) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
          <h2 className="font-semibold">Top 10 instituciones por monto</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {porInstitucion.map(([nombre, a]) => (
              <li key={nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="line-clamp-1 font-medium">{nombre}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="bar-grow h-2 rounded-full bg-sky-500"
                    style={{ width: `${Math.max(2, (a.monto / maxInst) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl bg-emerald-50 p-5 text-sm ring-1 ring-emerald-200">
        <span className="text-emerald-900">
          ¿Buscas tu nicho? Usa el buscador con tu palabra clave y suscríbete al RSS de
          esa búsqueda para no perderte procesos nuevos.
        </span>{" "}
        <Link href="/" className="font-semibold text-emerald-700 hover:underline">
          Ir al buscador →
        </Link>
      </section>
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  destacar = false,
}: {
  etiqueta: string;
  valor: string;
  destacar?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-3 ${
        destacar ? "bg-emerald-600 text-white" : "bg-slate-50"
      }`}
    >
      <div className={`text-xs ${destacar ? "text-emerald-100" : "text-slate-500"}`}>
        {etiqueta}
      </div>
      <div className="mt-0.5 text-lg font-bold leading-tight">{valor}</div>
    </div>
  );
}
