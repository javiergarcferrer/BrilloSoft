import Link from "next/link";
import { dgcpFetch, type Proceso } from "@/lib/dgcp";
import { formatMonto, formatPesos } from "@/lib/format";
import { estadoMeta } from "@/lib/estados";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EstadoVacio } from "@/components/estado-vacio";
import { Portada, PortadaCifra, PortadaCifras } from "@/components/portada";
import { IconArrowRight } from "@/components/icons";
import { hrefInstitucion, institucionPorId } from "@/lib/instituciones";

export const revalidate = 1800;

export const metadata = {
  alternates: { canonical: "/estadisticas" },
  title: "Estadísticas del mercado",
  description:
    "Panorama de los procesos de compras públicas de los últimos 30 días en República Dominicana.",
};

/**
 * La fecha ISO de hace N días, para acotar una consulta al origen.
 *
 * No confundir con `hace()` de `lib/format.ts`, que hace lo contrario: recibe
 * una fecha y devuelve «hace 4 meses» para que lo lea una persona. Este toma
 * un número de días y devuelve `2026-08-05` para que lo lea la DGCP. Se
 * llamaba igual que aquella y la tapaba dentro de este archivo.
 */
function fechaHaceDias(dias: number): string {
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

/**
 * «No hay datos» y «la fuente no contestó» son dos pantallas distintas, y esta
 * segunda no puede pintarse con ceros: un tablero de mercado en cero es una
 * cifra falsa sobre el Estado, no un hueco declarado.
 */
function FuenteCaida() {
  return (
    <EstadoVacio
      variante="caida"
      titulo="La DGCP no respondió"
      accion={
        <Button asChild>
          <Link href="/licitaciones">
            Ir al buscador de licitaciones
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      Este tablero se arma con una sola lectura de la API de datos abiertos, y
      ahora mismo no contesta. No se pintan ceros: un mercado en cero sería una
      cifra falsa, no un dato que falta.
    </EstadoVacio>
  );
}

export default async function EstadisticasPage() {
  /*
    La lectura degrada a `null` en vez de reventar, como manda el contrato de
    adaptadores (.claude/rules/fuentes.md: «degrade to null, never throw into a
    page») y como ya hacía el panorama con esta misma consulta.

    No es cosmético. Esta página se prerenderiza en el build —lleva
    `revalidate`, no es dinámica—, así que una DGCP caída no dejaba solo este
    tablero en blanco: **tumbaba el despliegue entero**, y con él cualquier
    arreglo de cualquier otra vertical. Era la única página de la casa que
    ataba el deploy a que una fuente del Estado estuviera en pie.
  */
  const data = await dgcpFetch<Proceso>(
    "/procesos",
    { startdate: fechaHaceDias(30), limit: 1000 },
    1800
  ).catch(() => null);

  if (!data) return <FuenteCaida />;

  const lista = data.payload.content;
  const total = data.totalResults ?? lista.length;
  const abiertos = lista.filter((p) => p.estado_proceso === "Proceso publicado");
  const montoTotal = lista.reduce((s, p) => s + (p.monto_estimado || 0), 0);
  const mipymes = lista.filter((p) => p.dirigido_mipymes === "Si").length;

  const porModalidad = agrupar(lista, (p) => p.modalidad);
  /*
    Las instituciones se agrupan por código de unidad de compra, no por el
    nombre: el código es estable y es lo que enlaza con su ficha. El nombre
    que se pinta es el del primer proceso de ese código.
  */
  const nombreDe = new Map<string, string>();
  for (const p of lista) {
    const cod = String(p.codigo_unidad_compra ?? "");
    if (cod && !nombreDe.has(cod)) nombreDe.set(cod, p.unidad_compra);
  }
  const porInstitucion = agrupar(lista, (p) =>
    p.codigo_unidad_compra ? String(p.codigo_unidad_compra) : `n:${p.unidad_compra}`,
  )
    .slice(0, 10)
    .map(([k, a]) => {
      const inst = k.startsWith("n:") ? null : institucionPorId(k);
      const nombre = k.startsWith("n:") ? k.slice(2) : (nombreDe.get(k) ?? k);
      return { k, nombre, a, href: inst ? hrefInstitucion(inst) : null };
    });
  const porEstado = [...agrupar(lista, (p) => p.estado_proceso)].sort(
    (a, b) => b[1].n - a[1].n
  );
  const maxInst = porInstitucion[0]?.a.monto || 1;
  const maxMod = porModalidad[0]?.[1].monto || 1;
  const totalN = lista.length || 1;

  /*
    Cada cifra declara **su base**, porque tres de las cuatro salen de un
    barrido acotado y una del censo. Ponerlas juntas sin marcarlas invita a
    dividir una por otra: «4.812 publicados» y «730 abiertos» parecen un 15 %
    y no lo son — el 730 sale de una muestra de mil.
  */
  const escaneados = lista.length.toLocaleString("es-DO");
  const kpis: {
    etiqueta: string;
    valor: string;
    base?: string;
    destacar?: boolean;
  }[] = [
    {
      etiqueta: "Procesos publicados",
      valor: total.toLocaleString("es-DO"),
      base: "registro completo · 30 días",
    },
    {
      etiqueta: "Abiertos ahora mismo",
      valor: abiertos.length.toLocaleString("es-DO"),
      base: `muestra de ${escaneados}`,
      destacar: true,
    },
    {
      /*
        `formatPesos` y no `formatMonto`: a 390 px las casillas de la portada
        son dos columnas de unos 160 px, y «RD$1,986,088,831» es una cadena de
        dieciséis caracteres sin un solo sitio por donde partir — se salía de su
        casilla y la banda de tinta, que recorta, se comía el final de la cifra
        más grande de la página. La forma larga («RD$ 1.9 mil millones») cabe,
        se lee en voz alta como se dice y **nombra la magnitud**, que es la
        regla: «MM» se lee millones en el uso dominicano y aquí son miles.
      */
      etiqueta: "Monto estimado",
      valor: formatPesos(montoTotal),
      base: `muestra de ${escaneados}`,
    },
    {
      etiqueta: "Dirigidos a MIPYMES",
      valor: mipymes.toLocaleString("es-DO"),
      base: `muestra de ${escaneados}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Portada
        rotulo="Últimos 30 días · se actualiza cada 30 min"
        titulo="¿Quién compra, cuánto y por qué vía?"
        descripcion={
          <>
            Basado en los {lista.length.toLocaleString("es-DO")} procesos más
            recientes
            {total > lista.length
              ? ` de ${total.toLocaleString("es-DO")} publicados en el período`
              : ""}
            .
          </>
        }
      >
        <PortadaCifras>
          {kpis.map((k) => (
            <PortadaCifra
              key={k.etiqueta}
              etiqueta={
                <>
                  {k.etiqueta}
                  {k.base && (
                    <span className="rotulo mt-1 block text-canvas/50">{k.base}</span>
                  )}
                </>
              }
              valor={k.valor}
              destacar={k.destacar}
            />
          ))}
        </PortadaCifras>

        {/*
          El reparto por estado: una sola barra apilada con su leyenda. Los
          colores salen de `lib/estados.ts` — un color, un significado, aquí
          también.
        */}
        <div className="mt-6">
          <div className="flex h-3 overflow-hidden rounded-sm ring-1 ring-canvas/10">
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
              <span
                key={e}
                className="inline-flex items-center gap-1.5 text-xs text-canvas/70"
              >
                <span className={`h-2 w-2 rounded-full ${estadoMeta(e).dot}`} />
                {e}
                <span className="font-semibold text-canvas">{a.n}</span>
              </span>
            ))}
          </div>
        </div>
      </Portada>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card as="section" className="p-6">
          <CardTitle>Por modalidad</CardTitle>
          <ul className="mt-3 space-y-2.5 text-sm">
            {porModalidad.map(([nombre, a]) => (
              <li key={nombre}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{nombre}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <Progress
                  value={Math.max(2, (a.monto / maxMod) * 100)}
                  aria-label={`${nombre}: ${formatMonto(a.monto, "DOP")}`}
                  className="mt-1"
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card as="section" className="p-6">
          <CardTitle>Top 10 instituciones por monto</CardTitle>
          <ul className="mt-3 space-y-2.5 text-sm">
            {porInstitucion.map(({ k, nombre, a, href }) => (
              <li key={k}>
                <div className="flex items-baseline justify-between gap-2">
                  {href ? (
                    <Link href={href} className="line-clamp-1 font-medium text-brand-600 hover:underline">
                      {nombre}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 font-medium">{nombre}</span>
                  )}
                  <span className="shrink-0 text-xs text-ink-soft">
                    {a.n} · {formatMonto(a.monto, "DOP")}
                  </span>
                </div>
                <Progress
                  value={Math.max(2, (a.monto / maxInst) * 100)}
                  aria-label={`${nombre}: ${formatMonto(a.monto, "DOP")}`}
                  indicadorClassName="bg-brand-400"
                  className="mt-1"
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Alert
        variant="firma"
        className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="text-sm text-brand-900">
          ¿Buscas tu nicho? Usa el buscador con tu palabra clave y suscríbete al RSS de
          esa búsqueda para no perderte procesos nuevos.
        </span>
        <Button asChild className="shrink-0">
          <Link href="/licitaciones">
            Ir al buscador
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Alert>
    </div>
  );
}
