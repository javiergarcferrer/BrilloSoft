"use client";

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * La hoja que sube desde el borde inferior en el teléfono: los filtros del
 * buscador viven aquí.
 *
 * Antes era una implementación a mano —transformaciones, bloqueo del
 * desplazamiento del cuerpo, un `keydown` para Escape y un botón de fondo
 * haciendo de velo—. Funcionaba, pero le faltaba lo que nadie ve hasta que lo
 * necesita: el foco no quedaba atrapado dentro de la hoja, así que tabular
 * seguía recorriendo la página de debajo, y al cerrar el foco no volvía al
 * control que la abrió. Radix lo trae resuelto, y es la razón de que estas
 * primitivas entren al repositorio.
 *
 * Se mantiene el `lg:hidden`: en pantalla ancha los filtros están a la vista y
 * esta hoja no tiene por qué existir.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90dvh] lg:hidden">
        <SheetHeader>
          <SheetTitle className="text-base tracking-tight">{title}</SheetTitle>
        </SheetHeader>
        <SheetBody className="px-5">{children}</SheetBody>
        {footer && (
          <SheetFooter
            className="p-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
