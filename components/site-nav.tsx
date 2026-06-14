"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSeguimiento, onSeguimientoCambio } from "@/lib/seguimiento";
import {
  IconChartBar,
  IconExternal,
  IconSearch,
  IconShield,
  IconStar,
} from "./icons";

const ITEMS = [
  { href: "/", label: "Buscar", Icon: IconSearch, exact: true },
  { href: "/estadisticas", label: "Estadísticas", Icon: IconChartBar },
  { href: "/guia", label: "Guía", Icon: IconShield },
  { href: "/seguimiento", label: "Seguimiento", Icon: IconStar, seguimiento: true },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getSeguimiento().length);
    sync();
    return onSeguimientoCambio(sync);
  }, []);

  return (
    <nav className="no-scrollbar -mx-1 flex items-center gap-0.5 overflow-x-auto">
      {ITEMS.map(({ href, label, Icon, exact, seguimiento }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`group relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            {seguimiento && count > 0 && (
              <span className="ml-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        );
      })}
      <a
        href="https://datosabiertos.dgcp.gob.do/api-dgcp/docs/index.html"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white lg:inline-flex"
      >
        API DGCP
        <IconExternal className="h-3.5 w-3.5" />
      </a>
    </nav>
  );
}
