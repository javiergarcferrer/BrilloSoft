# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Gobiername.data** — a Spanish-language (es-DO) intelligence platform over
Dominican state data. It covers three domains, each a thin cached front end over
a public source:

| Domain | Route | Source | Data layer |
|---|---|---|---|
| Compras públicas | `/licitaciones` | DGCP open-data API | `lib/dgcp.ts` |
| Congreso Nacional | `/congreso` | SIL de la Cámara de Diputados | `lib/congreso.ts` |
| Nómina estatal | `/nomina` | Static payroll snapshot | `lib/nomina.ts` |

`/` is the **panorama**: live cross-domain indicators plus the signals that need
attention now (tenders closing this week, initiatives about to lapse).
`/fuentes` declares what feeds the platform, what is blocked and with which
coverage limits — keep it truthful when sources change.

**There is no database and no environment variables** — all data is fetched live
and cached via Next's fetch `revalidate`. Never introduce a DB, API keys, or
secrets.

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
The lockfile pins **Next 15**; build against it (`npm ci`) — Turbopack on 16
tolerates things webpack on 15 rejects, such as `node:` imports reaching a
client bundle.

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

### Congreso data layer — `lib/congreso.ts`
Same contract as `lib/dgcp.ts`. The SIL is the portal's **internal** API, not a
documented public one, so three rules are enforced in `silFetch`:
1. **A `200` does not mean the route exists** — IIS serves the SPA shell (HTML,
   status 200) for unknown paths under `/sil/`, so `content-type` is validated
   on every response, never the status code.
2. **GET only.** The SIL's single write endpoint is never touched.
3. Identifiable User-Agent, 25s timeout, one retry, conservative concurrency.

It also owns legislature arithmetic (`evaluarPerencion`: 150-day terms opening
27 Feb and 16 Aug, 30-day warning window) and `muestrearIniciativas`, a bounded
sample — the SIL pages 10 at a time with no aggregates, so sweeping its ~622
pages per render is not viable. Views that use a sample must say so.

Field quirks worth keeping: `condicion` and `estado` are two coexisting
taxonomies; `numero` (`06225-2024-2028-CD`) is a **citation**, not a stable id,
because it carries the registration period; the reformulated title is buried
inside `descripcion` behind a `TÍTULO MODIFICADO:` marker. See `RECON.md` for
the full reconnaissance.

### Pages — `app/`
- `/` → panorama (server). `/licitaciones` → `app/buscador.tsx` (client) inside
  `<Suspense>`. Filters live entirely in
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
