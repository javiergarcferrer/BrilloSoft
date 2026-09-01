"use client";

import { SelloCompacto } from "@/components/marca";

import { useEffect, useState } from "react";
import { IconX } from "./icons";

const KEY = "lrd:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** Dismissible "install this app" banner driven by the PWA beforeinstallprompt
 *  event. Only appears where the browser supports installation. */
export default function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(KEY, "1");
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    try {
      await evt.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  };

  return (
    <div
      className="fixed inset-x-3 z-[60] rounded-lg border border-hairline bg-surface p-3.5 shadow-card bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-4 lg:max-w-sm"
    >
      <div className="flex items-center gap-3">
        <SelloCompacto className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Instala Socrático.do</p>
          <p className="text-xs text-ink-soft">
            Acceso directo, a pantalla completa, desde tu inicio.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Descartar"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-soft transition hover:bg-canvas hover:text-ink active:scale-90"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={install}
        className="mt-3 h-10 w-full rounded-lg bg-brand-600 text-sm font-semibold text-canvas transition active:scale-[0.99]"
      >
        Añadir al inicio
      </button>
    </div>
  );
}
