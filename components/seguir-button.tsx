"use client";

import { useEffect, useState } from "react";
import {
  getSeguimiento,
  onSeguimientoCambio,
  toggleSeguimiento,
} from "@/lib/seguimiento";
import { IconStar } from "./icons";
import { Button } from "@/components/ui/button";

/**
 * Seguir o dejar de seguir un proceso. `chip` va en las filas de un listado y
 * `bar` en la barra de acciones del teléfono. El estado vive en
 * `localStorage` y se sincroniza entre todas las instancias de la página.
 *
 * Seguido y sin seguir son **dos vestidos distintos del mismo botón** —relleno
 * contra filete—, no el mismo con un icono cambiado: en una lista de veinte, el
 * icono solo no se ve.
 */
export default function SeguirButton({
  codigo,
  variant = "chip",
}: {
  codigo: string;
  variant?: "chip" | "bar";
}) {
  const [seguido, setSeguido] = useState(false);
  useEffect(() => {
    const sync = () => setSeguido(getSeguimiento().includes(codigo));
    sync();
    return onSeguimientoCambio(sync);
  }, [codigo]);

  const comun = {
    onClick: () => toggleSeguimiento(codigo),
    "aria-pressed": seguido,
  };

  if (variant === "bar") {
    return (
      <Button
        {...comun}
        variant={seguido ? "default" : "secondary"}
        className="h-12 flex-1"
      >
        <IconStar className="h-5 w-5" filled={seguido} />
        {seguido ? "Siguiendo" : "Seguir"}
      </Button>
    );
  }

  return (
    <Button
      {...comun}
      variant="outline"
      size="sm"
      /*
        Seguido: relleno tenue y filete de la firma. El `hover` tiene que
        seguir cambiando algo —si repitiera el relleno que ya tiene, el botón
        parecería interactivo y no respondería, que es el «control mudo» que
        el gate persigue—, así que sube un escalón de la escala.
      */
      className={
        seguido
          ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800"
          : undefined
      }
    >
      <IconStar className="h-4 w-4" filled={seguido} />
      {seguido ? "Siguiendo" : "Seguir"}
    </Button>
  );
}
