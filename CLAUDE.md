@AGENTS.md

# LicitaRD — project notes

**LicitaRD** is a public-procurement intelligence platform for the Dominican
Republic: search, organize and track government tenders (_licitaciones_) from
the DGCP Portal Transaccional. **Static Vercel deployment, no backend** — all
user state (tracked tenders, saved searches) lives in `localStorage`; the data
layer is typed so a live DGCP/OCDS feed can be dropped in behind it.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (Turbopack; also typechecks)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck only

## Architecture

- Next.js 16 App Router, React 19, Tailwind v4, framer-motion, lucide-react.
- **Domain layer** `src/lib/licitaciones/`:
  - `types.ts` — domain model (Licitacion, Institucion, Categoria, filters,
    tracking stages, capability profile).
  - `data.ts` — **single source of truth** for sample tenders, institutions,
    categories, provinces and the default capability profile + `PLATFORM` copy.
  - `utils.ts` — formatters (DOP/USD, es-DO dates), lookups, affinity scoring
    (`puntuacionAfinidad` 0-100), search/filter/sort. `HOY` pins "today" for
    deterministic SSR of relative deadlines — swap for `new Date()` when live.
  - `store.tsx` — client store via `useSyncExternalStore` + localStorage
    (`useTracker`): tracked tenders w/ stage + note, saved searches w/ alerts.
- **Routes**: `/` dashboard, `/buscar` explorer (reads `?q`/`?cat`/`?orden`),
  `/licitacion/[id]` detail (SSG via `generateStaticParams`), `/seguimiento`
  kanban board, `/analitica` market analytics.
- **Components** `src/components/licita/`: app-header (⌘K trigger),
  command-palette, tender-card, search-explorer (filters + facets),
  tracking-board, analytics-charts, score-ring, badges, etc.
- `src/app/layout.tsx` — fonts (Fraunces display + Inter sans), metadata/SEO,
  wraps the app in `TrackerProvider` + header/footer + `CommandPalette`.
- SEO: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `app/icon.svg`.

## Conventions

- Tailwind v4 with tokens in `globals.css` `@theme`: institutional `brand` blue,
  electric `accent` cyan, status palette (`open`/`soon`/`closed`/`awarded` with
  `-soft` variants). **Keep class strings literal** so Tailwind's scanner emits
  them — no dynamic class construction.
- Copy is Spanish (es-DO). Display serif (Fraunces) for headings, sans body.
- Server Components by default; mark Client Components (`"use client"`) only for
  interactivity (store, command palette, explorer, charts, counters).
- Never pass functions as props from Server → Client Components (use serializable
  string modes, e.g. `StatCounter` `format="money"`).
- No setState inside effect bodies (lint-enforced) — hydration uses
  `useSyncExternalStore`; "is hydrated" is a snapshot, not an effect flag.
