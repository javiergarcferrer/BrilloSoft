import Link from "next/link";
import { evaluarPerencion, type CondicionTono, type Iniciativa } from "@/lib/congreso";
import { TONOS } from "@/lib/estados";
import { cn } from "@/lib/cn";
import Antiguedad from "@/components/antiguedad";

/**
 * La marca de estado de una pieza legislativa.
 *
 * Este archivo tenía su propia tabla de colores y un comentario que la decía
 * «alineada con lib/estados.ts». No lo estaba: invertía los dos tonos que más
 * pesan. Ahora no hay tabla aquí — solo el componente que la pinta.
 */
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
    <li className="cv-auto group border-b border-hairline last:border-0">
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
            <CondicionBadge tono="cumplido">Promulgada</CondicionBadge>
          )}

          {enRiesgo && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-alerta-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-alerta-600 ring-1 ring-inset ring-alerta-600/20">
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
              <Antiguedad iso={iniciativa.fechaDeposito} prefijo="Depositada" />
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
