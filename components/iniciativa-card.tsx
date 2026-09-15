import Link from "next/link";
import {
  desdeMayusculas,
  evaluarPerencion,
  type CondicionTono,
  type Iniciativa,
} from "@/lib/congreso";
import Antiguedad from "@/components/antiguedad";
import { MarcaEstado } from "@/components/marca-estado";
import { cn } from "@/lib/cn";

/**
 * La marca de estado de una pieza legislativa.
 *
 * Este archivo tenía su propia tabla de colores y un comentario que la decía
 * «alineada con lib/estados.ts». No lo estaba: invertía los dos tonos que más
 * pesan. Hoy no hay tabla **ni marca** aquí: las dos viven una sola vez, la
 * tabla en `lib/estados.ts` y la marca en `components/marca-estado.tsx`. Lo que
 * queda es el nombre con el que el Congreso la llama.
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
    <MarcaEstado tono={tono} conPunto={false} className={className}>
      {children}
    </MarcaEstado>
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
            <MarcaEstado tono="aviso" conPunto={false}>
              Perime en {perencion.diasRestantes} d
            </MarcaEstado>
          )}
        </div>

        {/*
          El SIL publica la descripción en versales: «LEY QUE MODIFICA LOS
          ARTÍCULOS…». En un teléfono ese mismo enunciado ocupa ocho líneas de
          caja alta —la forma de la palabra desaparece y la fila deja de
          escanearse— así que se devuelve a caja mixta para leerlo. El texto no
          cambia: cambia la caja, igual que ya hacía el Senado en su capa.
        */}
        <p className="mt-1.5 text-[15px] leading-snug text-ink group-hover:text-brand-700">
          {desdeMayusculas(iniciativa.titulo)}
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
          {/*
            La legislatura es un nombre largo —«Segunda Legislatura Ordinaria
            2026»— que en el teléfono se lleva una línea entera de la fila para
            decir algo que la ficha repite y que el aviso de perención ya
            resume. Desde `sm` hay sitio y vuelve.
          */}
          {iniciativa.legislatura && (
            <>
              <Sep className="hidden sm:inline" />
              <span className="hidden font-mono tabular-nums sm:inline">
                {iniciativa.legislatura}
              </span>
            </>
          )}
        </div>
      </Link>
    </li>
  );
}

function Sep({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("text-hairline", className)}>
      ·
    </span>
  );
}
