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
 *
 * El velo va en `z-[70]` y la hoja en `z-[80]` porque el header de la
 * plataforma es pegajoso y vive en `z-50`: con el velo en la misma planta, el
 * header se quedaba encima, nítido y pulsable, mientras el resto de la página
 * estaba atenuada y bloqueada.
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
      className={cn("velo fixed inset-0 z-[70] bg-ink/45", className)}
      {...props}
    />
  );
}

/**
 * El gesto de arrastrar la hoja hacia abajo para cerrarla.
 *
 * En un teléfono el asidero promete ese gesto, y una hoja que no lo cumple se
 * siente rota aunque tenga su botón de cerrar. Radix no lo trae: aquí se
 * implementa con eventos de puntero sobre la **cabecera** y no sobre toda la
 * hoja, porque el cuerpo se desplaza y un arrastre que compitiera con ese
 * desplazamiento se llevaría la lista por delante.
 *
 * Dos decisiones que no son de adorno:
 *  · No se captura el puntero (`setPointerCapture`). Capturarlo redirigiría el
 *    `click` del botón de cerrar a la cabecera y el botón dejaría de funcionar.
 *    Los eventos de movimiento y suelta se escuchan en `window` mientras dura
 *    el gesto.
 *  · Cerrar es pulsar el `Close` de Radix, no un estado paralelo: así el foco
 *    vuelve al disparador y `onOpenChange` se dispara igual que con Escape.
 */
const ArrastreContexto = React.createContext<{
  iniciar: (e: React.PointerEvent) => void;
} | null>(null);

const UMBRAL_CIERRE_PX = 96;
const UMBRAL_VELOCIDAD = 0.6; // px/ms: un tirón corto pero rápido también cierra

function useArrastreParaCerrar(activo: boolean) {
  const hoja = React.useRef<HTMLDivElement>(null);
  const cerrar = React.useRef<HTMLButtonElement>(null);

  const iniciar = React.useCallback(
    (e: React.PointerEvent) => {
      if (!activo || !hoja.current) return;
      // Los botones de la cabecera se pulsan, no se arrastran.
      if ((e.target as HTMLElement).closest("button, a")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const el = hoja.current;
      const y0 = e.clientY;
      const t0 = performance.now();
      let dy = 0;
      el.style.transition = "none";

      const mover = (ev: PointerEvent) => {
        dy = Math.max(0, ev.clientY - y0);
        el.style.transform = `translateY(${dy}px)`;
      };
      const soltar = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", soltar);
        window.removeEventListener("pointercancel", soltar);
        const velocidad = dy / Math.max(1, performance.now() - t0);
        el.style.transition = "";
        if (
          ev.type !== "pointercancel" &&
          (dy > UMBRAL_CIERRE_PX || (dy > 24 && velocidad > UMBRAL_VELOCIDAD))
        ) {
          // La animación de salida de Radix arranca desde donde quedó el dedo.
          cerrar.current?.click();
        } else {
          el.style.transform = "";
        }
      };
      window.addEventListener("pointermove", mover, { passive: true });
      window.addEventListener("pointerup", soltar);
      window.addEventListener("pointercancel", soltar);
    },
    [activo],
  );

  return { hoja, cerrar, iniciar };
}

function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "bottom" | "right";
}) {
  const { hoja, cerrar, iniciar } = useArrastreParaCerrar(side === "bottom");
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={hoja}
        data-slot="sheet-content"
        className={cn(
          "fixed z-[80] flex flex-col border-hairline bg-surface shadow-pop",
          side === "bottom" &&
            "hoja-abajo inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg border-t pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out",
          side === "right" &&
            "hoja-derecha inset-y-0 right-0 w-[min(24rem,92vw)] border-l",
          className,
        )}
        {...props}
      >
        <ArrastreContexto.Provider value={side === "bottom" ? { iniciar } : null}>
          {children}
        </ArrastreContexto.Provider>
        {side === "bottom" && (
          <SheetPrimitive.Close ref={cerrar} tabIndex={-1} aria-hidden className="hidden" />
        )}
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
  const arrastre = React.useContext(ArrastreContexto);
  return (
    <div
      data-slot="sheet-header"
      onPointerDown={arrastre?.iniciar}
      className={cn(
        "shrink-0 border-b border-hairline px-4 pb-3 pt-2",
        // `touch-none`: mientras el dedo arrastra la cabecera, el navegador no
        // debe desplazar la página ni disparar «tirar para recargar».
        arrastre && "touch-none select-none",
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
          Cerrar es el mando que más se busca en una hoja y medía 32 px: en el
          teléfono sube a 44, con márgenes negativos para que el aspa no se
          mueva de donde se la ve. Desde `sm`, con puntero, vuelve a 32.
        */}
        <SheetPrimitive.Close className="-my-2 -mr-2.5 inline-flex h-11 w-11 shrink-0 sm:my-0 sm:-mr-1 sm:h-8 sm:w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
