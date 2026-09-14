"use client";

/**
 * Hoja lateral. En el teléfono entra **por abajo** (`side="bottom"`), que es
 * donde llega el pulgar y donde esta plataforma pone sus filtros; en pantalla
 * ancha se usa por la derecha.
 *
 * Detalles que no son de adorno: el borde superior se redondea solo por arriba
 * —una hoja que sube del borde no tiene esquinas abajo—, el contenido lleva su
 * propio desplazamiento para que una lista larga no empuje la página, y la
 * altura máxima deja ver un trozo de lo que hay debajo, que es lo que le dice
 * al lector que no cambió de página.
 */

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/cn";
import { IconX } from "@/components/icons";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn("velo fixed inset-0 z-50 bg-ink/45", className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "bottom" | "right";
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col border-hairline bg-surface shadow-pop",
          side === "bottom" &&
            "hoja-abajo inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg border-t pb-[env(safe-area-inset-bottom)]",
          side === "right" &&
            "hoja-derecha inset-y-0 right-0 w-[min(24rem,92vw)] border-l",
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/**
 * Cabecera con el asidero y el cierre. El asidero (`data-asidero`) es la barra
 * gris que dice «esto se arrastra»: en el teléfono, un panel que sube sin
 * asidero se lee como una página nueva.
 */
function SheetHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("shrink-0 border-b border-hairline px-4 pb-3 pt-2", className)}
      {...props}
    >
      <div
        data-asidero
        aria-hidden
        className="mx-auto mb-2 h-1 w-10 rounded-sm bg-hairline sm:hidden"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{children}</div>
        <SheetPrimitive.Close className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <IconX className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </SheetPrimitive.Close>
      </div>
    </div>
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-sans text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs leading-relaxed text-ink-soft", className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "shrink-0 border-t border-hairline px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
};
