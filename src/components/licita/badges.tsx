import { cn } from "@/lib/utils";
import { estadoMeta, etapaMeta } from "@/lib/licitaciones/utils";
import type { Estado, Etapa } from "@/lib/licitaciones/types";

export function EstadoBadge({
  estado,
  className,
  live = false,
}: {
  estado: Estado;
  className?: string;
  live?: boolean;
}) {
  const meta = estadoMeta(estado);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <span className={cn("relative inline-block h-1.5 w-1.5 rounded-full", meta.dot)}>
        {live && estado === "abierta" && (
          <span className={cn("live-dot text-open")} />
        )}
      </span>
      {meta.label}
    </span>
  );
}

export function EtapaBadge({
  etapa,
  className,
}: {
  etapa: Etapa;
  className?: string;
}) {
  const meta = etapaMeta(etapa);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-inset ring-hairline",
        className,
      )}
    >
      {children}
    </span>
  );
}
