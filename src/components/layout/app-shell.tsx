"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/modal";
import { toastInfo } from "@/components/ui/toast";
import { NAV, NAV_GROUPS, type NavItem } from "./nav";

function useBadgeCounts() {
  const hydrated = useHydrated();
  const services = useStore((s) => s.services);
  if (!hydrated) return { unassigned: 0, pendingDigit: 0 };
  return {
    unassigned: services.filter((s) => s.status === "unassigned").length,
    pendingDigit: services.filter((s) => s.accountingStatus === "pending")
      .length,
  };
}

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm">
        <Sparkles className="size-5" />
      </span>
      <span className="text-[17px] font-bold tracking-tight text-slate-900">
        Brillo<span className="text-brand-600">Soft</span>
      </span>
    </Link>
  );
}

function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
      {count}
    </span>
  );
}

function NavLink({
  item,
  active,
  badge,
  layoutId,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
  layoutId: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-600"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.2 : 1.9} />
      {item.label}
      <NavBadge count={badge} />
    </Link>
  );
}

function SidebarContent({
  pathname,
  counts,
  onNavigate,
  onReset,
}: {
  pathname: string;
  counts: { unassigned: number; pendingDigit: number };
  onNavigate?: () => void;
  onReset: () => void;
}) {
  const navId = useId();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Wordmark />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {NAV_GROUPS.map((group) => {
          const items = NAV.filter((n) => n.group === group);
          return (
            <div key={group}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={pathname.startsWith(item.href)}
                    badge={item.badge ? counts[item.badge] : 0}
                    layoutId={`nav-active-${navId}`}
                    onClick={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={onReset}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <RotateCcw className="size-4" />
          Reset demo data
        </button>
        <p className="mt-2 px-3 text-[11px] leading-relaxed text-slate-400">
          MVP preview — data is saved locally in this browser.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const counts = useBadgeCounts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetAll = useStore((s) => s.resetAll);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const primary = NAV.filter((n) => n.primary);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent
          pathname={pathname}
          counts={counts}
          onReset={() => setConfirmReset(true)}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Wordmark />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {/* Mobile slide-out nav */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 w-[18rem] max-w-[85vw] bg-white shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
              <SidebarContent
                pathname={pathname}
                counts={counts}
                onNavigate={() => setMobileOpen(false)}
                onReset={() => {
                  setMobileOpen(false);
                  setConfirmReset(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          const badge = item.badge ? counts[item.badge] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-brand-600" : "text-slate-400",
              )}
            >
              <span className="relative">
                <Icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.9} />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll();
          toastInfo("Demo data reset", "All sample records were restored.");
        }}
        title="Reset demo data?"
        description="This restores the original sample clients, quotes and services. Any changes you made will be lost."
        confirmLabel="Reset"
        tone="danger"
      />
    </div>
  );
}
