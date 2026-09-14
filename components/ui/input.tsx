/**
 * Campo de texto — la casilla del formulario.
 *
 * Fondo de hoja, filete de folio y anillo de foco con la firma. El
 * `placeholder` va en grafito: es una pista, no un valor.
 */

import * as React from "react";

import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink transition-colors",
        "placeholder:text-ink-soft/80",
        "focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
