"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES, seccionDe } from "@/lib/secciones";
import { IconChartBar, IconCheck, IconCoins, IconLayers, IconSparkles } from "./icons";
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
  congreso: IconLayers,
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
      Icon: IconSparkles,
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface/92 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, Icon, activa, barra, texto }) => (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "group relative flex flex-col items-center gap-1 px-1 pb-1.5 pt-2 text-[11px] font-medium transition-colors active:scale-95",
              activa ? texto : "text-ink-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-0.5 w-8 rounded-full transition-opacity",
                barra,
                activa ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className="h-[22px] w-[22px]" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
