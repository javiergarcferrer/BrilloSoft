import type { ReactNode } from "react";

import Plegable from "@/components/plegable";

/**
 * Un registro largo dentro de un panel: la cabeza a la vista y la cola a un
 * toque, sin perder nada.
 *
 * Las dos cámaras publican expedientes veteranos con treinta trámites, una
 * docena de piezas documentales y treinta firmantes. En un teléfono eso son
 * seis pantallas de desplazamiento antes de llegar al final de la ficha, y el
 * único evento que importa —el último— queda enterrado bajo los rutinarios.
 * `Plegable` ya resuelve la mecánica y la regla de que el botón diga cuántos
 * hay; lo que falta es el corte, y las dos fichas lo hacían a mano.
 *
 * `render(desde, hasta)` pinta el tramo que se le pida, para que el tramo
 * visible y el escondido compartan exactamente el mismo marcado —los filetes,
 * la rejilla, la línea de la cronología— en vez de dos copias que se desvíen.
 * Es una función y no dos nodos porque este archivo se ejecuta en el servidor:
 * nunca cruza la frontera del cliente, que es la que no deja pasar funciones.
 *
 * Cuando lo que hay cabe entero no aparece ningún mando: un botón que abre
 * tres filas no le ahorra nada a nadie.
 */
export default function ListaPlegada({
  total,
  visibles,
  etiqueta,
  etiquetaCerrar,
  render,
}: {
  total: number;
  /** Cuántas filas se ven sin pedirlo. */
  visibles: number;
  /** «Ver los 33 trámites». Con el número, siempre. */
  etiqueta: string;
  etiquetaCerrar: string;
  render: (desde: number, hasta: number) => ReactNode;
}) {
  if (total <= visibles) return <>{render(0, total)}</>;

  return (
    <Plegable
      resumen={render(0, visibles)}
      etiqueta={etiqueta}
      etiquetaCerrar={etiquetaCerrar}
    >
      {render(visibles, total)}
    </Plegable>
  );
}
