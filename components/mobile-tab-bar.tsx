"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSeguimiento, onSeguimientoCambio } from "@/lib/seguimiento";
import { IconChartBar, IconSearch, IconShield, IconStar } from "./icons";

const TABS = [
  { href: "/", label: "Buscar", Icon: IconSearch, exact: true },
  { href: "/estadisticas", label: "Mercado", Icon: IconChartBar },
  { href: "/seguimiento", label: "Seguidos", Icon: IconStar, seguimiento: true },
  { href: "/guia", label: "Guía", Icon: IconShield },
];

/** Native-style fixed bottom navigation for mobile (hidden on lg+). */
export default function MobileTabBar() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getSeguimiento().length);
    sync();
    return onSeguimientoCambio(sync);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface/92 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, Icon, exact, seguimiento }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex flex-col items-center gap-1 px-1 pb-1.5 pt-2 text-[11px] font-medium transition-colors active:scale-95 ${
                active ? "text-brand-700" : "text-ink-soft"
              }`}
            >
              <span
                className={`absolute top-0 h-0.5 w-8 rounded-full bg-brand-600 transition-opacity ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="relative">
                {seguimiento ? (
                  <IconStar className="h-[22px] w-[22px]" filled={active} />
                ) : (
                  <Icon className="h-[22px] w-[22px]" />
                )}
                {seguimiento && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
