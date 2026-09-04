"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-10 text-center">
      <h1 className="text-lg font-semibold">La fuente no respondió</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Los sistemas del Estado a veces tardan o se caen por momentos. Suele
        resolverse en segundos; los filtros y la dirección siguen intactos.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-canvas hover:bg-brand-600"
      >
        Reintentar
      </button>
    </div>
  );
}
