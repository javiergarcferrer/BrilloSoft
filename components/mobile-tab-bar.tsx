"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES, seccionDe } from "@/lib/secciones";
import {
  IconChartBar,
  IconCheck,
  IconCoins,
  IconDoc,
  IconGrid,
  IconLayers,
  IconTrendingUp,
} from "./icons";
import { cn } from "@/lib/cn";
import type { SeccionId } from "@/lib/secciones";

/**
 * Navegación inferior móvil (oculta en lg+, donde navega el nav del header).
 *
 * Mismo modelo mental que el nav global: panorama + una pestaña por vertical,
 * derivadas de `lib/secciones`. Las vistas internas de cada vertical viven en
 * la barra de sección, no aquí: la tab bar cambia de vertical, no de vista.
 */

const ICONOS: Record<SeccionId, (p: { className?: string }) => React.ReactElement> = {
  licitaciones: IconCoins,
  finanzas: IconTrendingUp,
  congreso: IconLayers,
  normativa: IconDoc,
  nomina: IconChartBar,
  democracia: IconCheck,
};

export default function MobileTabBar() {
  const pathname = usePathname();
  const actual = seccionDe(pathname);

  const tabs = [
    {
      href: "/",
      label: "Panorama",
      Icon: IconGrid,
      activa: pathname === "/",
      barra: "bg-ink",
      texto: "text-ink",
    },
    ...SECCIONES.map((s) => ({
      href: s.href,
      label: s.nombre,
      Icon: ICONOS[s.id],
      activa: actual?.id === s.id,
      barra: s.hue.barra,
      texto: s.hue.activo,
    })),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      {/* Con seis destinos ya no caben fijos: fila deslizable con anchos
          mínimos, sin barra de scroll visible. */}
      <div className="flex justify-start overflow-x-auto [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ href, label, Icon, activa, barra, texto }) => (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "group relative flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 px-1 pb-1.5 pt-2 text-[11px] font-medium transition-colors active:scale-95",
              activa ? texto : "text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 transition-opacity",
                barra,
                activa ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
