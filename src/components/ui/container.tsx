import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Centered max-width wrapper with consistent horizontal padding. The padding
 * respects `env(safe-area-inset-*)` so content clears notches / rounded
 * corners on phones (see `px-safe-*` utilities in globals.css).
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-safe-5 sm:px-safe-8", className)}>
      {children}
    </div>
  );
}
