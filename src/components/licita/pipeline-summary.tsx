"use client";

import Link from "next/link";
import { ArrowRight, KanbanSquare } from "lucide-react";
import { useTracker } from "@/lib/licitaciones/store";
import { ETAPAS_ORDEN, etapaMeta } from "@/lib/licitaciones/utils";

/** Compact view of the user's tracking pipeline for the dashboard. */
export function PipelineSummary() {
  const { seguimiento, hydrated } = useTracker();

  const counts = ETAPAS_ORDEN.map((etapa) => ({
    etapa,
    n: seguimiento.filter((s) => s.etapa === etapa).length,
  }));
  const total = seguimiento.length;

  if (hydrated && total === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-hairline bg-surface p-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <KanbanSquare className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Aún no sigues licitaciones</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Marca el ícono de guardar en cualquier proceso para organizarlo en tu
            tablero de seguimiento por etapas.
          </p>
        </div>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Explorar licitaciones <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-soft ring-1 ring-hairline">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Tu seguimiento</h3>
        <Link
          href="/seguimiento"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          Abrir tablero <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">
        {hydrated ? total : "—"}
        <span className="ml-1.5 text-sm font-medium text-ink-soft">
          en seguimiento
        </span>
      </p>
      <div className="mt-4 space-y-2.5">
        {counts
          .filter((c) => c.n > 0)
          .map(({ etapa, n }) => {
            const meta = etapaMeta(etapa);
            const pct = total ? (n / total) * 100 : 0;
            return (
              <div key={etapa} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs font-medium text-ink-soft">
                  {meta.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className={`h-full rounded-full ${meta.dot}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
                  {n}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
