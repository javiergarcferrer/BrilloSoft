"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";

const SUGERENCIAS = [
  "limpieza",
  "mantenimiento",
  "construcción",
  "tecnología",
  "mobiliario escolar",
];

/** Prominent hero search that routes into the explorer with a query. */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(value: string) {
    const term = value.trim();
    router.push(term ? `/buscar?q=${encodeURIComponent(term)}` : "/buscar");
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="group flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-pop ring-1 ring-white/10"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Search className="h-5 w-5" />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe lo que buscas: “limpieza de hospitales”, “asfaltado”…"
          className="h-11 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft/60"
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Buscar
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-white/60">
          <Sparkles className="h-3.5 w-3.5" />
          Sugerencias:
        </span>
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
