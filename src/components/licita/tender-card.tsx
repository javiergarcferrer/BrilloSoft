import Link from "next/link";
import { Building2, CalendarClock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Licitacion } from "@/lib/licitaciones/types";
import {
  diasRestantes,
  formatMontoCompacto,
  getCategoria,
  getInstitucion,
  puntuacionAfinidad,
  textoDiasRestantes,
} from "@/lib/licitaciones/utils";
import { EstadoBadge } from "./badges";
import { CategoryIcon } from "./category-icon";
import { ScoreRing } from "./score-ring";
import { TrackButton } from "./track-button";

export function TenderCard({
  lic,
  className,
}: {
  lic: Licitacion;
  className?: string;
}) {
  const inst = getInstitucion(lic.institucionId);
  const cat = getCategoria(lic.categoriaId);
  const score = puntuacionAfinidad(lic);
  const dias = diasRestantes(lic.cierre);
  const urgente = lic.estado === "abierta" || lic.estado === "por_cerrar";
  const deadlineColor =
    dias < 0
      ? "text-ink-soft"
      : dias <= 3
        ? "text-closed"
        : dias <= 7
          ? "text-soon"
          : "text-ink-soft";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-hairline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card hover:ring-brand-200",
        className,
      )}
    >
      <div className="absolute right-4 top-4 z-10">
        <TrackButton id={lic.id} />
      </div>

      <div className="flex items-center gap-2 pr-10">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <CategoryIcon name={cat?.icon ?? "Sparkles"} className="h-[18px] w-[18px]" />
        </span>
        <EstadoBadge estado={lic.estado} live />
      </div>

      <Link
        href={`/licitacion/${encodeURIComponent(lic.id)}`}
        className="mt-3.5 block focus-visible:outline-none"
      >
        <span className="absolute inset-0" aria-hidden />
        <h3 className="font-sans text-[15px] font-semibold leading-snug tracking-tight text-ink line-clamp-2 group-hover:text-brand-700">
          {lic.titulo}
        </h3>
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {inst?.sigla}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {lic.provincia.replace(" (todo el país)", "")}
        </span>
        <span className="font-mono text-[11px] text-ink-soft/70">{lic.id}</span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <div className="text-base font-semibold tracking-tight text-ink">
            {formatMontoCompacto(lic.montoEstimado, lic.moneda)}
          </div>
          <div
            className={cn(
              "mt-0.5 inline-flex items-center gap-1 text-xs font-medium",
              deadlineColor,
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {urgente ? textoDiasRestantes(lic.cierre) : "Proceso cerrado"}
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <ScoreRing score={score} />
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-soft/70">
            afinidad
          </span>
        </div>
      </div>
    </div>
  );
}
