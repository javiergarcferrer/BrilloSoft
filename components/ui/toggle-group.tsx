"use client";

/**
 * Grupo de conmutadores — el control segmentado de la plataforma: «Masa ·
 * Plazas · Promedio», «Resumen · Tabla».
 *
 * No es una pestaña: no cambia de vista, cambia **qué se mide**. Y no es un
 * grupo de botones sueltos: Radix le da el papel de `radiogroup`, el recorrido
 * con flechas y un solo punto de tabulación, que es lo que distingue un control
 * de tres opciones de tres controles seguidos.
 *
 * La caja es un filete con relleno de papel y el seleccionado va en tinta de
 * firma. Esquina `rounded-md` por dentro, `rounded-lg` por fuera: el techo de
 * la identidad, nunca una píldora.
 */

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/cn";

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-lg border border-hairline bg-canvas p-1",
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors sm:min-h-0",
        "hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-55",
        "data-[state=on]:bg-brand-600 data-[state=on]:font-semibold data-[state=on]:text-canvas",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
