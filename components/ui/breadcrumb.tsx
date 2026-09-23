/**
 * Miga de pan — la primitiva de shadcn/ui vestida de «El Contrasello».
 *
 * Solo la semántica y el vestido: un `nav` con su nombre, una lista ordenada y
 * `aria-current="page"` en la última pieza, que es lo que un lector de
 * pantalla anuncia como «estás aquí». La regla de la casa sobre cómo se usa
 * —en el teléfono solo la vuelta atrás, a 44 px— vive en `components/ruta.tsx`.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/cn";
import { IconChevronRight } from "@/components/icons";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="Ruta" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1 break-words text-xs text-ink-soft sm:gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("font-medium transition-colors hover:text-brand-700", className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("truncate font-medium text-ink", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("text-ink-soft/60 [&>svg]:h-3.5 [&>svg]:w-3.5", className)}
      {...props}
    >
      {children ?? <IconChevronRight />}
    </li>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
