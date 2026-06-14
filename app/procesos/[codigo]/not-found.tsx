import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl bg-surface p-10 text-center shadow-soft ring-1 ring-hairline">
      <h1 className="text-lg font-semibold">Proceso no encontrado</h1>
      <p className="mt-2 text-sm text-slate-500">
        La API de la DGCP no devolvió datos para este código de proceso.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        ← Volver al buscador
      </Link>
    </div>
  );
}
