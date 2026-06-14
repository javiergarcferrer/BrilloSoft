"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl bg-surface p-10 text-center shadow-soft ring-1 ring-hairline">
      <h1 className="text-lg font-semibold">La API de la DGCP no respondió</h1>
      <p className="mt-2 text-sm text-slate-500">
        El portal de datos abiertos a veces tarda o se cae por momentos. Suele
        resolverse en segundos.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Reintentar
      </button>
    </div>
  );
}
