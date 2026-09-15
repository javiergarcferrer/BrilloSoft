"use client";

import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/estado-vacio";

/**
 * El desenlace cuando una fuente del Estado revienta a mitad de render.
 *
 * Dice las tres cosas que la regla §6 de la ergonomía exige de esta pantalla:
 * qué pasó, qué sigue en pie —los filtros y la dirección— y cuál es la única
 * acción útil.
 *
 * Es una pantalla de **una sola acción**, y en el teléfono se compone como tal:
 * la caja respira por encima del pliegue y el botón ocupa el ancho, porque no
 * hay nada con lo que compita. `min-h` la levanta del borde superior para que
 * no se lea como un panel más de la página que acaba de fallar.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] items-center py-4">
      <EstadoVacio
        className="w-full"
        variante="caida"
        titulo="La fuente no respondió"
        accion={
          <Button size="lg" onClick={reset} className="w-full sm:w-auto">
            Reintentar
          </Button>
        }
      >
        Los sistemas del Estado a veces tardan o se caen por momentos. Suele
        resolverse en segundos; los filtros y la dirección siguen intactos.
      </EstadoVacio>
    </div>
  );
}
