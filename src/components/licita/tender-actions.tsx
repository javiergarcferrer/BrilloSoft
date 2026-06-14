"use client";

import { Bookmark, BookmarkCheck, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTracker } from "@/lib/licitaciones/store";
import { ETAPAS_ORDEN, etapaMeta } from "@/lib/licitaciones/utils";
import type { Etapa } from "@/lib/licitaciones/types";

/**
 * Tracking controls on the detail page: bookmark, workflow stage selector and a
 * private note — the "organize" half of search / organize / track.
 */
export function TenderActions({ id }: { id: string }) {
  const { hydrated, isTracked, getItem, toggleTrack, setEtapa, setNota } = useTracker();
  const tracked = hydrated && isTracked(id);
  const item = getItem(id);

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-hairline">
      <button
        type="button"
        onClick={() => toggleTrack(id)}
        aria-pressed={tracked}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
          tracked
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-100",
        )}
      >
        {tracked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {tracked ? "En seguimiento" : "Dar seguimiento"}
      </button>

      {tracked && (
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
              Etapa
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {ETAPAS_ORDEN.map((e) => {
                const meta = etapaMeta(e);
                const active = item?.etapa === e;
                return (
                  <button
                    key={e}
                    onClick={() => setEtapa(id, e as Etapa)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium ring-1 ring-inset transition-colors",
                      active
                        ? meta.badge
                        : "bg-surface text-ink-soft ring-hairline hover:bg-surface-soft",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
              <NotebookPen className="h-3.5 w-3.5" /> Nota interna
            </p>
            <textarea
              value={item?.nota ?? ""}
              onChange={(e) => setNota(id, e.target.value)}
              rows={3}
              placeholder="Responsable, presupuesto, recordatorios…"
              className="mt-2 w-full resize-none rounded-lg bg-surface-soft p-3 text-sm text-ink outline-none ring-1 ring-inset ring-hairline focus:ring-brand-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
