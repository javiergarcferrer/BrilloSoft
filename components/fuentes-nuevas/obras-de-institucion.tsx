import Link from "next/link";
import { obrasDeInstitucion } from "@/lib/obras";
import { formatFecha, formatPesos } from "@/lib/format";
import { formatInt } from "@/lib/nomina";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilaObra } from "@/components/fuentes-nuevas/fila-obra";

/**
 * Las obras que ejecuta una institución, en su ficha.
 *
 * La unión entidad ejecutora ↔ unidad de compra la hace
 * `scripts/build-obras.py` por nombre (y una tabla curada); una institución
 * sin obras en la instantánea no pinta nada —no ejecutar inversión es lo
 * normal para la mayoría—.
 */
export async function ObrasDeInstitucion({ uc }: { uc: number }) {
  const datos = await obrasDeInstitucion(uc);
  if (!datos || datos.obras.length === 0) return null;
  const { obras, corte } = datos;
  const valor = obras.reduce((s, o) => s + o.valor, 0);
  const paralizadas = obras.filter((o) => o.estado === "Paralizado").length;
  return (
    <Card as="section">
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle>Obras que ejecuta</CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          {formatInt(obras.length)} proyectos de inversión por{" "}
          {formatPesos(valor)} en el Banco de Proyectos
          {paralizadas > 0 ? `, ${formatInt(paralizadas)} de ellos paralizados` : ""}.
          Instantánea de MapaInversiones con corte al {formatFecha(corte)}; se
          muestran los de mayor valor.
        </p>
      </div>
      <ul className="divide-y divide-hairline border-t border-hairline">
        {obras.slice(0, 5).map((o) => (
          <FilaObra key={o.snip} obra={o} />
        ))}
      </ul>
      <div className="border-t border-hairline p-4 sm:px-6">
        <Button asChild variant="secondary">
          <Link href={`/obras?uc=${uc}`}>Ver sus {formatInt(obras.length)} obras</Link>
        </Button>
      </div>
    </Card>
  );
}
