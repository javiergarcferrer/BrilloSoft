"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CampoBusqueda } from "@/components/campo-busqueda";

/**
 * Búsqueda de iniciativas.
 *
 * El SIL hace match de subcadena sobre la descripción y soporta frases de
 * varias palabras, así que se envía el texto tal cual, sin trocearlo. La
 * consulta vive en la URL para que cualquier búsqueda sea compartible.
 */
export default function BuscadorCongreso({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [valor, setValor] = useState(initial);
  const [pendiente, startTransition] = useTransition();

  const ir = (q: string) => {
    startTransition(() =>
      router.push(`/congreso${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    );
  };

  return (
    <CampoBusqueda
      valor={valor}
      onValor={setValor}
      onEnviar={ir}
      onLimpiar={() => {
        setValor("");
        ir("");
      }}
      etiqueta="Buscar iniciativas"
      placeholder="Buscar en el texto de las iniciativas — p. ej. “medio ambiente”"
      ayuda="Busca dentro de la descripción de la iniciativa, no solo en el título. El SIL compara subcadenas, así que una frase entera también vale."
      pendiente={pendiente}
    />
  );
}
