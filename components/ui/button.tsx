/**
 * Botón — la primitiva de shadcn/ui vestida de «El Contrasello».
 *
 * Es la misma API de shadcn (`variant`, `size`, `asChild`) y la misma mecánica
 * (`cva` + `Slot`), pero ninguna de sus decisiones de color sobrevive: la
 * variante principal es la **firma** —azul de bolígrafo, tinta plana— y el
 * texto sobre relleno saturado es papel (`canvas`), nunca blanco de pantalla.
 *
 * `asChild` es lo que hace esta pieza usable en una plataforma que es, sobre
 * todo, enlaces: `<Button asChild><Link href=…>` conserva la semántica de
 * navegación y hereda el vestido. Antes había que copiar la línea de clases a
 * mano en cada página, que es exactamente como se diluyó la identidad dos
 * veces (docs/IDENTIDAD.md §8).
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** La acción principal: tinta plana de bolígrafo. */
        default: "bg-brand-500 text-canvas hover:bg-brand-600",
        /** La hoja sobre el papel: filete y superficie, como una tarjeta. */
        secondary:
          "border border-hairline bg-surface text-ink hover:bg-canvas",
        /** Solo el filete: para lo que acompaña sin competir. */
        outline:
          "border border-hairline bg-transparent text-ink hover:bg-brand-50 hover:text-brand-700",
        /** Sin caja hasta que se apunta. */
        ghost: "text-ink hover:bg-brand-50 hover:text-brand-700",
        /** Un enlace que se comporta como botón. */
        link: "text-brand-700 underline-offset-4 hover:underline",
        /**
         * Sobre la banda de tinta del header: papel al 65 % que se enciende al
         * apuntarlo. Es la única variante que vive sobre fondo oscuro, y por
         * eso su texto es `canvas` y nunca blanco de pantalla.
         */
        tinta:
          "text-canvas/65 hover:bg-canvas/10 hover:text-canvas data-[activo=true]:bg-canvas/12 data-[activo=true]:text-canvas",
        /** El sello: lo que deroga, anula o borra. Escaso por definición. */
        destructive: "bg-sello-600 text-canvas hover:bg-sello-700",
      },
      /*
        La altura por defecto es 40 px, la misma de `Input` y `SelectTrigger`:
        un botón junto a un campo se alinea sin que nadie tenga que corregirlo
        en el sitio de uso, y 40 px es además un objetivo táctil decente para
        quien consulta con el pulgar.
      */
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-11 rounded-lg px-5",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
