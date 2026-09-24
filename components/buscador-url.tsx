"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CampoBusqueda } from "@/components/campo-busqueda";

/**
 * Un campo de búsqueda cuyo estado es `?q=` en la página actual.
 *
 * Es el patrón de `app/proveedores/buscador.tsx` sin su ruta cableada: la
 * búsqueda se comparte, se marca y vuelve con «atrás», y los demás parámetros
 * de la URL (un año, un tipo) se conservan. Lo usan las superficies que filtran
 * en el servidor —instituciones, normativa, finanzas—.
 */
export function BuscadorUrl({
  etiqueta,
  placeholder,
  ayuda,
}: {
  etiqueta: string;
  placeholder?: string;
  ayuda?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const inicial = params.get("q") ?? "";
  const [valor, setValor] = useState(inicial);
  const [pendiente, iniciar] = useTransition();

  useEffect(() => setValor(inicial), [inicial]);

  const ir = (texto: string) => {
    const siguiente = new URLSearchParams(params.toString());
    const q = texto.trim();
    if (q) siguiente.set("q", q);
    else siguiente.delete("q");
    // Una búsqueda nueva es una lista nueva: empieza en su primera página, no
    // en la página por la que iba la anterior.
    siguiente.delete("pagina");
    const cadena = siguiente.toString();
    iniciar(() => router.push(cadena ? `${pathname}?${cadena}` : pathname));
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
      etiqueta={etiqueta}
      placeholder={placeholder}
      ayuda={ayuda}
      pendiente={pendiente}
    />
  );
}
