import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { hrefInstitucion, institucionesNombradasEn } from "@/lib/instituciones";

/**
 * Las instituciones que el enunciado de una pieza nombra con su nombre
 * completo, con enlace a su ficha: de la ley a quien la ejecuta, su
 * presupuesto y lo que compra. Si no nombra ninguna con certeza, no aparece.
 */
export function InstitucionesNombradas({ texto }: { texto: string }) {
  const nombradas = institucionesNombradasEn(texto);
  if (nombradas.length === 0) return null;
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Instituciones que nombra</CardTitle>
      </CardHeader>
      <ul className="divide-y divide-hairline px-5 pb-3">
        {nombradas.map((i) => (
          <li key={i.id}>
            <Link
              href={hrefInstitucion(i)}
              className="flex min-h-11 items-center py-2 text-sm text-brand-700 hover:underline"
            >
              {i.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
