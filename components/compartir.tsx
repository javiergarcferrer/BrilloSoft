"use client";

import { useState } from "react";
import { IconCheck, IconShare } from "./icons";
import { Button } from "@/components/ui/button";

/**
 * Compartir y copiar el enlace.
 *
 * «Copiado» se dice en el propio botón durante dos segundos y no en un aviso
 * flotante: la confirmación tiene que aparecer donde estaba mirando el dedo.
 * La región `aria-live` la anuncia también a quien no la ve.
 */
export default function Compartir({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

  const url = () => window.location.href;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard no disponible */
    }
  };

  const compartir = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url: url() });
        return;
      } catch {
        /* usuario canceló */
      }
    }
    const texto = `Mira esta licitación: ${titulo}\n${url()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <span className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={compartir}>
        <IconShare className="h-3.5 w-3.5" />
        Compartir
      </Button>
      <Button variant="outline" size="sm" onClick={copiar}>
        {copiado && <IconCheck className="h-4 w-4 text-valido-600" />}
        <span aria-live="polite">{copiado ? "Copiado" : "Copiar enlace"}</span>
      </Button>
    </span>
  );
}
