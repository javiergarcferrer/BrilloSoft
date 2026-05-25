@AGENTS.md

# BrilloSoft — project notes

Operations CRM for a cleaning company (coordinator + quoting + accountant +
admin). **Vercel-only MVP: no backend.** State is a persisted Zustand store
seeded with sample data.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also typechecks + lints)
- `npx tsc --noEmit` — typecheck only

## Architecture

- `src/lib/types.ts` — domain model (Team, Quote, Client, Service, …). The
  single source of truth; Supabase tables should mirror these 1:1.
- `src/lib/store.ts` — Zustand + `persist` (localStorage key
  `brillosoft-store-v1`). Action names (`acceptQuote`, `generateServicesForClient`,
  `markDigitized`, …) are the seam to swap in Supabase later.
- `src/lib/colors.ts` — neuropsychological status colors. **Class strings must
  stay literal** so Tailwind's scanner emits them.
- `src/lib/selectors.ts` / `recurrence.ts` — derived metrics & schedule math.
- Pages are thin server wrappers around `*-view.tsx` client components.
- Data-driven UI is gated on `useHydrated()` (renders skeletons first) so SSR
  and the first client render match.

## Conventions

- Tailwind v4, theme in `globals.css` (`brand` scale + surfaces). No tailwind.config.
- Use the `ui/` primitives; don't hand-roll buttons/inputs/drawers.
- Keep everything responsive (mobile bottom-nav + desktop sidebar in `layout/`).
