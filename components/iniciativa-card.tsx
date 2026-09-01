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
  vigente: { badge: "bg-valido-50 text-valido-700 ring-valido-600/20", dot: "bg-valido-500" },
  aprobado: {
    badge: "bg-brand-50 text-brand-600 ring-brand-500/20",
    dot: "bg-brand-500",
  },
  perimido: { badge: "bg-sello-50 text-sello-700 ring-sello-600/20", dot: "bg-sello-500" },
  neutro: { badge: "bg-hairline text-ink-soft ring-hairline", dot: "bg-ink-soft" },
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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-alerta-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-alerta-600 ring-1 ring-inset ring-alerta-600/20">
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
