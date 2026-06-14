"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTracker } from "@/lib/licitaciones/store";
import { BrandWordmark } from "./brand";

const NAV = [
  { label: "Panel", href: "/", icon: LayoutDashboard },
  { label: "Explorar", href: "/buscar", icon: Search },
  { label: "Seguimiento", href: "/seguimiento", icon: KanbanSquare },
  { label: "Analítica", href: "/analitica", icon: BarChart3 },
];

function openCommand() {
  window.dispatchEvent(new Event("licitard:open-command"));
}

export function AppHeader() {
  const pathname = usePathname();
  const { seguimiento, hydrated } = useTracker();
  const [mobile, setMobile] = useState(false);
  const count = hydrated ? seguimiento.length : 0;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="shrink-0">
          <BrandWordmark />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-brand-700"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === "/seguimiento" && count > 0 && (
                  <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                    {count}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-brand-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openCommand}
            className="hidden items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-sm text-ink-soft ring-1 ring-inset ring-hairline transition-colors hover:text-ink sm:flex"
          >
            <Search className="h-4 w-4" />
            <span>Buscar…</span>
            <kbd className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft ring-1 ring-hairline">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={openCommand}
            aria-label="Buscar"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface-soft text-ink-soft ring-1 ring-inset ring-hairline sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobile((v) => !v)}
            aria-label="Menú"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface-soft text-ink ring-1 ring-inset ring-hairline md:hidden"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobile && (
        <nav className="border-t border-hairline bg-surface px-5 py-3 md:hidden">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobile(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                  active ? "bg-brand-50 text-brand-700" : "text-ink",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === "/seguimiento" && count > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
