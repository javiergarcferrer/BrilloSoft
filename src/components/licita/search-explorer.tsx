"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  ListFilter,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORIAS,
  INSTITUCIONES,
  LICITACIONES,
  PROVINCIAS,
} from "@/lib/licitaciones/data";
import type {
  Estado,
  FiltrosBusqueda,
  Procedimiento,
} from "@/lib/licitaciones/types";
import {
  contarFiltrosActivos,
  estadoMeta,
  filtrarLicitaciones,
  FILTROS_VACIOS,
  formatMontoCompacto,
  type Orden,
} from "@/lib/licitaciones/utils";
import { useTracker } from "@/lib/licitaciones/store";
import { TenderCard } from "./tender-card";

const ESTADOS: Estado[] = ["abierta", "por_cerrar", "cerrada", "adjudicada"];
const PROCEDIMIENTOS = [
  ...new Set(LICITACIONES.map((l) => l.procedimiento)),
] as Procedimiento[];

const MONTO_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "Cualquier monto", min: null, max: null },
  { label: "Menos de RD$5 MM", min: null, max: 5_000_000 },
  { label: "RD$5 MM – 50 MM", min: 5_000_000, max: 50_000_000 },
  { label: "RD$50 MM – 200 MM", min: 50_000_000, max: 200_000_000 },
  { label: "Más de RD$200 MM", min: 200_000_000, max: null },
];

const ORDEN_OPCIONES: { value: Orden; label: string }[] = [
  { value: "afinidad", label: "Mayor afinidad" },
  { value: "cierre", label: "Cierre más próximo" },
  { value: "monto", label: "Mayor monto" },
  { value: "reciente", label: "Más recientes" },
];

function countBy<K extends string>(get: (l: (typeof LICITACIONES)[number]) => K) {
  const m = new Map<K, number>();
  for (const l of LICITACIONES) m.set(get(l), (m.get(get(l)) ?? 0) + 1);
  return m;
}

