"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconSearch } from "@/components/icons";

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = valor.trim();
    startTransition(() =>
      router.push(`/congreso${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          name="q"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Buscar en el texto de las iniciativas — p. ej. “medio ambiente”"
          aria-label="Buscar iniciativas"
          className="h-11 w-full rounded-lg border border-hairline bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={pendiente}
        className="h-11 shrink-0 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95 disabled:opacity-60"
      >
        {pendiente ? "Buscando…" : "Buscar"}
      </button>
    </form>
  );
}
