"use client";

/**
 * Hoja que sube del borde inferior y se cierra arrastrándola hacia abajo: el
 * `Drawer` de shadcn/ui, sobre `vaul`, vestido con los tokens de aquí.
 *
 * Sustituye a la `Sheet` de Radix con un gesto escrito a mano con eventos de
 * puntero. En el teléfono el asidero promete ese gesto, y una hoja que no lo
 * cumple se siente rota aunque tenga su botón de cerrar; `vaul` lo trae
 * resuelto —umbral por distancia y por velocidad, la hoja que sigue al dedo
 * con resistencia hacia arriba, el conflicto con el desplazamiento de dentro—
 * y por debajo sigue siendo el `Dialog` de Radix: foco atrapado, Escape, el
 * foco de vuelta al disparador al cerrar.
 *
 * Tres cosas no son de adorno:
 *  · **Se arrastra por la cabecera**, no por el cuerpo. El cuerpo se desplaza
 *    y lleva campos, selectores y fechas; un arrastre que compitiera con eso
 *    se llevaría la lista por delante. Cuerpo y pie llevan `data-vaul-no-drag`.
 *  · **El movimiento es el de la casa**, no el de la librería: `vaul` trae
 *    medio segundo y su propia curva, y `app/globals.css` se los cambia por
 *    `--dur-hoja`/`ease-sello` al entrar y `--dur-media`/`ease-salida` al
 *    salir. Con movimiento reducido no se desliza: aparece y desaparece.
 *  · El velo va en `z-[70]` y la hoja en `z-[80]` porque el header de la
 *    plataforma es pegajoso y vive en `z-50`: con el velo en la misma planta,
 *    el header se quedaba encima, nítido y pulsable, mientras el resto de la
 *    página estaba atenuada y bloqueada.
 *
 * El borde superior se redondea solo por arriba —una hoja que sube del borde
 * no tiene esquinas abajo—, el contenido lleva su propio desplazamiento para
 * que una lista larga no empuje la página, y la altura máxima deja ver un
 * trozo de lo que hay debajo, que es lo que le dice al lector que no cambió de
 * página.
 */

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/cn";
import { IconX } from "@/components/icons";

function Drawer({
  autoFocus = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  /*
    `autoFocus`: `vaul` deja el foco fuera al abrir; Radix lo lleva dentro, al
    primer control, y es lo que un lector de pantalla y un teclado esperan de
    una capa modal. Se conserva lo de Radix.
  */
  return <DrawerPrimitive.Root data-slot="drawer" autoFocus={autoFocus} {...props} />;
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-[70] bg-ink/45", className)}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[80] flex max-h-[85dvh] flex-col rounded-t-lg border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] shadow-pop outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

/**
 * Cabecera con el asidero y el cierre: es la zona que se arrastra. El asidero
 * (`data-asidero`) es la barra gris que dice «esto se arrastra»: en el
 * teléfono, un panel que sube sin asidero se lee como una página nueva.
 */
function DrawerHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        // `touch-none`: mientras el dedo arrastra la cabecera, el navegador no
        // debe desplazar la página ni disparar «tirar para recargar».
        "shrink-0 touch-none select-none border-b border-hairline px-4 pb-3 pt-2",
        className,
      )}
      {...props}
    >
      <div
        data-asidero
        aria-hidden
        className="mx-auto mb-2 h-1.5 w-10 rounded-sm bg-hairline sm:hidden"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{children}</div>
        {/*
          Cerrar es el mando que más se busca en una hoja: en el teléfono mide
          44 px, con márgenes negativos para que el aspa no se mueva de donde
          se la ve. Desde `sm`, con puntero, vuelve a 32. El arrastre es un
          atajo; este botón es la forma que no depende de saberlo.
        */}
        <DrawerPrimitive.Close className="-my-2 -mr-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:my-0 sm:-mr-1 sm:h-8 sm:w-8">
          <IconX className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DrawerPrimitive.Close>
      </div>
    </div>
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-sans text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-xs leading-relaxed text-ink-soft", className)}
      {...props}
    />
  );
}

/** El cuerpo se desplaza y no arrastra la hoja (`data-vaul-no-drag`). */
function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      data-vaul-no-drag
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      data-vaul-no-drag
      className={cn("shrink-0 border-t border-hairline px-4 py-3", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
};
