"use client";

import { useEffect, useState } from "react";
import {
  getSeguimiento,
  onSeguimientoCambio,
  toggleSeguimiento,
} from "@/lib/seguimiento";

export default function Estrella({
  codigo,
  className = "",
}: {
  codigo: string;
  className?: string;
}) {
  const [seguido, setSeguido] = useState(false);
  useEffect(() => {
    const sync = () => setSeguido(getSeguimiento().includes(codigo));
    sync();
    return onSeguimientoCambio(sync);
  }, [codigo]);

  return (
    <button
      onClick={() => toggleSeguimiento(codigo)}
      title={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
      aria-label={seguido ? "Quitar de seguimiento" : "Guardar en seguimiento"}
      className={`leading-none transition ${
        seguido ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
      } ${className}`}
    >
      {seguido ? "★" : "☆"}
    </button>
  );
}
