import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import Plegable from "@/components/plegable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * La tabla equivalente de un gráfico: todo lo que el color, la longitud o la
 * lectura al apuntar dicen, escrito en celdas. Es el gemelo accesible (WCAG)
 * de cada gráfico y la vía de quien no puede o no quiere leer marcas.
 *
 * Plegada por omisión, con el botón que dice **cuántas filas** trae
 * (`Plegable`: nunca «ver más»). Los números en mono y alineados a la
 * derecha, que es donde sí van las cifras tabulares.
 */
export interface ColumnaTabla {
  titulo: string;
  numerica?: boolean;
}

export function VerComoTabla({
  columnas,
  filas,
  nombre = "filas",
  className,
}: {
  columnas: ColumnaTabla[];
  filas: { clave: string; celdas: ReactNode[] }[];
  /** Cómo se cuentan las filas en el botón: «meses», «años». */
  nombre?: string;
  className?: string;
}) {
  return (
    <Plegable
      className={cn("-mx-5 mt-3 border-t border-hairline sm:-mx-6", className)}
      etiqueta={`Ver como tabla (${filas.length} ${nombre})`}
      etiquetaCerrar="Ocultar la tabla"
    >
      <div className="px-5 py-3 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              {columnas.map((c) => (
                <TableHead key={c.titulo} className={c.numerica ? "text-right" : undefined}>
                  {c.titulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.clave}>
                {f.celdas.map((celda, i) => (
                  <TableCell
                    key={columnas[i]?.titulo ?? i}
                    className={cn("font-mono tabular-nums", columnas[i]?.numerica && "text-right")}
                  >
                    {celda}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Plegable>
  );
}
