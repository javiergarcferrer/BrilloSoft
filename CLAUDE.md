# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Licitaciones RD** — a Spanish-language (es-DO) web app to search Dominican
public-procurement processes (licitaciones) and understand *what is being bought
and how to bid*. It is a thin, cached front end over the **DGCP open-data API**
(`https://datosabiertos.dgcp.gob.do/api-dgcp/v1`). **There is no database and no
environment variables** — all data is fetched live and cached via Next's fetch
`revalidate`. Never introduce a DB, API keys, or secrets.

## Commands

```bash
npm install
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build — also runs the TypeScript typecheck
npm run start    # serve the production build
npx tsc --noEmit # typecheck only
```

There is no test suite and no ESLint config; `next build` is the gate. Deploys to
Vercel automatically on push to `main` (production: https://brillo-soft.vercel.app).

## Architecture

Next.js 15 **App Router** + React 19 + TypeScript + Tailwind CSS 4. Imports use
the `@/*` alias resolving to the **repo root** (`app/`, `lib/`, `components/`) —
this project does **not** use a `src/` directory.

### Data layer — `lib/dgcp.ts` (the heart of the app)
Owns all DGCP types (`Proceso`, `Articulo`, `Documento`, `Contrato`,
`ContratoArticulo`) and access functions:
- `dgcpFetch<T>(path, params, revalidate)` — single wrapper for every upstream
  call: 25s timeout, **one retry**, and normalizes the API's quirks (`hasError`
  flag, `payload.content` arriving as `null`).
- `listProcesos(opts)` — **passthrough/paginated** when there is no `q`; when `q`
  is present it scans up to `MAX_SEARCH_PAGES` (6) × 1000 records within the date
  filters and filters **server-side**, accent/case-insensitively (via
  `normalize`) across título/descripción/unidad_compra/código/área. Returns
  `scanned`/`truncated` so the UI can warn when the scan didn't cover everything.
- `getProceso(codigo)` — fetches process + artículos + documentos + contratos in
  parallel (each failure tolerated independently).
- `getUnidadesCompra()` — ~705 active buying units (cached 24h).
- `getPreciosSubclase(subclase)` — historical contracted unit-price stats
  (min/median/max + examples) by UNSPSC subclass (cached 1h).

Cache windows by data type: listings 5 min, precios 1 h, unidades 24 h.

### API routes — `app/api/*` (all `export const dynamic = "force-dynamic"`)
Thin proxies that call a `lib/dgcp.ts` function inside try/catch and return
`502` on upstream failure: `procesos` (search/list), `precios?subclase=`
(validates `subclase` against a digit regex), `unidades`, and `feed` (renders an
**RSS 2.0** feed of the last 30 days for a saved search — the alerting mechanism).
**The pattern for any new data capability: add a function in `lib/dgcp.ts`, then
a force-dynamic route here that wraps it.**

### Pages — `app/`
- `/` → `app/buscador.tsx` (client) inside `<Suspense>`. Filters live entirely in
  the **URL** (`useSearchParams`) so any search is shareable/bookmarkable; it
  fetches `/api/procesos`. The `ESTADOS` and `MODALIDADES` enumerations are
  defined here and must match the DGCP vocabulary (default estado is
  `"Proceso publicado"`).
- `/procesos/[codigo]` → server detail page, with `precios.tsx` (client),
  `loading.tsx`, `not-found.tsx`.
- `/proveedores/[rpe]` → supplier profile.
- `/estadisticas` → 30-day market dashboard. `/guia` → static bidder guide.
- `/seguimiento` → starred processes.

### Client state — `lib/seguimiento.ts`
Starred process codes in `localStorage` (key `lrd:seguimiento`). Cross-tab and
in-page updates propagate via a custom `lrd:seguimiento-cambio` event plus the
native `storage` event — subscribe with `onSeguimientoCambio`.

### Formatting — `lib/format.ts`
`formatMonto` (Intl es-DO currency), `formatFecha` (fixed `America/Santo_Domingo`
timezone — keep dates deterministic), `diasHasta`.

## Conventions
- All user-facing copy is Spanish (es-DO).
- This is an independent, unofficial tool — the footer and metadata say so; keep
  that framing.
- Tailwind v4 via the `@tailwindcss/postcss` plugin; tokens/utilities come from
  `app/globals.css`.
