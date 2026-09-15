"use client";

/**
 * Globo anclado a un control: sugerencias del buscador, ayuda de un filtro.
 * Flota de verdad, así que lleva `shadow-card`.
 */

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/cn";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          [
            // `dvh` y no `vh`: con el teclado virtual abierto, `vh` sigue
            // midiendo la pantalla entera y el globo queda por debajo del
            // teclado, donde no se puede ni ver ni tocar.
            "capa z-50 max-h-[70dvh] w-72 overflow-y-auto overscroll-contain rounded-lg border border-hairline bg-surface p-4 text-sm text-ink shadow-card outline-none",
          ].join(" "),
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
