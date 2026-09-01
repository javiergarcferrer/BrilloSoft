"use client";

import SeguirButton from "./seguir-button";
import { IconExternal, IconShare } from "./icons";

/**
 * Sticky mobile action bar for a process detail page. Fixed above the bottom tab
 * bar; uses the native share sheet when available and falls back to WhatsApp.
 * Hidden on lg+ (desktop keeps the inline header actions).
 */
export default function AccionesProceso({
  codigo,
  titulo,
  url,
}: {
  codigo: string;
  titulo: string;
  url?: string;
}) {
  const compartir = async () => {
    const link = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url: link });
      } catch {
        /* usuario canceló */
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${titulo} ${link}`)}`,
        "_blank",
      );
    }
  };

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-hairline bg-surface px-4 py-3 shadow-pop lg:hidden"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2">
        <SeguirButton codigo={codigo} variant="bar" />
        <button
          onClick={compartir}
          aria-label="Compartir"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-hairline bg-surface text-ink border border-hairline transition active:scale-95"
        >
          <IconShare className="h-5 w-5" />
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-sm font-semibold text-white transition active:scale-95"
          >
            Ofertar
            <IconExternal className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
