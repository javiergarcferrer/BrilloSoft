/**
 * La silueta que se enseña mientras la fuente contesta.
 *
 * shadcn la anima con `animate-pulse`; aquí se usa el `shimmer` que ya define
 * `app/globals.css` —y que se apaga con `prefers-reduced-motion`—, para que la
 * espera se vea igual en toda la plataforma. Quien compone una espera entera
 * usa `components/esqueleto.tsx`, que monta estas piezas con las **mismas
 * alturas y rejillas** que el contenido real: si la silueta no coincide, la
 * página salta al llegar los datos y el lector pierde el sitio.
 */

import * as React from "react";

import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("shimmer rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
