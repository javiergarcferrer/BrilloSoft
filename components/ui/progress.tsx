"use client";

/**
 * Barra de proporción. Esquina `rounded-sm`: una barra de progreso con el
 * radio completo es una píldora, y aquí las píldoras no entran
 * (docs/IDENTIDAD.md §7).
 *
 * El color se pasa por `indicadorClassName` porque una proporción **significa**
 * algo distinto en cada sitio —ejecución presupuestaria, reparto de votos— y
 * el significado manda sobre el adorno.
 */

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/cn";

function Progress({
  className,
  value,
  indicadorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicadorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-sm bg-canvas",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 bg-brand-500", indicadorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
