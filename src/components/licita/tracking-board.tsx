"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  KanbanSquare,
  NotebookPen,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTracker } from "@/lib/licitaciones/store";
import {
  diasRestantes,
  ETAPAS_ORDEN,
  etapaMeta,
  formatMontoCompacto,
  getInstitucion,
  getLicitacion,
  textoDiasRestantes,
} from "@/lib/licitaciones/utils";
import type { Etapa } from "@/lib/licitaciones/types";

export function TrackingBoard() {
  const { hydrated, seguimiento, setEtapa, untrack } = useTracker();

  const porEtapa = useMemo(() => {
    const map: Record<Etapa, typeof seguimiento> = {
      interesada: [],
      evaluando: [],
      preparando: [],
      presentada: [],
      ganada: [],
      perdida: [],
    };
    for (const s of seguimiento) map[s.etapa].push(s);
    return map;
  }, [seguimiento]);

  const valorPipeline = useMemo(
    () =>
      seguimiento.reduce((sum, s) => {
        const l = getLicitacion(s.licitacionId);
        if (!l) return sum;
        return sum + (l.moneda === "USD" ? l.montoEstimado * 60 : l.montoEstimado);
      }, 0),
    [seguimiento],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-40 rounded-2xl bg-surface ring-1 ring-hairline" />
          ))}
        </div>
      </div>
    );
  }

  if (seguimiento.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-8">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <KanbanSquare className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          Tu tablero está vacío
        </h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          Da seguimiento a las licitaciones que te interesan y organízalas por
          etapas: desde el primer interés hasta la adjudicación.
        </p>
        <Link
          href="/buscar"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Search className="h-4 w-4" />
          Explorar licitaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="En seguimiento" value={`${seguimiento.length}`} />
        <SummaryCard label="Valor del pipeline" value={formatMontoCompacto(valorPipeline)} />
        <SummaryCard label="Preparando oferta" value={`${porEtapa.preparando.length + porEtapa.presentada.length}`} />
        <SummaryCard label="Ganadas" value={`${porEtapa.ganada.length}`} accent />
      </div>

      {/* Board */}
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {ETAPAS_ORDEN.map((etapa) => {
          const meta = etapaMeta(etapa);
          const items = porEtapa[etapa];
          return (
            <div
              key={etapa}
              className="flex w-[280px] shrink-0 flex-col rounded-2xl bg-surface-soft/60 ring-1 ring-hairline"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-surface px-1.5 text-xs font-semibold text-ink-soft ring-1 ring-hairline">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
                <AnimatePresence initial={false}>
                  {items.map((s) => {
                    const lic = getLicitacion(s.licitacionId);
                    if (!lic) return null;
                    const inst = getInstitucion(lic.institucionId);
                    const dias = diasRestantes(lic.cierre);
                    const activo = lic.estado === "abierta" || lic.estado === "por_cerrar";
                    return (
                      <motion.div
                        key={s.licitacionId}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group rounded-xl bg-surface p-3 shadow-soft ring-1 ring-hairline"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/licitacion/${encodeURIComponent(lic.id)}`}
                            className="text-sm font-semibold leading-snug text-ink line-clamp-2 hover:text-brand-700"
                          >
                            {lic.titulo}
                          </Link>
                          <Link
                            href={`/licitacion/${encodeURIComponent(lic.id)}`}
                            className="shrink-0 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Abrir"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {inst?.sigla}
                          </span>
                          <span className="font-medium text-ink">
                            {formatMontoCompacto(lic.montoEstimado, lic.moneda)}
                          </span>
                        </div>
                        {activo && (
                          <div
                            className={cn(
                              "mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium",
                              dias <= 3 ? "text-closed" : dias <= 7 ? "text-soon" : "text-ink-soft",
                            )}
                          >
                            <CalendarClock className="h-3 w-3" />
                            {textoDiasRestantes(lic.cierre)}
                          </div>
                        )}
                        {s.nota && (
                          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-surface-soft p-2 text-[11px] text-ink-soft">
                            <NotebookPen className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="line-clamp-2">{s.nota}</span>
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
                          <select
                            value={s.etapa}
                            onChange={(e) => setEtapa(s.licitacionId, e.target.value as Etapa)}
                            className="h-7 rounded-md bg-surface-soft px-1.5 text-xs font-medium text-ink outline-none ring-1 ring-inset ring-hairline focus:ring-brand-300"
                            aria-label="Mover a etapa"
                          >
                            {ETAPAS_ORDEN.map((e) => (
                              <option key={e} value={e}>
                                {etapaMeta(e).label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => untrack(s.licitacionId)}
                            aria-label="Quitar de seguimiento"
                            className="grid h-7 w-7 place-items-center rounded-md text-ink-soft/60 transition-colors hover:bg-closed-soft hover:text-closed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="grid h-20 place-items-center rounded-xl border border-dashed border-hairline text-xs text-ink-soft/60">
                    Sin procesos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 ring-1",
        accent ? "bg-open-soft ring-open/20" : "bg-surface shadow-soft ring-hairline",
      )}
    >
      <p className={cn("text-2xl font-semibold tracking-tight", accent ? "text-open" : "text-ink")}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-ink-soft">{label}</p>
    </div>
  );
}
