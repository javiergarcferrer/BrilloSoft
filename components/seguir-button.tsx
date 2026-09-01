"use client";

import { useEffect, useState } from "react";
import {
  getSeguimiento,
  onSeguimientoCambio,
  toggleSeguimiento,
} from "@/lib/seguimiento";
import { IconStar } from "./icons";

/** Follow/unfollow toggle for a process. `chip` for inline rows, `bar` for the
 *  mobile action bar. Stays in sync with localStorage across the app. */
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

  if (variant === "bar") {
    return (
      <button
        onClick={() => toggleSeguimiento(codigo)}
        aria-pressed={seguido}
        className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition active:scale-95 ${
          seguido
            ? "bg-brand-600 text-canvas"
            : "border border-hairline bg-surface text-ink"
        }`}
      >
        <IconStar className="h-5 w-5" filled={seguido} />
        {seguido ? "Siguiendo" : "Seguir"}
      </button>
    );
  }

  return (
    <button
      onClick={() => toggleSeguimiento(codigo)}
      aria-pressed={seguido}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition active:scale-95 ${
        seguido
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-hairline hover:border-brand-500 hover:text-brand-600"
      }`}
    >
      <IconStar className="h-4 w-4" filled={seguido} />
      {seguido ? "Siguiendo" : "Seguir"}
    </button>
  );
}
