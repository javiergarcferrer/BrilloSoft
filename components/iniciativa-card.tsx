import Link from "next/link";
import { evaluarPerencion, type CondicionTono, type Iniciativa } from "@/lib/congreso";
import { formatFecha } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Lenguaje de color de la condición procesal, alineado con `lib/estados.ts`
 * (el vocabulario visual de licitaciones) para que la plataforma se lea como
 * un solo sistema. Clases literales: Tailwind escanea el fuente.
 */
const TONOS: Record<CondicionTono, { badge: string; dot: string }> = {
  vigente: { badge: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500" },
  aprobado: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  perimido: { badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
  neutro: { badge: "bg-slate-100 text-slate-600 ring-slate-300", dot: "bg-slate-400" },
};

export function CondicionBadge({
  tono,
  children,
  className,
}: {
  tono: CondicionTono;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        TONOS[tono].badge,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Fila de listado: densa a propósito, el usuario escanea muchas a la vez. */
export default function IniciativaCard({ iniciativa }: { iniciativa: Iniciativa }) {
  const perencion = iniciativa.viva ? evaluarPerencion(iniciativa.legislatura) : null;
  const enRiesgo = perencion?.estado === "en-riesgo";

  return (
    <li className="group border-b border-hairline last:border-0">
      <Link
        href={`/congreso/${iniciativa.id}`}
        className="block px-4 py-3.5 transition-colors hover:bg-canvas/60 sm:px-5"
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="font-mono text-xs font-semibold tabular-nums text-brand-700">
            {iniciativa.numero?.completo ?? `#${iniciativa.id}`}
          </span>

          <CondicionBadge tono={iniciativa.tono}>
            {iniciativa.condicion ?? "—"}
          </CondicionBadge>

          {iniciativa.promulgada && (
            <CondicionBadge tono="aprobado">Promulgada</CondicionBadge>
          )}

          {enRiesgo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-600/20">
              Perime en {perencion.diasRestantes} d
            </span>
          )}
        </div>

        <p className="mt-1.5 text-[15px] leading-snug text-ink group-hover:text-brand-700">
          {iniciativa.titulo}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-soft">
          {iniciativa.tipo && <span>{iniciativa.tipo}</span>}
          {iniciativa.grupo && (
            <>
              <Sep />
              <span>{iniciativa.grupo}</span>
            </>
          )}
          {iniciativa.fechaDeposito && (
            <>
              <Sep />
              <span className="tabular-nums">
                Depositada {formatFecha(iniciativa.fechaDeposito)}
              </span>
            </>
          )}
          {iniciativa.legislatura && (
            <>
              <Sep />
              <span className="font-mono tabular-nums">{iniciativa.legislatura}</span>
            </>
          )}
        </div>
      </Link>
    </li>
  );
}

function Sep() {
  return (
    <span aria-hidden className="text-hairline">
      ·
    </span>
  );
}
