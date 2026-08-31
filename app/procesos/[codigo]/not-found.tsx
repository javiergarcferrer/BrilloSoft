import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="rounded-2xl bg-surface p-12 text-center shadow-soft ring-1 ring-hairline">
      <h1 className="text-lg font-semibold tracking-tight">Proceso no encontrado</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
        La API de la DGCP no devolvió datos para este código de proceso.
      </p>
      <Link
        href="/licitaciones"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-95"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver al buscador
      </Link>
    </div>
  );
}
