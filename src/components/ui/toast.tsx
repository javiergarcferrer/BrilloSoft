"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { create } from "zustand";
import { cn, uid } from "@/lib/utils";

type Tone = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, 4200);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(t: Omit<Toast, "id">) {
  useToastStore.getState().push(t);
}
export const toastSuccess = (title: string, description?: string) =>
  toast({ tone: "success", title, description });
export const toastError = (title: string, description?: string) =>
  toast({ tone: "error", title, description });
export const toastInfo = (title: string, description?: string) =>
  toast({ tone: "info", title, description });

const TONE: Record<Tone, { icon: typeof Info; ring: string; iconColor: string }> =
  {
    success: {
      icon: CheckCircle2,
      ring: "ring-emerald-200",
      iconColor: "text-emerald-500",
    },
    error: {
      icon: TriangleAlert,
      ring: "ring-rose-200",
      iconColor: "text-rose-500",
    },
    info: { icon: Info, ring: "ring-brand-200", iconColor: "text-brand-500" },
  };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, ring, iconColor } = TONE[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex w-[min(92vw,22rem)] items-start gap-3 rounded-xl bg-white p-3.5 shadow-[var(--shadow-pop)] ring-1",
                ring,
              )}
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
