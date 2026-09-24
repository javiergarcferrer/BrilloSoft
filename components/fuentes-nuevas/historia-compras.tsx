import Link from "next/link";
import { historiaDeInstitucion, historiaDeProveedor, nContratos, sumar } from "@/lib/historico";
import { hrefInstitucion, institucionPorId } from "@/lib/instituciones";
import { desdeMayusculas } from "@/lib/congreso";
import { formatFecha, formatPesos } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { Barras } from "@/components/barras";
import { Cifra, TiraDeCifras } from "@/components/papel";
import { Card, CardTitle } from "@/components/ui/card";

/**
 * La historia de un proveedor o de una institución en el sistema de compras,
 * desde 2015 (`lib/historico.ts`). Complementa la ventana reciente que las
 * fichas leen en vivo: aquella dice lo último, esta dice todo lo registrado.
 *
 * Si la instantánea falta o el RPE/unidad no aparece en ella, no pinta nada:
 * la ficha sigue diciendo lo suyo.
 */

function nota(corte: string) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-ink-soft">
      Valor contratado en pesos según el registro completo de contratos de la DGCP
      hasta el {formatFecha(corte)}; sin cancelados y sin los contratos de RD$10 mil
      millones o más, que se revisan aparte en{" "}
      <Link href="/historico" className="font-medium text-brand-700 hover:underline">
        la historia de las compras
      </Link>
      . Instantánea, no consulta en vivo.
    </p>
  );
}

export async function HistoriaDeProveedor({ rpe }: { rpe: string }) {
  const r = await historiaDeProveedor(rpe);
  if (!r || r.historia.serie.length === 0) return null;
  const { historia: h, corte } = r;
  const total = sumar(h.serie, 2);
  const contratos = sumar(h.serie, 1);
  const mejor = [...h.serie].sort((a, b) => b[2] - a[2])[0];

  return (
    <Card as="section" className="p-6">
      <CardTitle className="text-[15px]">Toda su historia con el Estado</CardTitle>
      <p className="mt-1 text-xs text-ink-soft">
        Desde su primer contrato registrado, el {formatFecha(h.desde)}, hasta el último,
        el {formatFecha(h.hasta)}.
      </p>
      <TiraDeCifras className="mt-4 lg:grid-cols-3">
        <Cifra etiqueta="Contratado en total" valor={formatPesos(total)} ancla={{ alcance: "instantanea", periodo: `${h.desde.slice(0, 4)}–${h.hasta.slice(0, 4)}` }} />
        <Cifra etiqueta="Contratos" valor={formatInt(contratos)} />
        <Cifra etiqueta="Instituciones clientes" valor={formatInt(h.totalClientes)} />
      </TiraDeCifras>
      {h.serie.length > 1 && (
        <Barras
          tono="fill-v-compras"
          etiqueta={`Valor contratado por año; su mejor año fue ${mejor[0]}, con ${formatPesos(mejor[2])}`}
          puntos={h.serie.map(([anio, n, monto], i) => ({
            clave: String(anio),
            valor: monto,
            titulo: `${anio}: ${formatPesos(monto)} en ${nContratos(n)}`,
            marca: i === 0 || i === h.serie.length - 1 ? String(anio) : undefined,
          }))}
        />
      )}
      {h.clientes.length > 0 && (
        <>
          <h3 className="rotulo mt-4 text-ink-soft">Sus mayores clientes</h3>
          <ol className="mt-1 divide-y divide-hairline">
            {h.clientes.map(([uc, n, monto]) => {
              const i = institucionPorId(uc);
              return (
                <li key={uc} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  {i ? (
                    <Link href={hrefInstitucion(i)} className="min-w-0 text-ink hover:text-brand-700 hover:underline">
                      {i.nombre}
                    </Link>
                  ) : (
                    <span className="min-w-0 text-ink">Unidad de compra {uc}</span>
                  )}
                  <span className="shrink-0 text-right font-mono tabular-nums">
                    {formatPesos(monto)}
                    <span className="block text-xs text-ink-soft">{nContratos(n)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {nota(corte)}
    </Card>
  );
}

export async function HistoriaDeInstitucion({ uc }: { uc: number }) {
  const r = await historiaDeInstitucion(uc);
  if (!r || r.historia.serie.every((f) => f[1] === 0)) return null;
  const { historia: h, corte } = r;
  const total = sumar(h.serie, 2);
  const primero = h.serie[0][0];
  const ultimo = h.serie.at(-1)![0];

  return (
    <Card as="section" id="historia" className="p-5 sm:p-6">
      <CardTitle>Lo que ha contratado desde {primero}</CardTitle>
      <TiraDeCifras className="mt-4 lg:grid-cols-3">
        <Cifra etiqueta="Contratado en total" valor={formatPesos(total)} ancla={{ alcance: "instantanea", periodo: `${primero}–${ultimo}` }} />
        <Cifra etiqueta="Contratos" valor={formatInt(sumar(h.serie, 1))} />
        <Cifra etiqueta="Proveedores distintos" valor={formatInt(h.proveedores)} />
      </TiraDeCifras>
      {h.serie.length > 1 && (
        <Barras
          tono="fill-v-compras"
          etiqueta={`Valor contratado por año, ${primero}–${ultimo}`}
          puntos={h.serie.map(([anio, n, monto, procesos], i) => ({
            clave: String(anio),
            valor: monto,
            titulo: `${anio}: ${formatPesos(monto)} en ${nContratos(n)}; ${formatInt(procesos)} procesos publicados`,
            marca: i === 0 || i === h.serie.length - 1 ? String(anio) : undefined,
          }))}
        />
      )}
      {h.top.length > 0 && (
        <>
          <h3 className="rotulo mt-4 text-ink-soft">A quién le ha contratado más</h3>
          <ol className="mt-1 divide-y divide-hairline">
            {h.top.map(([rpe, nombre, n, monto]) => (
              <li key={rpe} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <Link href={`/proveedores/${rpe}`} className="min-w-0 text-ink hover:text-brand-700 hover:underline">
                  {desdeMayusculas(nombre) || `RPE ${rpe}`}
                </Link>
                <span className="shrink-0 text-right font-mono tabular-nums">
                  {formatPesos(monto)}
                  <span className="block text-xs text-ink-soft">{nContratos(n)}</span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
      {nota(corte)}
    </Card>
  );
}
