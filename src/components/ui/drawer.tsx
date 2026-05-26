"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  widthClass = "sm:w-[32rem]",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl",
              widthClass,
            )}
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                {eyebrow && (
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600">
                    {eyebrow}
                  </div>
                )}
                {title && (
                  <h2 className="truncate text-lg font-semibold text-slate-900">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="-mr-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
