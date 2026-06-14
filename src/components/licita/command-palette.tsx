"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  CornerDownLeft,
  KanbanSquare,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filtrarLicitaciones,
  formatMontoCompacto,
  getInstitucion,
  textoDiasRestantes,
} from "@/lib/licitaciones/utils";
import { FILTROS_VACIOS } from "@/lib/licitaciones/utils";
import { EstadoBadge } from "./badges";

const NAV = [
  { label: "Explorar licitaciones", href: "/buscar", icon: Search },
  { label: "Tablero de seguimiento", href: "/seguimiento", icon: KanbanSquare },
  { label: "Analítica de mercado", href: "/analitica", icon: BarChart3 },
];

/** Global ⌘K / Ctrl-K palette: search tenders + jump to sections. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPalette = useCallback(() => {
    setQ("");
    setActive(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQ("");
        setActive(0);
        setOpen((v) => !v);
      }
      if (e.key === "Escape") closePalette();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("licitard:open-command", openPalette as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("licitard:open-command", openPalette as EventListener);
    };
  }, [openPalette, closePalette]);

  // Focus the input when the palette opens (DOM side effect only).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  const resultados = useMemo(() => {
    if (!q.trim()) return [];
    return filtrarLicitaciones({ ...FILTROS_VACIOS, texto: q }, "afinidad").slice(0, 6);
  }, [q]);

  const navFiltrado = useMemo(() => {
    if (!q.trim()) return NAV;
    return NAV.filter((n) => n.label.toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  const items = useMemo(
    () => [
      ...resultados.map((l) => ({ kind: "lic" as const, id: l.id })),
      ...navFiltrado.map((n) => ({ kind: "nav" as const, href: n.href })),
    ],
    [resultados, navFiltrado],
  );

  function go(i: number) {
    const it = items[i];
    if (!it) return;
    setOpen(false);
    if (it.kind === "lic") router.push(`/licitacion/${encodeURIComponent(it.id)}`);
    else router.push(it.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (q.trim() && active >= items.length) {
        setOpen(false);
        router.push(`/buscar?q=${encodeURIComponent(q)}`);
      } else {
        go(active);
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-pop ring-1 ring-hairline"
          >
            <div className="flex items-center gap-3 border-b border-hairline px-4">
              <Search className="h-5 w-5 text-ink-soft" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Buscar licitaciones, instituciones, secciones…"
                className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft/60"
              />
              <kbd className="hidden rounded-md bg-surface-soft px-2 py-1 text-[10px] font-semibold text-ink-soft ring-1 ring-hairline sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {resultados.length > 0 && (
                <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                  Licitaciones
                </div>
              )}
              {resultados.map((l, i) => {
                const inst = getInstitucion(l.institucionId);
                return (
                  <button
                    key={l.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active === i ? "bg-brand-50" : "hover:bg-surface-soft",
                    )}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-soft text-brand-600 ring-1 ring-hairline">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {l.titulo}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {inst?.sigla} · {formatMontoCompacto(l.montoEstimado, l.moneda)} ·{" "}
                        {textoDiasRestantes(l.cierre)}
                      </span>
                    </span>
                    <EstadoBadge estado={l.estado} className="hidden sm:inline-flex" />
                  </button>
                );
              })}

              <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                Ir a
              </div>
              {navFiltrado.map((n, j) => {
                const i = resultados.length + j;
                const Icon = n.icon;
                return (
                  <button
                    key={n.href}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active === i ? "bg-brand-50" : "hover:bg-surface-soft",
                    )}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-soft text-brand-600 ring-1 ring-hairline">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{n.label}</span>
                  </button>
                );
              })}

              {q.trim() && (
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push(`/buscar?q=${encodeURIComponent(q)}`);
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-brand-700 hover:bg-brand-50"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="flex-1 font-medium">
                    Ver todos los resultados para “{q}”
                  </span>
                  <CornerDownLeft className="h-4 w-4 text-ink-soft" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
