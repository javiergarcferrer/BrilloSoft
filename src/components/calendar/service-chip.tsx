"use client";

import { SERVICE_STATUS_META } from "@/lib/colors";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ServiceChip({
  service,
  teamHex,
  onClick,
  onDragStart,
}: {
  service: Service;
  teamHex?: string;
  onClick?: () => void;
  onDragStart?: (id: string) => void;
}) {
  const meta = SERVICE_STATUS_META[service.status];
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", service.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(service.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "group flex w-full cursor-grab items-center gap-1.5 overflow-hidden rounded-md border py-1 pl-1.5 pr-1 text-left text-[11px] leading-tight transition-shadow hover:shadow-sm active:cursor-grabbing",
        meta.chip,
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: teamHex ?? meta.hex }}
      title={`${service.startTime} · ${service.clientName} — ${meta.label}`}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          meta.dot,
          service.status === "in_progress" && "bs-pulse-dot",
        )}
        style={{ color: meta.hex }}
      />
      <span className="shrink-0 font-semibold tabular-nums">
        {service.startTime}
      </span>
      <span className="truncate font-medium opacity-90">
        {service.clientName}
      </span>
    </button>
  );
}