const countCat = countBy((l) => l.categoriaId);
const countInst = countBy((l) => l.institucionId);
const countEstado = countBy((l) => l.estado);
const countProc = countBy((l) => l.procedimiento);
const countProv = countBy((l) => l.provincia);

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function SearchExplorer({
  initial,
  initialOrden = "afinidad",
}: {
  initial: FiltrosBusqueda;
  initialOrden?: Orden;
}) {
  const [filtros, setFiltros] = useState<FiltrosBusqueda>(initial);
  const [orden, setOrden] = useState<Orden>(initialOrden);
  const [drawer, setDrawer] = useState(false);

  const resultados = useMemo(
    () => filtrarLicitaciones(filtros, orden),
    [filtros, orden],
  );
  const activos = contarFiltrosActivos(filtros);

  const set = (patch: Partial<FiltrosBusqueda>) =>
    setFiltros((f) => ({ ...f, ...patch }));

  const panel = (
    <FiltersPanel filtros={filtros} setFiltros={setFiltros} onClose={() => setDrawer(false)} />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      {/* Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-surface px-4 shadow-soft ring-1 ring-hairline focus-within:ring-brand-300">
          <Search className="h-5 w-5 text-ink-soft" />
          <input
            value={filtros.texto}
            onChange={(e) => set({ texto: e.target.value })}
            placeholder="Buscar por palabra clave, institución o referencia…"
            className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft/60"
          />
          {filtros.texto && (
            <button
              onClick={() => set({ texto: "" })}
              className="text-ink-soft hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawer(true)}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-surface px-4 text-sm font-medium text-ink shadow-soft ring-1 ring-hairline lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activos > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                {activos}
              </span>
            )}
          </button>
          <SortMenu orden={orden} setOrden={setOrden} />
        </div>
      </div>

      {/* Saved searches */}
      <SavedSearches onApply={(f) => setFiltros(f)} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">{panel}</div>
        </aside>

        {/* Results */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">{resultados.length}</span>{" "}
              {resultados.length === 1 ? "licitación" : "licitaciones"}
              {activos > 0 && " con los filtros aplicados"}
            </p>
            <div className="flex items-center gap-2">
              <SaveSearchButton filtros={filtros} disabled={activos === 0} />
              {activos > 0 && (
                <button
                  onClick={() => setFiltros(FILTROS_VACIOS)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-closed"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Active chips */}
          <ActiveChips filtros={filtros} setFiltros={setFiltros} />

          {resultados.length === 0 ? (
            <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-hairline bg-surface py-20 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-soft text-ink-soft">
                <ListFilter className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                Sin resultados
              </h3>
              <p className="mt-1 max-w-sm text-sm text-ink-soft">
                Prueba con menos filtros o términos más generales. También puedes
                guardar esta búsqueda para recibir alertas cuando aparezcan
                procesos que coincidan.
              </p>
              <button
                onClick={() => setFiltros(FILTROS_VACIOS)}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {resultados.map((lic) => (
                <TenderCard key={lic.id} lic={lic} />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-[90] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-canvas p-5 shadow-pop"
            >
              {panel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FiltersPanel({
  filtros,
  setFiltros,
  onClose,
}: {
  filtros: FiltrosBusqueda;
  setFiltros: (f: FiltrosBusqueda) => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<FiltrosBusqueda>) =>
    setFiltros({ ...filtros, ...patch });

  return (
    <div className="space-y-1 rounded-2xl bg-surface p-2 shadow-soft ring-1 ring-hairline lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0">
      <div className="flex items-center justify-between px-2 pb-1 lg:hidden">
        <span className="text-sm font-semibold text-ink">Filtros</span>
        <button onClick={onClose} className="text-ink-soft" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <FilterGroup title="Estado" defaultOpen>
        {ESTADOS.map((e) => (
          <CheckRow
            key={e}
            checked={filtros.estados.includes(e)}
            onChange={() => set({ estados: toggle(filtros.estados, e) })}
            label={estadoMeta(e).label}
            count={countEstado.get(e) ?? 0}
            dot={estadoMeta(e).dot}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Categoría" defaultOpen>
        {CATEGORIAS.filter((c) => countCat.get(c.id)).map((c) => (
          <CheckRow
            key={c.id}
            checked={filtros.categorias.includes(c.id)}
            onChange={() => set({ categorias: toggle(filtros.categorias, c.id) })}
            label={c.nombre}
            count={countCat.get(c.id) ?? 0}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Monto estimado">
        <div className="space-y-1">
          {MONTO_PRESETS.map((p) => {
            const active = filtros.montoMin === p.min && filtros.montoMax === p.max;
            return (
              <button
                key={p.label}
                onClick={() => set({ montoMin: p.min, montoMax: p.max })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-surface-soft",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1",
                    active ? "bg-brand-600 ring-brand-600" : "ring-hairline",
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Institución">
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {INSTITUCIONES.filter((i) => countInst.get(i.id)).map((i) => (
            <CheckRow
              key={i.id}
              checked={filtros.instituciones.includes(i.id)}
              onChange={() => set({ instituciones: toggle(filtros.instituciones, i.id) })}
              label={i.sigla}
              sublabel={i.nombre}
              count={countInst.get(i.id) ?? 0}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Tipo de procedimiento">
        {PROCEDIMIENTOS.map((p) => (
          <CheckRow
            key={p}
            checked={filtros.procedimientos.includes(p)}
            onChange={() => set({ procedimientos: toggle(filtros.procedimientos, p) })}
            label={p}
            count={countProc.get(p) ?? 0}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Provincia">
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {PROVINCIAS.filter((p) => countProv.get(p)).map((p) => (
            <CheckRow
              key={p}
              checked={filtros.provincias.includes(p)}
              onChange={() => set({ provincias: toggle(filtros.provincias, p) })}
              label={p.replace(" (todo el país)", "")}
              count={countProv.get(p) ?? 0}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-hairline px-2 py-1 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2.5 text-sm font-semibold text-ink"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 text-ink-soft transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  sublabel,
  count,
  dot,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
  count?: number;
  dot?: string;
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-soft"
    >
      <span
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md ring-1 transition-colors",
          checked ? "bg-brand-600 ring-brand-600" : "bg-surface ring-hairline",
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      {dot && <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{label}</span>
        {sublabel && (
          <span className="block truncate text-[11px] text-ink-soft">{sublabel}</span>
        )}
      </span>
      {count != null && (
        <span className="shrink-0 text-xs tabular-nums text-ink-soft">{count}</span>
      )}
    </button>
  );
}

function SortMenu({
  orden,
  setOrden,
}: {
  orden: Orden;
  setOrden: (o: Orden) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = ORDEN_OPCIONES.find((o) => o.value === orden);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="inline-flex h-12 items-center gap-2 rounded-2xl bg-surface px-4 text-sm font-medium text-ink shadow-soft ring-1 ring-hairline"
      >
        <ListFilter className="h-4 w-4 text-ink-soft" />
        <span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl bg-surface p-1 shadow-pop ring-1 ring-hairline">
          {ORDEN_OPCIONES.map((o) => (
            <button
              key={o.value}
              onMouseDown={() => {
                setOrden(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-soft",
                orden === o.value ? "font-semibold text-brand-700" : "text-ink",
              )}
            >
              {o.label}
              {orden === o.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveChips({
  filtros,
  setFiltros,
}: {
  filtros: FiltrosBusqueda;
  setFiltros: (f: FiltrosBusqueda) => void;
}) {
  const set = (patch: Partial<FiltrosBusqueda>) => setFiltros({ ...filtros, ...patch });
  const chips: { key: string; label: string; clear: () => void }[] = [];

  filtros.estados.forEach((e) =>
    chips.push({ key: `e-${e}`, label: estadoMeta(e).label, clear: () => set({ estados: filtros.estados.filter((x) => x !== e) }) }),
  );
  filtros.categorias.forEach((c) => {
    const cat = CATEGORIAS.find((x) => x.id === c);
    chips.push({ key: `c-${c}`, label: cat?.nombre ?? c, clear: () => set({ categorias: filtros.categorias.filter((x) => x !== c) }) });
  });
  filtros.instituciones.forEach((i) => {
    const inst = INSTITUCIONES.find((x) => x.id === i);
    chips.push({ key: `i-${i}`, label: inst?.sigla ?? i, clear: () => set({ instituciones: filtros.instituciones.filter((x) => x !== i) }) });
  });
  filtros.procedimientos.forEach((p) =>
    chips.push({ key: `p-${p}`, label: p, clear: () => set({ procedimientos: filtros.procedimientos.filter((x) => x !== p) }) }),
  );
  filtros.provincias.forEach((p) =>
    chips.push({ key: `pr-${p}`, label: p.replace(" (todo el país)", ""), clear: () => set({ provincias: filtros.provincias.filter((x) => x !== p) }) }),
  );
  if (filtros.montoMin != null || filtros.montoMax != null) {
    const label =
      filtros.montoMin != null && filtros.montoMax != null
        ? `${formatMontoCompacto(filtros.montoMin)} – ${formatMontoCompacto(filtros.montoMax)}`
        : filtros.montoMin != null
          ? `> ${formatMontoCompacto(filtros.montoMin)}`
          : `< ${formatMontoCompacto(filtros.montoMax!)}`;
    chips.push({ key: "monto", label, clear: () => set({ montoMin: null, montoMax: null }) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.clear}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
        >
          {c.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

function SaveSearchButton({
  filtros,
  disabled,
}: {
  filtros: FiltrosBusqueda;
  disabled: boolean;
}) {
  const { saveBusqueda } = useTracker();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [alerta, setAlerta] = useState(true);
  const [saved, setSaved] = useState(false);

  function guardar() {
    const label = nombre.trim() || (filtros.texto.trim() ? `“${filtros.texto.trim()}”` : "Búsqueda");
    saveBusqueda(label, filtros, alerta);
    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
      setNombre("");
    }, 900);
  }

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
          disabled
            ? "cursor-not-allowed bg-surface-soft text-ink-soft/50 ring-1 ring-inset ring-hairline"
            : "bg-brand-600 text-white hover:bg-brand-700",
        )}
      >
        <Bell className="h-4 w-4" />
        Guardar y alertar
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl bg-surface p-4 shadow-pop ring-1 ring-hairline">
            {saved ? (
              <div className="flex items-center gap-2 py-2 text-sm font-medium text-open">
                <Check className="h-5 w-5" /> Búsqueda guardada
              </div>
            ) : (
              <>
                <label className="text-xs font-semibold text-ink-soft">
                  Nombre de la búsqueda
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Limpieza en Santo Domingo"
                  className="mt-1.5 h-10 w-full rounded-lg bg-surface-soft px-3 text-sm text-ink outline-none ring-1 ring-inset ring-hairline focus:ring-brand-300"
                  autoFocus
                />
                <button
                  onClick={() => setAlerta((v) => !v)}
                  className="mt-3 flex w-full items-center gap-2 text-left text-sm text-ink"
                >
                  <span
                    className={cn(
                      "grid h-[18px] w-[18px] place-items-center rounded-md ring-1 transition-colors",
                      alerta ? "bg-brand-600 ring-brand-600" : "bg-surface ring-hairline",
                    )}
                  >
                    {alerta && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <BellRing className="h-4 w-4 text-soon" />
                  Avisarme de nuevos procesos
                </button>
                <button
                  onClick={guardar}
                  className="mt-4 h-10 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Guardar búsqueda
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SavedSearches({ onApply }: { onApply: (f: FiltrosBusqueda) => void }) {
  const { busquedas, removeBusqueda, toggleAlerta, hydrated } = useTracker();
  if (!hydrated || busquedas.length === 0) return null;

  return (
    <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
        Guardadas:
      </span>
      {busquedas.map((b) => (
        <div
          key={b.id}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-surface py-1.5 pl-3 pr-1.5 text-sm shadow-soft ring-1 ring-hairline"
        >
          <button
            onClick={() => onApply(b.filtros)}
            className="font-medium text-ink hover:text-brand-700"
          >
            {b.nombre}
          </button>
          <button
            onClick={() => toggleAlerta(b.id)}
            aria-label="Alternar alerta"
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full transition-colors",
              b.alerta ? "text-soon" : "text-ink-soft/50 hover:text-ink-soft",
            )}
          >
            {b.alerta ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => removeBusqueda(b.id)}
            aria-label="Eliminar"
            className="grid h-6 w-6 place-items-center rounded-full text-ink-soft/50 hover:bg-closed-soft hover:text-closed"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
