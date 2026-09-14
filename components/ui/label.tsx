"use client";

/**
 * Etiqueta de campo. Radix se encarga de asociarla al control (y de que
 * pulsarla enfoque el campo, que es media accesibilidad de un formulario en un
 * teléfono).
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/cn";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex select-none items-center gap-2 text-sm font-semibold text-ink",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-55",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
