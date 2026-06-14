"use client";

import { useState } from "react";

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

  const whatsapp = () => {
    const texto = `Mira esta licitación: ${titulo}\n${url()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <span className="flex items-center gap-2">
      <button
        onClick={whatsapp}
        className="rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium hover:border-emerald-500 hover:text-emerald-700"
      >
        Compartir por WhatsApp
      </button>
      <button
        onClick={copiar}
        className="rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium hover:border-emerald-500 hover:text-emerald-700"
      >
        {copiado ? "✓ Copiado" : "Copiar enlace"}
      </button>
    </span>
  );
}
