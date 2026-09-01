"use client";

import { useState } from "react";
import { IconCheck, IconShare } from "./icons";

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
      <button
        onClick={compartir}
        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium transition hover:border-brand-500 hover:text-brand-600 active:scale-95"
      >
        <IconShare className="h-3.5 w-3.5" />
        Compartir
      </button>
      <button
        onClick={copiar}
        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium transition hover:border-brand-500 hover:text-brand-600 active:scale-95"
      >
        {copiado ? <IconCheck className="h-3.5 w-3.5 text-brand-500" /> : null}
        {copiado ? "Copiado" : "Copiar enlace"}
      </button>
    </span>
  );
}
