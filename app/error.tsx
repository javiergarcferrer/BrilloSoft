"use client";

import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/estado-vacio";

/**
 * El desenlace cuando una fuente del Estado revienta a mitad de render.
 *
 * Dice las tres cosas que la regla §6 de la ergonomía exige de esta pantalla:
 * qué pasó, qué sigue en pie —los filtros y la dirección— y cuál es la única
 * acción útil.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EstadoVacio
      variante="caida"
      titulo="La fuente no respondió"
      accion={<Button onClick={reset}>Reintentar</Button>}
    >
      Los sistemas del Estado a veces tardan o se caen por momentos. Suele
      resolverse en segundos; los filtros y la dirección siguen intactos.
    </EstadoVacio>
  );
}
